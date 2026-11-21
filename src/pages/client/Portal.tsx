import { useEffect, useState, type ReactNode } from 'react'
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
import StatusBadge from '../../ui/StatusBadge'
import { VISIT_STATUS_TONE } from '../../utils/statusPill'

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

function VisitStatus({ status }: { status: string }) {
  const { t } = useTranslation()
  const key = STATUS_KEYS[status]
  return (
    <StatusBadge tone={VISIT_STATUS_TONE[status] ?? 'neutral'} className="px-3 py-1">
      {key ? t(key) : status}
    </StatusBadge>
  )
}

function SectionState({ query, children }: {
  query: { isPending: boolean; isError: boolean; refetch: () => unknown }
  children?: ReactNode
}) {
  const { t } = useTranslation()
  if (query.isPending) return <div className="flex justify-center py-8"><LoadingSpinner /></div>
  if (query.isError) return <div role="alert" className="mt-3 rounded-xl bg-[var(--tint-red)] p-4 text-sm text-[var(--tint-red-ink)]">
    <p>{t('portal.loadError')}</p>
    <button type="button" onClick={() => void query.refetch()}
      className="mt-3 rounded-md border border-current px-4 py-2 font-medium">{t('common.retry')}</button>
  </div>
  return <>{children}</>
}

function SignedOut() {
  const { t } = useTranslation()
  return (
    <ClientShell title={t('portal.title')}>
      <section className="ui-card p-8 text-center">
        <h1 className="text-xl font-semibold">{t('portal.sessionExpiredTitle')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--workspace-muted)]">
          {t('portal.sessionExpiredText')}
        </p>
        <Link
          to="/client/portal"
          className="mt-5 inline-block ui-button ui-button-primary"
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
    <article className="ui-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{visit.service_name || t('portal.visitNumber') + ` #${visit.id}`}</h3>
          <p className="mt-1 text-sm text-[var(--workspace-muted)]">
            {formatDateTime(visit.date_start, timezone, locale)}
          </p>
          {visit.staff_name && (
            <p className="mt-1 text-sm text-[var(--workspace-muted)]">{visit.staff_name}</p>
          )}
        </div>
        <VisitStatus status={visit.status} />
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
              className="ui-button ui-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {managing ? t('portal.openingManage') : t('portal.manage')}
            </button>
          )}
          {canBookAgain && (
            <Link
              to={`/booking/${encodeURIComponent(bookingSlug ?? '')}?service=${visit.service_id}`}
              className="ui-button ui-button-secondary"
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

  if (!token || expired || unauthorized) return <SignedOut />

  const logoutButton = <button type="button" onClick={() => void handleLogout()} disabled={loggingOut}
    className="ui-button ui-button-secondary disabled:opacity-50">
    {t('portal.logout')}
  </button>

  const session = sessionQuery.data
  const visits = visitsQuery.data
  const loyalty = loyaltyQuery.data
  const forms = formsQuery.data
  if (!session) return <ClientShell title={t('portal.title')} actions={logoutButton}>
    <SectionState query={sessionQuery} />
  </ClientShell>

  // Currency belongs to the visits response; don't guess one if that section is down.
  const currency = visits?.currency as Currency | undefined
  const points = loyalty && new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 2 }).format(loyalty.points)
  const hasLoyalty = loyalty && (loyalty.points !== 0 || loyalty.cashback !== 0 || Boolean(loyalty.level_name))

  const renderVisit = (visit: ClientPortalVisitOut) => {
    if (!visits) return null
    return <VisitCard
      key={visit.id}
      visit={visit}
      timezone={visits.timezone}
      currency={visits.currency as Currency}
      bookingSlug={visits.booking_slug ?? null}
      bookingEnabled={visits.booking_enabled}
      managing={managingId === visit.id}
      onManage={(item) => void handleManage(item)}
    />
  }

  return (
    <ClientShell
      title={t('portal.title')}
      actions={logoutButton}
    >
      <section className="ui-card p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--workspace-subtle)]">{t('portal.signedInAs')}</p>
        <h1 className="mt-1 text-2xl font-bold">{session.client_name}</h1>
        <p className="mt-1 text-sm text-[var(--workspace-muted)]">{session.business_name}</p>
        {visits && !visits.booking_enabled && (
          <p className="mt-3 rounded-lg bg-[var(--tint-amber)] p-3 text-sm text-[var(--tint-amber-ink)]">
            {t('portal.bookingDisabled')}
          </p>
        )}
      </section>

      {manageError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] px-4 py-3 text-sm text-[var(--tint-red-ink)]"
        >
          {manageError}
        </div>
      )}

      <SectionState query={visitsQuery}>
        {visits && <>
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t('portal.upcoming')}</h2>
          <div className="mt-3 space-y-3">
            {visits.upcoming.length === 0 ? (
              <p className="rounded-xl bg-[var(--workspace-panel)] p-4 text-sm text-[var(--workspace-muted)] shadow-sm">
                {t('portal.noUpcoming')}
              </p>
            ) : (
              visits.upcoming.map(renderVisit)
            )}
          </div>
          <p className="mt-3 text-xs text-[var(--workspace-muted)]">{t('portal.manageHint')}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t('portal.past')}</h2>
          <div className="mt-3 space-y-3">
            {visits.past.length === 0 ? (
              <p className="rounded-xl bg-[var(--workspace-panel)] p-4 text-sm text-[var(--workspace-muted)] shadow-sm">
                {t('portal.noPast')}
              </p>
            ) : (
              visits.past.map(renderVisit)
            )}
          </div>
        </section>

        </>}
      </SectionState>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="ui-card p-5">
          <h2 className="text-lg font-semibold">{t('portal.loyalty.title')}</h2>
          <SectionState query={loyaltyQuery}>
            {loyalty && (!hasLoyalty ? (
              <p className="mt-3 text-sm text-[var(--workspace-muted)]">{t('portal.loyalty.empty')}</p>
            ) : (
              <dl className="mt-3 divide-y divide-[var(--workspace-line)] text-sm">
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-[var(--workspace-muted)]">{t('portal.loyalty.points')}</dt>
                  <dd className="font-semibold">{points}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2">
                  <dt className="text-[var(--workspace-muted)]">{t('portal.loyalty.cashback')}</dt>
                  <dd className="font-semibold">{currency ? formatCurrency(loyalty.cashback, currency) : '—'}</dd>
                </div>
                {loyalty.level_name && (
                  <div className="flex justify-between gap-3 py-2">
                    <dt className="text-[var(--workspace-muted)]">{t('portal.loyalty.level')}</dt>
                    <dd className="text-right font-medium">{loyalty.level_name}</dd>
                  </div>
                )}
                {loyalty.level_benefits && (
                  <div className="py-2">
                    <dt className="text-[var(--workspace-muted)]">{t('portal.loyalty.benefits')}</dt>
                    <dd className="mt-1 whitespace-pre-line">{loyalty.level_benefits}</dd>
                  </div>
                )}
              </dl>
            ))}
          </SectionState>
        </section>

        <section className="ui-card p-5">
          <h2 className="text-lg font-semibold">{t('portal.forms.title')}</h2>
          <SectionState query={formsQuery}>
            {forms && (forms.items.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--workspace-muted)]">{t('portal.forms.empty')}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {forms.items.map((form: ClientPortalQuestionnaireOut) => (
                  <details
                    key={form.id}
                    className="rounded-lg border border-[var(--workspace-line)] p-3"
                  >
                    <summary className="cursor-pointer text-sm font-medium">
                      {form.name}
                      <span className="ml-2 text-xs font-normal text-[var(--workspace-muted)]">
                        {formatDate(form.submitted_at, locale)}
                      </span>
                    </summary>
                    <p className="mt-2 text-xs text-[var(--workspace-muted)]">
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
                            <dt className="text-[var(--workspace-muted)]">{label}</dt>
                            <dd className="text-right font-medium">{value || '—'}</dd>
                          </div>
                        )
                      })}
                    </dl>
                    {form.fields.length === 0 && (
                      <p className="mt-2 text-sm text-[var(--workspace-muted)]">
                        {t('portal.forms.noAnswers')}
                      </p>
                    )}
                  </details>
                ))}
              </div>
            ))}
          </SectionState>
        </section>
      </div>
    </ClientShell>
  )
}
