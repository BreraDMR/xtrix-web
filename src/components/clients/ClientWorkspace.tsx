import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { HiArrowLeft, HiPrinter } from 'react-icons/hi'
import api from '../../api/client'
import { apiErrorStatus, apiErrorMessage } from '../../api/errors'
import { useTranslation } from '../../hooks/useTranslation'
import { useLabels } from '../../i18n/labels'
import { useMyBusiness } from '../../hooks/useMyBusiness'
import { formatCurrency, type Currency } from '../../utils/currency'
import { showDay, showZonedDateTime } from '../../utils/dates'
import Button from '../../ui/Button'
import Card from '../../ui/Card'
import LoadingSpinner from '../LoadingSpinner'
import QueryError from '../QueryError'
import ClientForm from '../ClientForm'
import ClientPersonalReportModal from '../ClientPersonalReportModal'
import ClientNotes from './ClientNotes'
import ClientTags from './ClientTags'
import type {
  ClientOut,
  ClientOverviewOut,
  ClientOverviewVisit,
  QuestionnaireAnswersOut,
  QuestionnaireAttachmentOut,
} from '../../api/types'

function formatDateTime(iso: string, timeZone?: string) {
  return timeZone ? showZonedDateTime(iso, timeZone) : new Date(iso).toLocaleString()
}

function formatAnswer(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function VisitDetails({ visitId }: { visitId: number }) {
  const { t } = useTranslation()
  const questionnaire = useQuery<QuestionnaireAnswersOut | null>({
    queryKey: ['visit-questionnaire', visitId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/visits/${visitId}/questionnaire`)
        return data
      } catch (error) {
        if (apiErrorStatus(error) === 404) return null
        throw error
      }
    },
    retry: false,
  })
  const attachments = useQuery<QuestionnaireAttachmentOut[]>({
    queryKey: ['visit-attachments', visitId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/visits/${visitId}/questionnaire/attachments`)
        return data
      } catch (error) {
        if (apiErrorStatus(error) === 404) return []
        throw error
      }
    },
    retry: false,
  })

  return (
    <div className="mt-3 grid gap-4 border-t border-[var(--workspace-line)] pt-3 md:grid-cols-2">
      <section aria-label={t('clientWorkspace.questionnaire')}>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--workspace-muted)]">
          {t('clientWorkspace.questionnaire')}
        </h4>
        {questionnaire.isLoading ? (
          <LoadingSpinner size="sm" />
        ) : questionnaire.isError ? (
          <p className="text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.dataUnavailable')}</p>
        ) : !questionnaire.data ? (
          <p className="text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.noQuestionnaire')}</p>
        ) : (
          <dl className="space-y-2 text-sm">
            {questionnaire.data.fields.map((field) => (
              <div key={field.key}>
                <dt className="text-[var(--workspace-muted)]">{field.label}</dt>
                <dd className="whitespace-pre-wrap text-[var(--workspace-ink)]">
                  {formatAnswer(questionnaire.data?.answers?.[field.key])}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section aria-label={t('clientWorkspace.attachments')}>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--workspace-muted)]">
          {t('clientWorkspace.attachments')}
        </h4>
        {attachments.isLoading ? (
          <LoadingSpinner size="sm" />
        ) : attachments.isError ? (
          <p className="text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.dataUnavailable')}</p>
        ) : !attachments.data?.length ? (
          <p className="text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.noAttachments')}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {attachments.data.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-[var(--workspace-ink)]">{file.filename}</span>
                {file.url ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-blue-600 underline dark:text-blue-300"
                  >
                    {t('common.view')}
                  </a>
                ) : (
                  <span className="shrink-0 text-[var(--workspace-muted)]">
                    {(file.size_bytes / 1024).toFixed(0)} KB
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function VisitRow({
  visit,
  timeZone,
  serviceLabel,
  statusLabel,
  currency,
}: {
  visit: ClientOverviewVisit
  timeZone?: string
  serviceLabel: string
  statusLabel: string
  currency?: string
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <li className="py-3" data-visit-id={visit.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--workspace-ink)]">
            {visit.service_name || serviceLabel}
          </p>
          <p className="text-xs text-[var(--workspace-muted)]">
            {formatDateTime(visit.date_start, timeZone)}
            {visit.specialist_name ? ` · ${visit.specialist_name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-[var(--workspace-line)] px-2 py-0.5 text-xs text-[var(--workspace-muted)]">
            {statusLabel}
          </span>
          {visit.price !== null && visit.price !== undefined && (
            <span className="text-sm tabular-nums text-[var(--workspace-ink)]">
              {formatCurrency(visit.price, (currency as Currency) || 'EUR')}
            </span>
          )}
          <Button variant="quiet" onClick={() => setOpen((value) => !value)}>
            {open ? t('clientWorkspace.hideDetails') : t('clientWorkspace.details')}
          </Button>
        </div>
      </div>
      {open && <VisitDetails visitId={visit.id} />}
    </li>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[var(--workspace-bg)] p-3">
      <dt className="text-xs text-[var(--workspace-muted)]">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums text-[var(--workspace-ink)]">{value}</dd>
    </div>
  )
}

export default function ClientWorkspace() {
  const { t } = useTranslation()
  const { visitStatus } = useLabels()
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const clientId = Number(params.clientId)
  const { data: business } = useMyBusiness()
  const timeZone = business?.timezone || undefined
  const [showForm, setShowForm] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const state = location.state as { from?: unknown } | null
  const backTo = typeof state?.from === 'string' && state.from.startsWith('/app/clients') ? state.from : '/app/clients'

  const client = useQuery<ClientOut>({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}`)
      return data
    },
    enabled: Number.isFinite(clientId) && clientId > 0,
  })
  const overview = useQuery<ClientOverviewOut>({
    queryKey: ['client-overview', clientId],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/overview`)
      return data
    },
    enabled: Number.isFinite(clientId) && clientId > 0,
  })

  if (!Number.isFinite(clientId) || clientId <= 0) {
    return <QueryError retry={() => navigate(backTo)} />
  }
  if (client.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (client.isError || !client.data) {
    const forbidden = apiErrorStatus(client.error) === 403
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        <p>{forbidden ? t('clientWorkspace.forbidden') : apiErrorMessage(client.error, t('common.loadError'))}</p>
        <Button variant="secondary" className="mt-3" onClick={() => navigate(backTo)}>
          {t('clientWorkspace.back')}
        </Button>
      </div>
    )
  }

  const data = client.data
  const payments = overview.data?.payments ?? null
  const initials = data.full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="quiet" onClick={() => navigate(backTo)}>
          <HiArrowLeft className="h-4 w-4" />
          {t('clientWorkspace.back')}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowForm((value) => !value)}>
            {t('common.edit')}
          </Button>
          <Button variant="quiet" onClick={() => setShowReport(true)}>
            <HiPrinter className="h-4 w-4" />
            {t('common.print')}
          </Button>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-[var(--workspace-ink)]">{data.full_name}</h1>
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--workspace-muted)]">
              {data.contact_phone && <span>{data.contact_phone}</span>}
              {data.contact_email && <span>{data.contact_email}</span>}
              {data.birth_date && <span>{showDay(data.birth_date)}</span>}
            </p>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card className="p-5 sm:p-6">
          <ClientForm
            clientId={clientId}
            onSuccess={() => {
              setShowForm(false)
              void client.refetch()
            }}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {overview.isError ? (
        <QueryError retry={overview.refetch} />
      ) : overview.isLoading || !overview.data ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-5">
              <h2 className="mb-3 text-base font-semibold text-[var(--workspace-ink)]">
                {t('clientWorkspace.nextVisit')}
              </h2>
              {!overview.data.next_visit ? (
                <p className="text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.noUpcoming')}</p>
              ) : (
                <div>
                  <p className="text-sm font-medium text-[var(--workspace-ink)]">
                    {overview.data.next_visit.service_name || '—'}
                  </p>
                  <p className="text-sm text-[var(--workspace-muted)]">
                    {formatDateTime(overview.data.next_visit.date_start, timeZone)}
                    {overview.data.next_visit.specialist_name
                      ? ` · ${overview.data.next_visit.specialist_name}`
                      : ''}
                  </p>
                  {overview.data.upcoming_visits.length > 1 && (
                    <ul className="mt-3 space-y-1 border-t border-[var(--workspace-line)] pt-2 text-sm">
                      {overview.data.upcoming_visits.slice(1).map((visit) => (
                        <li key={visit.id} className="flex justify-between gap-3 text-[var(--workspace-muted)]">
                          <span className="truncate">{visit.service_name || '—'}</span>
                          <span className="shrink-0">{formatDateTime(visit.date_start, timeZone)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-1 text-base font-semibold text-[var(--workspace-ink)]">
                {t('clientWorkspace.history')}
              </h2>
              {overview.data.recent_visits.length === 0 ? (
                <p className="py-3 text-sm text-[var(--workspace-muted)]">{t('clientWorkspace.noVisits')}</p>
              ) : (
                <ul className="divide-y divide-[var(--workspace-line)]">
                  {overview.data.recent_visits.map((visit) => (
                    <VisitRow
                      key={visit.id}
                      visit={visit}
                      timeZone={timeZone}
                      serviceLabel="—"
                      statusLabel={visitStatus(visit.status)}
                      currency={payments?.currency}
                    />
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-base font-semibold text-[var(--workspace-ink)]">
                {t('clientWorkspace.notes')}
              </h2>
              <ClientNotes clientId={clientId} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <dl className="grid grid-cols-2 gap-3">
                <Stat label={t('clientWorkspace.totalVisits')} value={overview.data.stats.total_visits} />
                <Stat label={t('clientWorkspace.completedVisits')} value={overview.data.stats.completed_visits} />
                <Stat label={t('clientWorkspace.cancelledVisits')} value={overview.data.stats.cancelled_visits} />
                {payments && (
                  <Stat
                    label={t('clientWorkspace.paidTotal')}
                    value={formatCurrency(payments.total_paid, payments.currency as Currency)}
                  />
                )}
              </dl>
            </Card>

            <Card className="p-5">
              <h2 className="mb-3 text-base font-semibold text-[var(--workspace-ink)]">
                {t('clientWorkspace.tags')}
              </h2>
              <ClientTags clientId={clientId} />
            </Card>
          </div>
        </div>
      )}

      {showReport && (
        <ClientPersonalReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          clientId={clientId}
        />
      )}
    </div>
  )
}
