import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'

import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import QueryError from '../components/QueryError'
import TablePagination from '../components/TablePagination'
import { INTL_LOCALE } from '../components/booking/intl'
import { useMyBusiness } from '../hooks/useMyBusiness'
import { useTranslation } from '../hooks/useTranslation'
import { useLabels } from '../i18n/labels'
import type { TranslationKey } from '../i18n/translations'
import { useAuthStore } from '../store/authStore'
import Button from '../ui/Button'
import Card from '../ui/Card'
import type { BusinessAuditEventOut, BusinessAuditEventPage } from '../api/types'

type AuditFilters = {
  action: string
  entity: string
  actor: string
  dateFrom: string
  dateTo: string
}

const EMPTY_FILTERS: AuditFilters = {
  action: '',
  entity: '',
  actor: '',
  dateFrom: '',
  dateTo: '',
}

const ACTION_KEYS: Record<string, TranslationKey> = {
  'visit.created': 'audit.action.visitCreated',
  'visit.updated': 'audit.action.visitUpdated',
  'visit.moved': 'audit.action.visitMoved',
  'visit.cancelled': 'audit.action.visitCancelled',
  'payment.paid': 'audit.action.paymentPaid',
  'payment.failed': 'audit.action.paymentFailed',
  'payment.refunded': 'audit.action.paymentRefunded',
  'questionnaire.submitted': 'audit.action.questionnaireSubmitted',
  'client.updated': 'audit.action.clientUpdated',
}

const ENTITY_KEYS: Record<string, TranslationKey> = {
  visit: 'audit.entity.visit',
  payment: 'audit.entity.payment',
  questionnaire: 'audit.entity.questionnaire',
  client: 'audit.entity.client',
}

const ROLE_KEYS: Record<string, TranslationKey> = {
  admin: 'audit.role.admin',
  business_owner: 'audit.role.businessOwner',
  specialist: 'audit.role.specialist',
  employee: 'audit.role.employee',
  system: 'audit.role.system',
  guest: 'audit.role.guest',
}

const FIELD_KEYS: Record<string, TranslationKey> = {
  status: 'audit.field.status',
  date_start: 'audit.field.dateStart',
  date_end: 'audit.field.dateEnd',
  service_id: 'audit.field.serviceId',
  service_name: 'audit.field.serviceName',
  specialist_id: 'audit.field.specialistId',
  price: 'audit.field.price',
  payment_method: 'audit.field.paymentMethod',
  items: 'audit.field.items',
  items_count: 'audit.field.itemsCount',
  full_name: 'audit.field.fullName',
  birth_date: 'audit.field.birthDate',
  gender: 'audit.field.gender',
  contact_phone: 'audit.field.contactPhone',
  contact_email: 'audit.field.contactEmail',
  location_lat: 'audit.field.locationLat',
  location_lon: 'audit.field.locationLon',
  language: 'audit.field.language',
  amount: 'audit.field.amount',
  currency: 'audit.field.currency',
  provider: 'audit.field.provider',
  provider_event_id: 'audit.field.providerEventId',
  refund_id: 'audit.field.refundId',
  version: 'audit.field.version',
  fields_count: 'audit.field.fieldsCount',
  answered_count: 'audit.field.answeredCount',
  photo_url: 'audit.field.photoUrl',
  note: 'audit.field.note',
}

const ACTION_OPTIONS: { value: string; key: TranslationKey; family: string }[] = [
  { value: 'visit.created', key: 'audit.action.visitCreated', family: 'visit' },
  { value: 'visit.updated', key: 'audit.action.visitUpdated', family: 'visit' },
  { value: 'visit.moved', key: 'audit.action.visitMoved', family: 'visit' },
  { value: 'visit.cancelled', key: 'audit.action.visitCancelled', family: 'visit' },
  { value: 'client.updated', key: 'audit.action.clientUpdated', family: 'client' },
  { value: 'payment.paid', key: 'audit.action.paymentPaid', family: 'payment' },
  { value: 'payment.failed', key: 'audit.action.paymentFailed', family: 'payment' },
  { value: 'payment.refunded', key: 'audit.action.paymentRefunded', family: 'payment' },
  { value: 'questionnaire.submitted', key: 'audit.action.questionnaireSubmitted', family: 'questionnaire' },
]

const ENTITY_OPTIONS: { value: string; key: TranslationKey; family: string }[] = [
  { value: 'visit', key: 'audit.entity.visit', family: 'visit' },
  { value: 'client', key: 'audit.entity.client', family: 'client' },
  { value: 'payment', key: 'audit.entity.payment', family: 'payment' },
  { value: 'questionnaire', key: 'audit.entity.questionnaire', family: 'questionnaire' },
]

function scalarText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? '✓' : '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function AuditLog() {
  const { t, locale } = useTranslation()
  const { visitStatus } = useLabels()
  const { user } = useAuthStore()
  const { data: business } = useMyBusiness()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [draft, setDraft] = useState<AuditFilters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<AuditFilters>(EMPTY_FILTERS)
  const [formError, setFormError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const managesBusiness = user?.role === 'admin' || user?.role === 'business_owner'
  const soloSpecialist = user?.role === 'specialist' && !user.employer_id
  const canSeeFinancials = managesBusiness || soloSpecialist
  const canSeeQuestionnaires = managesBusiness || soloSpecialist

  const params = useMemo(() => {
    const result: Record<string, string | number> = { page, per_page: perPage }
    if (applied.action) result.action = applied.action
    if (applied.entity) result.entity_type = applied.entity
    if (applied.actor) result.actor_user_id = Number(applied.actor)
    if (applied.dateFrom) result.date_from = new Date(`${applied.dateFrom}T00:00:00`).toISOString()
    if (applied.dateTo) result.date_to = new Date(`${applied.dateTo}T23:59:59.999`).toISOString()
    return result
  }, [applied, page, perPage])

  const listQuery = useQuery<BusinessAuditEventPage>({
    queryKey: ['business-audit', params],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<BusinessAuditEventPage>('/businesses/me/audit', { params })
      return data
    },
  })

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(INTL_LOCALE[locale], {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: business?.timezone || undefined,
    }).format(new Date(value))

  const actionLabel = (action: string) => {
    const key = ACTION_KEYS[action]
    return key ? t(key) : action
  }

  const entityLabel = (entity: string) => {
    const key = ENTITY_KEYS[entity]
    return key ? t(key) : entity
  }

  const roleLabel = (role: string | null | undefined) => {
    if (!role) return ''
    const key = ROLE_KEYS[role]
    return key ? t(key) : role
  }

  const fieldLabel = (field: string) => {
    const key = FIELD_KEYS[field]
    return key ? t(key) : field
  }

  const valueText = (key: string, value: unknown): string => {
    if (key === 'status' && typeof value === 'string') return visitStatus(value)
    if ((key === 'date_start' || key === 'date_end') && typeof value === 'string') {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) return formatDateTime(value)
    }
    if (key.endsWith('_id') && typeof value === 'number') return `#${value}`
    return scalarText(value)
  }

  const diffText = (key: string, value: unknown): string => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const diff = value as { old?: unknown; new?: unknown }
      if ('old' in diff || 'new' in diff) {
        return `${valueText(key, diff.old)} → ${valueText(key, diff.new)}`
      }
    }
    return valueText(key, value)
  }

  const details = (event: BusinessAuditEventOut): string => {
    const changes = event.changes
    if (!changes) return t('audit.noDetails')
    const parts: string[] = []
    const fields = changes.fields
    if (Array.isArray(fields) && fields.length > 0) {
      const label = event.action.endsWith('.created') ? 'audit.createdFields' : 'audit.fieldsChanged'
      parts.push(
        t(label).replace(
          '{fields}',
          fields.filter((field): field is string => typeof field === 'string').map(fieldLabel).join(', '),
        ),
      )
    }
    for (const [key, value] of Object.entries(changes)) {
      if (key === 'fields' || key === 'items' || key === 'note' || key === 'photo_url') continue
      // Empty optional values on creation only add noise; a diff with old/new still shows "—".
      if (value === null || value === undefined || value === '') continue
      parts.push(`${fieldLabel(key)}: ${diffText(key, value)}`)
    }
    return parts.length > 0 ? parts.join(' · ') : t('audit.noDetails')
  }

  const onApply = (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const actor = draft.actor.trim()
    if (actor && (!/^\d+$/.test(actor) || Number(actor) < 1)) {
      setFormError(t('audit.actorInvalid'))
      return
    }
    if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) {
      setFormError(t('audit.dateRangeInvalid'))
      return
    }
    setApplied({ ...draft, actor })
    setPage(1)
  }

  const onReset = () => {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setFormError(null)
    setExportError(null)
    setPage(1)
  }

  const onExport = async () => {
    setExportError(null)
    setExporting(true)
    try {
      const { data } = await api.get('/businesses/me/audit/export/csv', {
        params,
        responseType: 'blob',
      })
      const url = URL.createObjectURL(data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'business_audit_export.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      setExportError(t('audit.exportError'))
    } finally {
      setExporting(false)
    }
  }

  if (listQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (listQuery.isError) {
    const status = apiErrorStatus(listQuery.error)
    if (status === 403 || status === 404) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          {t('audit.noAccess')}
        </div>
      )
    }
    return <QueryError retry={listQuery.refetch} />
  }

  const items = listQuery.data?.items ?? []
  const visibleActions = ACTION_OPTIONS.filter((option) =>
    option.family === 'payment' ? canSeeFinancials : option.family === 'questionnaire' ? canSeeQuestionnaires : true,
  )
  const visibleEntities = ENTITY_OPTIONS.filter((option) =>
    option.family === 'payment' ? canSeeFinancials : option.family === 'questionnaire' ? canSeeQuestionnaires : true,
  )
  const inputClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'
  const labelClass = 'block text-xs font-medium text-slate-600 dark:text-gray-300'

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="page-title">{t('audit.title')}</h1>
          <p className="page-subtitle max-w-3xl">
            {t('audit.description')}
          </p>
          <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-gray-700 dark:text-gray-300">
            {t('audit.readOnly')}
          </p>
        </div>
        <Button variant="secondary" onClick={onExport} disabled={exporting}>
          {exporting ? t('audit.exporting') : t('audit.export')}
        </Button>
      </header>

      {exportError && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {exportError}
        </p>
      )}

      <Card>
        <form onSubmit={onApply} className="space-y-4" aria-labelledby="audit-filters-title">
          <h2 id="audit-filters-title" className="text-sm font-semibold">{t('audit.filters')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-1">
              <span className={labelClass}>{t('audit.action')}</span>
              <select
                value={draft.action}
                onChange={(event) => setDraft({ ...draft, action: event.target.value })}
                className={inputClass}
              >
                <option value="">{t('audit.allActions')}</option>
                {visibleActions.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.key)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t('audit.entity')}</span>
              <select
                value={draft.entity}
                onChange={(event) => setDraft({ ...draft, entity: event.target.value })}
                className={inputClass}
              >
                <option value="">{t('audit.allEntities')}</option>
                {visibleEntities.map((option) => (
                  <option key={option.value} value={option.value}>{t(option.key)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t('audit.actor')}</span>
              <input
                type="text"
                inputMode="numeric"
                value={draft.actor}
                onChange={(event) => setDraft({ ...draft, actor: event.target.value })}
                placeholder={t('audit.actorPlaceholder')}
                className={inputClass}
              />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t('audit.dateFrom')}</span>
              <input
                type="date"
                value={draft.dateFrom}
                onChange={(event) => setDraft({ ...draft, dateFrom: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>{t('audit.dateTo')}</span>
              <input
                type="date"
                value={draft.dateTo}
                onChange={(event) => setDraft({ ...draft, dateTo: event.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">{t('audit.apply')}</Button>
            <Button type="button" variant="secondary" onClick={onReset}>{t('audit.reset')}</Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {items.length === 0 ? (
          <p className="p-5 text-sm text-slate-500 dark:text-gray-400">{t('audit.empty')}</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-gray-700">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-gray-900/60 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-4 py-3">{t('audit.when')}</th>
                    <th scope="col" className="px-4 py-3">{t('audit.who')}</th>
                    <th scope="col" className="px-4 py-3">{t('audit.what')}</th>
                    <th scope="col" className="px-4 py-3">{t('audit.details')}</th>
                    <th scope="col" className="px-4 py-3">{t('audit.requestId')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                  {items.map((event) => (
                    <tr key={event.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-gray-300">
                        {formatDateTime(event.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium">{event.actor_name || t('audit.unknownActor')}</span>
                        {event.actor_role && (
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-gray-400">
                            {roleLabel(event.actor_role)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block font-medium">{actionLabel(event.action)}</span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-gray-400">
                          {entityLabel(event.entity_type)} #{event.entity_id}
                        </span>
                      </td>
                      <td className="max-w-md px-4 py-3 text-slate-600 dark:text-gray-300">
                        {details(event)}
                      </td>
                      <td className="px-4 py-3">
                        {event.request_id ? (
                          <code className="block max-w-[12rem] truncate rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-gray-700" title={event.request_id}>
                            {event.request_id}
                          </code>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul role="list" className="divide-y divide-slate-200 md:hidden dark:divide-gray-700">
              {items.map((event) => (
                <li key={event.id} className="space-y-2 p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-medium">{actionLabel(event.action)}</span>
                    <span className="text-xs text-slate-500 dark:text-gray-400">{formatDateTime(event.created_at)}</span>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300">
                    {event.actor_name || t('audit.unknownActor')}
                    {event.actor_role ? ` · ${roleLabel(event.actor_role)}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    {entityLabel(event.entity_type)} #{event.entity_id}
                  </p>
                  <p className="text-slate-600 dark:text-gray-300">{details(event)}</p>
                  {event.request_id && (
                    <code className="block break-all rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                      {event.request_id}
                    </code>
                  )}
                </li>
              ))}
            </ul>

            <TablePagination
              currentPage={page}
              totalPages={listQuery.data?.pages ?? 1}
              totalItems={listQuery.data?.total ?? items.length}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(value) => {
                setPerPage(value)
                setPage(1)
              }}
            />
          </>
        )}
      </Card>
    </div>
  )
}
