import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import ClientShell from '../../components/client/ClientShell'
import { INTL_LOCALE } from '../../components/booking/intl'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type {
  ClientPortalLoyaltyOut,
  ClientPortalManageLinkOut,
  ClientPortalQuestionnaireOut,
  ClientPortalQuestionnairesOut,
  ClientPortalSessionInfoOut,
  ClientPortalVisitOut,
  ClientPortalVisitsOut,
} from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'
import { clearPortalToken, portalHeaders, readPortalToken } from '../../utils/portalSession'

const STATUS_KEYS: Record<string, TranslationKey> = {
  planned: 'bookingManage.status.planned',
  completed: 'bookingManage.status.completed',
  cancelled: 'bookingManage.status.cancelled',
  in_progress: 'bookingManage.status.in_progress',
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

function answerText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(answerText).filter(Boolean).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const key = STATUS_KEYS[status]
  const tone =
    status === 'planned'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : status === 'in_progress'
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300'
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {key ? t(key) : status}
    </span>
  )
}

function SignedOut() {
  const { t } = useTranslation()
  return (
    <ClientShell title={t('portal.title')}>
      <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
        <h1 className="text-xl font-semibold">{t('portal.sessionExpiredTitle')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-gray-400">
          {t('portal.sessionExpiredText')}
        </p>
        <Link
          to="/client/portal"
          className="mt-5 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('portal.goToLogin')}
        </Link>
      </section>
    </ClientShell>
  )
}

function VisitCard({
  visit,
  timezone,
  currency,
  bookingSlug,
  bookingEnabled,
  managing,
  onManage,
}: {
  visit: ClientPortalVisitOut
  timezone: string
  currency: Currency
  bookingSlug: string | null
  bookingEnabled: boolean
  managing: boolean
  onManage: (visit: ClientPortalVisitOut) => void
}) {
  const { t, locale } = useTranslation()
  const canBookAgain = bookingEnabled && Boolean(bookingSlug) && visit.service_id !== null

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{visit.service_name || t('portal.visitNumber') + ` #${visit.id}`}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">
            {formatDateTime(visit.date_start, timezone, locale)}
          </p>
          {visit.staff_name && (
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{visit.staff_name}</p>
          )}
        </div>
        <StatusBadge status={visit.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">
          {visit.price === null || visit.price === undefined
            ? t('booking.priceOnRequest')
            : formatCurrency(visit.price, currency)}
        </span>
        <div className="flex flex-wrap gap-2">
          {visit.can_manage && (
            <button
              type="button"
              disabled={managing}
              onClick={() => onManage(visit)}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {managing ? t('portal.openingManage') : t('portal.manage')}
            </button>
          )}
          {canBookAgain && (
            <Link
              to={`/booking/${encodeURIComponent(bookingSlug ?? '')}?service=${visit.service_id}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {t('portal.bookAgain')}
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Portal() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [token, setToken] = useState(readPortalToken)
  const [expired, setExpired] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [managingId, setManagingId] = useState<number | null>(null)
  const [manageError, setManageError] = useState('')

  const sessionQuery = useQuery<ClientPortalSessionInfoOut>({
    queryKey: ['client-portal', 'session', token],
    queryFn: async () => {
      const { data } = await api.get('/public/client-portal/session', { headers: portalHeaders(token ?? '') })
      return data
    },
    enabled: Boolean(token),
    retry: false,
  })

  const visitsQuery = useQuery<ClientPortalVisitsOut>({
    queryKey: ['client-portal', 'visits', token],
    queryFn: async () => {
      let offset = 0
      let result: ClientPortalVisitsOut | undefined
      const ids = new Set<number>()
      while (offset <= 1000000) {
        const { data } = await api.get<ClientPortalVisitsOut>('/public/client-portal/visits', {
          headers: portalHeaders(token ?? ''), params: { limit: 100, offset },
        })
        for (const visit of [...data.upcoming, ...data.past]) {
          if (ids.has(visit.id)) throw new Error('Portal visits changed during loading')
          ids.add(visit.id)
        }
        if (!result) result = { ...data, upcoming: [], past: [] }
        result.upcoming.push(...data.upcoming)
        result.past.push(...data.past)
        if (data.next_offset == null) return { ...result, next_offset: null }
        const count = data.upcoming.length + data.past.length
        if (count === 0 || data.next_offset !== offset + count || data.next_offset > 1000000) {
          throw new Error('Incomplete portal visits')
        }
        offset = data.next_offset
      }
      throw new Error('Incomplete portal visits')
    },
    enabled: Boolean(token),
    retry: false,
  })

  const loyaltyQuery = useQuery<ClientPortalLoyaltyOut>({
    queryKey: ['client-portal', 'loyalty', token],
    queryFn: async () => {
      const { data } = await api.get('/public/client-portal/loyalty', { headers: portalHeaders(token ?? '') })
      return data
    },
    enabled: Boolean(token),
    retry: false,
  })

  const formsQuery = useQuery<ClientPortalQuestionnairesOut>({
    queryKey: ['client-portal', 'questionnaires', token],
    queryFn: async () => {
      const { data } = await api.get('/public/client-portal/questionnaires', {
        headers: portalHeaders(token ?? ''),
      })
      return data
    },
    enabled: Boolean(token),
    retry: false,
  })

  const queries = [sessionQuery, visitsQuery, loyaltyQuery, formsQuery]
  const unauthorized = queries.some((query) => apiErrorStatus(query.error) === 401)

  useEffect(() => {
    if (!unauthorized) return
    clearPortalToken()
    queryClient.removeQueries({ queryKey: ['client-portal'] })
    setToken(null)
    setExpired(true)
  }, [unauthorized, queryClient])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await api.post('/public/client-portal/logout', undefined, {
        headers: portalHeaders(token ?? ''),
      })
    } catch {
      // the local credential is cleared even when the server cannot be reached
    }
    clearPortalToken()
    queryClient.removeQueries({ queryKey: ['client-portal'] })
    navigate('/client/portal', { replace: true })
  }

  const handleManage = async (visit: ClientPortalVisitOut) => {
    if (!token || managingId !== null) return
    setManageError('')
    setManagingId(visit.id)
    try {
      const { data } = await api.post<ClientPortalManageLinkOut>(
        `/public/client-portal/visits/${visit.id}/manage-link`,
        undefined,
        { headers: portalHeaders(token) },
      )
      navigate({ pathname: '/manage', hash: `#token=${encodeURIComponent(data.token)}` })
    } catch (error) {
      setManageError(apiErrorMessage(error, t('portal.manageError')))
    } finally {
      setManagingId(null)
    }
  }

  if (!token || expired) return <SignedOut />

  if (queries.some((query) => query.isLoading)) {
    return (
      <ClientShell title={t('portal.title')}>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </ClientShell>
    )
  }

  if (queries.some((query) => query.isError)) {
    return (
      <ClientShell title={t('portal.title')}>
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <p>{t('portal.loadError')}</p>
          <button
            type="button"
            onClick={() => void queryClient.invalidateQueries({ queryKey: ['client-portal'] })}
            className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
          >
            {t('common.retry')}
          </button>
        </section>
      </ClientShell>
    )
  }

  const session = sessionQuery.data
  const visits = visitsQuery.data
  const loyalty = loyaltyQuery.data
  const forms = formsQuery.data
  if (!session || !visits || !loyalty || !forms) return <SignedOut />

  const currency = visits.currency as Currency
  const points = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 2 }).format(
    loyalty.points,
  )
  const hasLoyalty = loyalty.points !== 0 || loyalty.cashback !== 0 || Boolean(loyalty.level_name)

  const renderVisit = (visit: ClientPortalVisitOut) => (
    <VisitCard
      key={visit.id}
      visit={visit}
      timezone={visits.timezone}
      currency={currency}
      bookingSlug={visits.booking_slug ?? null}
      bookingEnabled={visits.booking_enabled}
      managing={managingId === visit.id}
      onManage={(item) => void handleManage(item)}
    />
  )

  return (
    <ClientShell
      title={t('portal.title')}
      actions={
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {t('portal.logout')}
        </button>
      }
    >
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('portal.signedInAs')}</p>
        <h1 className="mt-1 text-2xl font-bold">{session.client_name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{session.business_name}</p>
        {!visits.booking_enabled && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {t('portal.bookingDisabled')}
          </p>
        )}
      </section>

      {manageError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          {manageError}
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t('portal.upcoming')}</h2>
        <div className="mt-3 space-y-3">
          {visits.upcoming.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
              {t('portal.noUpcoming')}
            </p>
          ) : (
            visits.upcoming.map(renderVisit)
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">{t('portal.manageHint')}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t('portal.past')}</h2>
        <div className="mt-3 space-y-3">
          {visits.past.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
              {t('portal.noPast')}
            </p>
          ) : (
            visits.past.map(renderVisit)
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <h2 className="text-lg font-semibold">{t('portal.loyalty.title')}</h2>
          {!hasLoyalty ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">{t('portal.loyalty.empty')}</p>
          ) : (
            <dl className="mt-3 divide-y divide-slate-100 text-sm dark:divide-gray-700">
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500 dark:text-gray-400">{t('portal.loyalty.points')}</dt>
                <dd className="font-semibold">{points}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500 dark:text-gray-400">{t('portal.loyalty.cashback')}</dt>
                <dd className="font-semibold">{formatCurrency(loyalty.cashback, currency)}</dd>
              </div>
              {loyalty.level_name && (
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-slate-500 dark:text-gray-400">{t('portal.loyalty.level')}</dt>
                  <dd className="text-right font-medium">{loyalty.level_name}</dd>
                </div>
              )}
              {loyalty.level_benefits && (
                <div className="py-2">
                  <dt className="text-slate-500 dark:text-gray-400">{t('portal.loyalty.benefits')}</dt>
                  <dd className="mt-1 whitespace-pre-line">{loyalty.level_benefits}</dd>
                </div>
              )}
            </dl>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <h2 className="text-lg font-semibold">{t('portal.forms.title')}</h2>
          {forms.items.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">{t('portal.forms.empty')}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {forms.items.map((form: ClientPortalQuestionnaireOut) => (
                <details
                  key={form.id}
                  className="rounded-lg border border-slate-200 p-3 dark:border-gray-700"
                >
                  <summary className="cursor-pointer text-sm font-medium">
                    {form.name}
                    <span className="ml-2 text-xs font-normal text-slate-500 dark:text-gray-400">
                      {formatDate(form.submitted_at, locale)}
                    </span>
                  </summary>
                  <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">
                    {t('portal.forms.version')} {form.version}
                  </p>
                  <dl className="mt-2 space-y-1 text-sm">
                    {form.fields.map((field, index) => {
                      const key = typeof field.key === 'string' ? field.key : ''
                      const label =
                        typeof field.label === 'string' && field.label
                          ? field.label
                          : key || `${t('portal.forms.answers')} ${index + 1}`
                      const value = answerText(key ? form.answers[key] : '')
                      return (
                        <div key={`${form.id}-${key || index}`} className="flex justify-between gap-3">
                          <dt className="text-slate-500 dark:text-gray-400">{label}</dt>
                          <dd className="text-right font-medium">{value || '—'}</dd>
                        </div>
                      )
                    })}
                  </dl>
                  {form.fields.length === 0 && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
                      {t('portal.forms.noAnswers')}
                    </p>
                  )}
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </ClientShell>
  )
}
