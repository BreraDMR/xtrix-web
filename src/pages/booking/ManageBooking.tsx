import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../api/client'
import { useLinkToken } from '../../hooks/useLinkToken'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import FormError from '../../components/FormError'
import PublicShell from '../../components/public/PublicShell'
import LoadingSpinner from '../../components/LoadingSpinner'
import { INTL_LOCALE } from '../../components/booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type { PublicBookingManageOut, PublicBookingRescheduleIn } from '../../api/types'
import SaveToCabinet from '../../components/visitor/SaveToCabinet'
import { formatCurrency, type Currency } from '../../utils/currency'
import StatusBadge from '../../ui/StatusBadge'
import { VISIT_STATUS_TONE } from '../../utils/statusPill'

const TOKEN_KEY = 'booking_manage_token'
const CUTOFF_MS = 24 * 60 * 60 * 1000

const STATUS_KEYS: Record<string, TranslationKey> = {
  planned: 'bookingManage.status.planned',
  completed: 'bookingManage.status.completed',
  cancelled: 'bookingManage.status.cancelled',
  in_progress: 'bookingManage.status.in_progress',
}

type BusyAction = 'confirm' | 'reschedule' | 'cancel' | null

function initialToken(): string | null {
  const hadFragment = window.location.hash.length > 1
  let fromHash = ''
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    fromHash = params.get('token') ?? ''
    if (!fromHash && window.location.hash.length > 1 && !window.location.hash.includes('=')) {
      fromHash = window.location.hash.slice(1)
    }
  } catch {
    fromHash = ''
  }
  const token = fromHash.trim()
  if (token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      // private windows may reject storage, the page still works
    }
    try {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
    } catch {
      // ignore
    }
    return token
  }
  if (hadFragment) {
    try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* storage may be unavailable */ }
    return null
  }
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function localInputValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateTime(iso: string, timeZone: string, locale: 'en' | 'ru' | 'cz'): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso))
}

function formatDate(iso: string, locale: 'en' | 'ru' | 'cz'): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: 'medium' }).format(new Date(iso))
}

function tokenHeaders(token: string) {
  return { 'X-Booking-Token': token }
}

function PublicFrame({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return <PublicShell title={t('bookingManage.title')}>{children}</PublicShell>
}

function Unavailable() {
  const { t } = useTranslation()
  return (
    <PublicFrame>
      <section className="ui-card p-8 text-center">
        <h1 className="text-xl font-semibold">{t('bookingManage.unavailableTitle')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--workspace-muted)]">
          {t('bookingManage.unavailableText')}
        </p>
      </section>
    </PublicFrame>
  )
}

function LoadError({ error, retry }: { error: unknown; retry: () => unknown }) {
  const { t } = useTranslation()
  return (
    <PublicFrame>
      <section
        role="alert"
        className="rounded-2xl border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] p-6 text-[var(--tint-red-ink)]"
      >
        <p>{apiErrorMessage(error, t('bookingManage.loadError'))}</p>
        <button
          type="button"
          onClick={() => void retry()}
          className="mt-3 rounded-md border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] px-4 py-2 text-sm font-medium hover:bg-[color-mix(in_srgb,var(--tint-red-ink)_12%,var(--tint-red))]"
        >
          {t('common.retry')}
        </button>
      </section>
    </PublicFrame>
  )
}

function VisitStatus({ status }: { status: string }) {
  const { t } = useTranslation()
  const key = STATUS_KEYS[status]
  const label = key ? t(key) : status
  return <StatusBadge tone={VISIT_STATUS_TONE[status] ?? 'neutral'} className="px-3 py-1">{label}</StatusBadge>
}

export default function ManageBookingPage() {
  const token = useLinkToken(initialToken)
  return <ManageBookingSession key={token ?? 'missing'} token={token} />
}

function ManageBookingSession({ token }: { token: string | null }) {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<BusyAction>(null)
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const [showReschedule, setShowReschedule] = useState(false)
  const [newStart, setNewStart] = useState('')
  const [rescheduleError, setRescheduleError] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)
  const actionLock = useRef(false)

  const query = useQuery<PublicBookingManageOut>({
    queryKey: ['manage-booking', token],
    queryFn: async () => {
      const { data } = await api.get('/public/booking-management', {
        headers: tokenHeaders(token ?? ''),
      })
      return data
    },
    enabled: Boolean(token),
    retry: false,
  })

  const booking = query.data
  const startMs = booking ? new Date(booking.start).getTime() : 0
  const started = Boolean(booking) && startMs <= Date.now()
  const cutoffReached = Boolean(booking) && startMs - Date.now() < CUTOFF_MS
  const canManage = booking?.status === 'planned' && !started
  const canChange = canManage && !cutoffReached
  const canConfirm = canManage && !booking?.confirmed_at

  const applyBooking = (updated: PublicBookingManageOut) => {
    queryClient.setQueryData(['manage-booking', token], updated)
  }

  const beginAction = (action: Exclude<BusyAction, null>): boolean => {
    if (actionLock.current) return false
    actionLock.current = true
    setBusy(action)
    setNotice('')
    setActionError('')
    return true
  }

  const endAction = () => {
    actionLock.current = false
    setBusy(null)
  }

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<PublicBookingManageOut>(
        '/public/booking-management/confirm',
        undefined,
        { headers: tokenHeaders(token ?? '') },
      )
      return data
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: async (start: string) => {
      const payload: PublicBookingRescheduleIn = { start }
      const { data } = await api.post<PublicBookingManageOut>(
        '/public/booking-management/reschedule',
        payload,
        { headers: tokenHeaders(token ?? '') },
      )
      return data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<PublicBookingManageOut>(
        '/public/booking-management/cancel',
        undefined,
        { headers: tokenHeaders(token ?? '') },
      )
      return data
    },
  })

  if (!token) return <Unavailable />

  if (query.isLoading) {
    return (
      <PublicFrame>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </PublicFrame>
    )
  }

  if (query.isError) {
    if (apiErrorStatus(query.error) === 404) return <Unavailable />
    return <LoadError error={query.error} retry={query.refetch} />
  }

  if (!booking) return <Unavailable />

  const handleConfirm = async () => {
    if (!beginAction('confirm')) return
    try {
      const updated = await confirmMutation.mutateAsync()
      applyBooking(updated)
      setNotice(t('bookingManage.confirmed'))
    } catch (error) {
      setActionError(apiErrorMessage(error, t('bookingManage.confirmError')))
    } finally {
      endAction()
    }
  }

  const openReschedule = () => {
    setShowReschedule(true)
    setCancelOpen(false)
    setRescheduleError('')
    setActionError('')
    setNotice('')
    setNewStart(localInputValue(booking.start))
  }

  const handleReschedule = async (event: FormEvent) => {
    event.preventDefault()
    setRescheduleError('')
    const target = new Date(newStart)
    if (!newStart || Number.isNaN(target.getTime())) {
      setRescheduleError(t('bookingManage.error.timeRequired'))
      return
    }
    if (target.getTime() <= Date.now()) {
      setRescheduleError(t('bookingManage.error.timePast'))
      return
    }
    if (target.getTime() === new Date(booking.start).getTime()) {
      setRescheduleError(t('bookingManage.error.sameTime'))
      return
    }
    if (!beginAction('reschedule')) return
    try {
      const updated = await rescheduleMutation.mutateAsync(target.toISOString())
      applyBooking(updated)
      setShowReschedule(false)
      setNewStart('')
      setNotice(t('bookingManage.rescheduled'))
    } catch (error) {
      setRescheduleError(apiErrorMessage(error, t('bookingManage.rescheduleError')))
    } finally {
      endAction()
    }
  }

  const openCancel = () => {
    setCancelOpen(true)
    setShowReschedule(false)
    setRescheduleError('')
    setActionError('')
    setNotice('')
  }

  const handleCancel = async () => {
    if (!beginAction('cancel')) return
    try {
      const updated = await cancelMutation.mutateAsync()
      applyBooking(updated)
      setCancelOpen(false)
      setShowReschedule(false)
      setNotice(t('bookingManage.cancelled'))
    } catch (error) {
      setActionError(apiErrorMessage(error, t('bookingManage.cancelError')))
    } finally {
      endAction()
    }
  }

  const preview = (() => {
    if (!newStart) return ''
    const date = new Date(newStart)
    if (Number.isNaN(date.getTime())) return ''
    return formatDateTime(date.toISOString(), booking.timezone, locale)
  })()

  return (
    <PublicFrame>
      <section className="ui-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--workspace-subtle)]">{t('bookingManage.title')}</p>
            <h1 className="mt-1 text-2xl font-bold">{booking.business_name}</h1>
            {booking.business_address && (
              <p className="mt-1 text-sm text-[var(--workspace-muted)]">{booking.business_address}</p>
            )}
            {booking.business_phone && (
              <a
                className="mt-1 inline-block text-sm text-[var(--workspace-accent)] hover:underline"
                href={`tel:${booking.business_phone}`}
              >
                {booking.business_phone}
              </a>
            )}
          </div>
          <VisitStatus status={booking.status} />
        </div>

        <dl className="mt-6 divide-y divide-[var(--workspace-line)] text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.bookingNumber')}</dt>
            <dd className="text-right font-semibold">#{booking.booking_id}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.service')}</dt>
            <dd className="text-right font-medium">{booking.service_name}</dd>
          </div>
          {booking.staff_name && (
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-[var(--workspace-muted)]">{t('booking.master')}</dt>
              <dd className="text-right font-medium">{booking.staff_name}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.dateTime')}</dt>
            <dd className="text-right font-medium">
              {formatDateTime(booking.start, booking.timezone, locale)}
              <span className="mt-1 block text-xs font-normal text-[var(--workspace-muted)]">
                {booking.timezone}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.price')}</dt>
            <dd className="text-right font-medium">
              {booking.price === null || booking.price === undefined
                ? t('booking.priceOnRequest')
                : formatCurrency(booking.price, booking.currency as Currency)}
            </dd>
          </div>
          {booking.confirmed_at && (
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-[var(--workspace-muted)]">{t('bookingManage.confirmedAt')}</dt>
              <dd className="text-right font-medium">{formatDateTime(booking.confirmed_at, booking.timezone, locale)}</dd>
            </div>
          )}
        </dl>

        <p className="mt-4 text-xs text-[var(--workspace-subtle)]">
          {t('bookingManage.linkValidUntil')} {formatDate(booking.token_expires_at, locale)}
        </p>
      </section>

      <SaveToCabinet manageToken={token} />

      {notice && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--tint-green-ink)_25%,transparent)] bg-[var(--tint-green)] px-4 py-3 text-sm text-[var(--tint-green-ink)]"
        >
          {notice}
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] px-4 py-3 text-sm text-[var(--tint-red-ink)]"
        >
          {actionError}
        </div>
      )}

      {booking.status === 'planned' && (
        <section className="mt-4 ui-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">{t('bookingManage.actions')}</h2>

          {started ? (
            <p className="mt-3 text-sm text-[var(--workspace-muted)]">{t('bookingManage.started')}</p>
          ) : (
            <>
              {canManage && (
                <p className="mt-2 text-sm text-[var(--workspace-muted)]">
                  {cutoffReached ? t('bookingManage.cutoffReached') : t('bookingManage.cutoffNote')}
                </p>
              )}

              {!showReschedule && !cancelOpen && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {canConfirm && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void handleConfirm()}
                      className="ui-button ui-button-primary"
                    >
                      {busy === 'confirm' ? t('bookingManage.confirming') : t('bookingManage.confirm')}
                    </button>
                  )}
                  {canChange && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={openReschedule}
                      className="ui-button ui-button-secondary"
                    >
                      {t('bookingManage.reschedule')}
                    </button>
                  )}
                  {canChange && (
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={openCancel}
                      className="ui-button ui-button-danger"
                    >
                      {t('bookingManage.cancel')}
                    </button>
                  )}
                </div>
              )}

              {showReschedule && (
                <form onSubmit={(event) => void handleReschedule(event)} className="mt-4 rounded-xl border border-[var(--workspace-line)] p-4">
                  <h3 className="text-sm font-semibold">{t('bookingManage.rescheduleTitle')}</h3>
                  <label htmlFor="manage-new-start" className="mt-3 block text-sm font-medium">
                    {t('bookingManage.newTime')}
                  </label>
                  <input
                    id="manage-new-start"
                    type="datetime-local"
                    value={newStart}
                    min={localInputValue(new Date().toISOString())}
                    onChange={(event) => {
                      setNewStart(event.target.value)
                      setRescheduleError('')
                    }}
                    className="mt-1 w-full rounded-md border border-[var(--workspace-control)] bg-[var(--workspace-panel)] px-3 py-2 text-sm sm:max-w-xs"
                  />
                  <p className="mt-2 text-xs text-[var(--workspace-muted)]">{t('bookingManage.newTimeHint')}</p>
                  {preview && (
                    <p className="mt-2 text-xs text-[var(--workspace-muted)]">
                      {t('bookingManage.salonTime')}: <span className="font-medium">{preview}</span>
                    </p>
                  )}
                  {rescheduleError && <FormError message={rescheduleError} />}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={busy !== null}
                      className="ui-button ui-button-primary"
                    >
                      {busy === 'reschedule' ? t('bookingManage.rescheduling') : t('bookingManage.submitReschedule')}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => {
                        setShowReschedule(false)
                        setRescheduleError('')
                      }}
                      className="ui-button ui-button-secondary"
                    >
                      {t('booking.back')}
                    </button>
                  </div>
                </form>
              )}

              {cancelOpen && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] p-4 text-[var(--tint-red-ink)]"
                >
                  <p className="text-sm font-medium">{t('bookingManage.cancelQuestion')}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void handleCancel()}
                      className="ui-button ui-button-danger"
                    >
                      {busy === 'cancel' ? t('bookingManage.cancelling') : t('bookingManage.cancelConfirm')}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => setCancelOpen(false)}
                      className="ui-button ui-button-secondary"
                    >
                      {t('bookingManage.cancelKeep')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </PublicFrame>
  )
}
