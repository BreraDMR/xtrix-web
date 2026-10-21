import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../api/client'
import { apiErrorMessage, apiErrorStatus } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import QueryError from '../components/QueryError'
import TablePagination from '../components/TablePagination'
import { INTL_LOCALE } from '../components/booking/intl'
import { useMyBusiness } from '../hooks/useMyBusiness'
import { useTranslation } from '../hooks/useTranslation'
import type { TranslationKey } from '../i18n/translations'
import Button from '../ui/Button'
import Card from '../ui/Card'
import type {
  CampaignCreate,
  CampaignOut,
  CampaignPage,
  CampaignPreviewOut,
  CampaignStatsOut,
  CampaignUpdate,
} from '../api/types'

type FormState = {
  name: string
  subject: string
  body: string
  inactive_days: string
  scheduled_at: string
}

const EMPTY_FORM: FormState = {
  name: '',
  subject: '',
  body: '',
  inactive_days: '90',
  scheduled_at: '',
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  draft: 'campaigns.status.draft',
  confirmed: 'campaigns.status.confirmed',
  sending: 'campaigns.status.sending',
  sent: 'campaigns.status.sent',
  cancelled: 'campaigns.status.cancelled',
}

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-200',
  confirmed: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  sending: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
}

function toLocalInput(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function toStringOrNull(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const key = STATUS_KEYS[status]
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[status] ?? STATUS_CLASS.draft}`}>
      {key ? t(key) : status}
    </span>
  )
}

function Dialog({
  title,
  children,
  confirmLabel,
  busyLabel,
  busy,
  danger,
  onConfirm,
  onClose,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  busyLabel: string
  busy: boolean
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h2 id="campaign-dialog-title" className="text-lg font-semibold">{title}</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-gray-300">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Campaigns() {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()
  const { data: business } = useMyBusiness()

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'confirm' | 'send' | 'cancel' | null>(null)

  const listQuery = useQuery<CampaignPage>({
    queryKey: ['campaigns', page, perPage],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<CampaignPage>('/businesses/me/campaigns', {
        params: { page, per_page: perPage },
      })
      return data
    },
  })

  const detailQuery = useQuery<CampaignOut>({
    queryKey: ['campaign', selectedId],
    retry: false,
    enabled: selectedId !== null,
    queryFn: async () => {
      const { data } = await api.get<CampaignOut>(`/businesses/me/campaigns/${selectedId}`)
      return data
    },
  })

  const previewQuery = useQuery<CampaignPreviewOut>({
    queryKey: ['campaign-preview', selectedId],
    retry: false,
    enabled: selectedId !== null,
    queryFn: async () => {
      const { data } = await api.get<CampaignPreviewOut>(
        `/businesses/me/campaigns/${selectedId}/preview`,
      )
      return data
    },
  })

  const detailStatus = detailQuery.data?.status
  const statsQuery = useQuery<CampaignStatsOut>({
    queryKey: ['campaign-stats', selectedId],
    retry: false,
    enabled: selectedId !== null && !!detailStatus && ['sending', 'sent', 'cancelled'].includes(detailStatus),
    refetchInterval: detailStatus === 'sending' ? 5000 : false,
    queryFn: async () => {
      const { data } = await api.get<CampaignStatsOut>(
        `/businesses/me/campaigns/${selectedId}/stats`,
      )
      return data
    },
  })

  useEffect(() => {
    if (selectedId !== null) return
    const first = listQuery.data?.items[0]
    if (first) setSelectedId(first.id)
  }, [listQuery.data, selectedId])

  useEffect(() => {
    const stats = statsQuery.data
    const detail = detailQuery.data
    if (!stats || !detail || stats.status === detail.status) return
    void queryClient.invalidateQueries({ queryKey: ['campaign', detail.id] })
    void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  }, [statsQuery.data, detailQuery.data, queryClient])

  const invalidateAfterChange = (campaign: CampaignOut) => {
    queryClient.setQueryData(['campaign', campaign.id], campaign)
    void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    void queryClient.invalidateQueries({ queryKey: ['campaign-preview', campaign.id] })
    void queryClient.invalidateQueries({ queryKey: ['campaign-stats', campaign.id] })
  }

  const save = useMutation({
    mutationFn: async (payload: CampaignCreate | CampaignUpdate) => {
      if (editingId !== null) {
        const { data } = await api.patch<CampaignOut>(
          `/businesses/me/campaigns/${editingId}`,
          payload,
        )
        return data
      }
      const { data } = await api.post<CampaignOut>('/businesses/me/campaigns', payload)
      return data
    },
    onSuccess: (campaign) => {
      setFormOpen(false)
      setFormError(null)
      setActionError(null)
      setNotice(null)
      setSelectedId(campaign.id)
      invalidateAfterChange(campaign)
    },
    onError: (error) => {
      setFormError(apiErrorMessage(error, t(editingId !== null ? 'campaigns.saveError' : 'campaigns.createError')))
    },
  })

  const confirm = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<CampaignOut>(
        `/businesses/me/campaigns/${selectedId}/confirm`,
      )
      return data
    },
    onSuccess: (campaign) => {
      setDialog(null)
      setActionError(null)
      invalidateAfterChange(campaign)
    },
    onError: (error) => setActionError(apiErrorMessage(error, t('campaigns.confirmError'))),
  })

  const send = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<CampaignOut>(
        `/businesses/me/campaigns/${selectedId}/send`,
      )
      return data
    },
    onSuccess: (campaign) => {
      setDialog(null)
      setActionError(null)
      invalidateAfterChange(campaign)
    },
    onError: (error) => setActionError(apiErrorMessage(error, t('campaigns.sendError'))),
  })

  const cancel = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<CampaignOut>(
        `/businesses/me/campaigns/${selectedId}/cancel`,
      )
      return data
    },
    onSuccess: (campaign) => {
      setDialog(null)
      setActionError(null)
      setNotice(t('campaigns.cancelledNotice'))
      invalidateAfterChange(campaign)
    },
    onError: (error) => setActionError(apiErrorMessage(error, t('campaigns.cancelError'))),
  })

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  const openEdit = (campaign: CampaignOut) => {
    setEditingId(campaign.id)
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      body: campaign.body,
      inactive_days: String(campaign.inactive_days),
      scheduled_at: toLocalInput(campaign.scheduled_at),
    })
    setFormError(null)
    setFormOpen(true)
  }

  const submitForm = (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const inactiveDays = Number(form.inactive_days)
    if (!Number.isInteger(inactiveDays) || inactiveDays < 1 || inactiveDays > 3650) {
      setFormError(t('campaigns.inactiveDaysHint'))
      return
    }
    const payload: CampaignCreate = {
      name: form.name.trim(),
      subject: form.subject.trim(),
      body: form.body,
      segment_kind: 'no_visits',
      inactive_days: inactiveDays,
      scheduled_at: toStringOrNull(form.scheduled_at),
    }
    save.mutate(payload)
  }

  const formatDateTime = (value: string | null | undefined) =>
    value
      ? new Intl.DateTimeFormat(INTL_LOCALE[locale], {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: business?.timezone || undefined,
        }).format(new Date(value))
      : ''

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
          {t('campaigns.noAccess')}
        </div>
      )
    }
    return <QueryError retry={listQuery.refetch} />
  }

  const campaigns = listQuery.data?.items ?? []
  const campaign = detailQuery.data
  const preview = previewQuery.data
  const stats = statsQuery.data
  const recipients = preview?.recipients ?? []

  const readiness =
    preview == null
      ? ''
      : preview.send_ready
        ? t('campaigns.sendReady')
        : !preview.notifications_enabled
          ? t('campaigns.notificationsDisabled')
          : !preview.provider_ready
            ? t('campaigns.providerNotReady')
            : preview.requires_confirmation
              ? t('campaigns.requiresConfirmation')
              : preview.recipient_count > 0 && preview.excluded_after_confirmation >= preview.recipient_count
                ? t('campaigns.noRecipients')
                : ''

  const busy = confirm.isPending || send.isPending || cancel.isPending
  const inputClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100'

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('campaigns.title')}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-gray-400">
            {t('campaigns.description')}
          </p>
        </div>
        <Button onClick={openCreate}>{t('campaigns.new')}</Button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="overflow-hidden p-0">
          {campaigns.length === 0 ? (
            <p className="p-5 text-sm text-slate-500 dark:text-gray-400">{t('campaigns.empty')}</p>
          ) : (
            <>
              <ul role="list" className="divide-y divide-slate-200 dark:divide-gray-700">
                {campaigns.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id)
                        setActionError(null)
                        setNotice(null)
                        setFormOpen(false)
                      }}
                      aria-current={item.id === selectedId ? 'true' : undefined}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        item.id === selectedId
                          ? 'bg-primary-50 dark:bg-primary-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium">{item.name}</span>
                        <StatusBadge status={item.status} />
                      </span>
                      <span className="mt-1 block truncate text-sm text-slate-500 dark:text-gray-400">
                        {item.subject}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-gray-400">
                        {item.status === 'draft'
                          ? t('campaigns.audiencePending')
                          : t('campaigns.willReceive').replace('{n}', String(item.recipient_count))}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <TablePagination
                currentPage={page}
                totalPages={listQuery.data?.pages ?? 1}
                totalItems={listQuery.data?.total ?? campaigns.length}
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

        <div className="space-y-5">
          {selectedId === null && (
            <Card><p className="text-sm text-slate-500 dark:text-gray-400">{t('campaigns.selectPrompt')}</p></Card>
          )}

          {selectedId !== null && detailQuery.isLoading && (
            <Card><div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div></Card>
          )}

          {selectedId !== null && detailQuery.isError && (
            <Card><QueryError retry={detailQuery.refetch} /></Card>
          )}

          {campaign && (
            <>
              <Card>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{campaign.name}</h2>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                      {t('campaigns.subject')}: {campaign.subject}
                    </p>
                  </div>
                  {(campaign.status === 'draft' || campaign.status === 'confirmed') && (
                    <Button variant="secondary" onClick={() => openEdit(campaign)}>
                      {t('campaigns.edit')}
                    </Button>
                  )}
                </div>

                {campaign.status === 'draft' || campaign.status === 'confirmed' ? (
                  campaign.status === 'confirmed' && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">{t('campaigns.editHint')}</p>
                  )
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">{t('campaigns.locked')}</p>
                )}

                {actionError && (
                  <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                    {actionError}
                  </p>
                )}
                {notice && (
                  <p role="status" className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    {notice}
                  </p>
                )}

                <section aria-labelledby="campaign-text-title" className="mt-5 border-t border-slate-200 pt-4 dark:border-gray-700">
                  <h3 id="campaign-text-title" className="text-sm font-semibold">{t('campaigns.fullText')}</h3>
                  <p className="mt-2 font-medium">{campaign.subject}</p>
                  <div className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-sm dark:bg-gray-900/60">
                    {campaign.body}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">{t('campaigns.bodyHint')}</p>
                </section>

                <section aria-labelledby="campaign-segment-title" className="mt-5 border-t border-slate-200 pt-4 dark:border-gray-700">
                  <h3 id="campaign-segment-title" className="text-sm font-semibold">{t('campaigns.segmentTitle')}</h3>
                  <p className="mt-2 text-sm">
                    {t('campaigns.inactiveDays')}: <span className="font-medium">{campaign.inactive_days}</span>
                  </p>
                  {campaign.scheduled_at && (
                    <p className="mt-1 text-sm">
                      {t('campaigns.schedule')}: <span className="font-medium">{formatDateTime(campaign.scheduled_at)}</span>
                    </p>
                  )}
                </section>
              </Card>

              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{t('campaigns.previewTitle')}</h3>
                  {preview && (
                    <span className="text-xs text-slate-500 dark:text-gray-400">
                      {preview.audience_source === 'frozen'
                        ? t('campaigns.audienceFrozen')
                        : t('campaigns.audienceLive')}
                    </span>
                  )}
                </div>

                {previewQuery.isLoading && (
                  <div className="flex justify-center py-6"><LoadingSpinner /></div>
                )}
                {previewQuery.isError && (
                  <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                    {t('campaigns.previewError')}
                  </p>
                )}
                {preview && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm font-medium">
                      {t('campaigns.willReceive').replace('{n}', String(preview.recipient_count))}
                    </p>
                    {preview.over_limit && (
                      <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        {t('campaigns.overLimit').replace('{n}', String(preview.limit))}
                      </p>
                    )}
                    {preview.recipient_count === 0 && (
                      <p className="text-sm text-slate-500 dark:text-gray-400">{t('campaigns.noRecipients')}</p>
                    )}
                    {preview.excluded_after_confirmation > 0 && (
                      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        {t('campaigns.excluded')}: {preview.excluded_after_confirmation}
                      </p>
                    )}
                    {recipients.length > 0 && (
                      <>
                        <ul role="list" className="divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm dark:divide-gray-700 dark:border-gray-700">
                          {recipients.map((recipient) => (
                            <li key={recipient.client_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                              <span className="font-medium">{recipient.name}</span>
                              <span className="text-slate-500 dark:text-gray-400">{recipient.email}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          {t('campaigns.sampleHint').replace('{n}', String(recipients.length))}
                        </p>
                      </>
                    )}
                    {readiness && (
                      <p className={`text-sm ${preview.send_ready ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300'}`}>
                        {readiness}
                      </p>
                    )}

                    <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:flex-wrap dark:border-gray-700">
                      {campaign.status === 'draft' && (
                        <Button
                          onClick={() => {
                            setActionError(null)
                            setDialog('confirm')
                          }}
                          disabled={preview.recipient_count === 0 || preview.over_limit}
                        >
                          {t('campaigns.confirm')}
                        </Button>
                      )}
                      {campaign.status === 'confirmed' && (
                        <Button
                          onClick={() => {
                            setActionError(null)
                            setDialog('send')
                          }}
                          disabled={!preview.send_ready}
                        >
                          {t('campaigns.send')}
                        </Button>
                      )}
                      {(campaign.status === 'confirmed' || campaign.status === 'sending') && (
                        <Button
                          variant="danger"
                          onClick={() => {
                            setActionError(null)
                            setDialog('cancel')
                          }}
                        >
                          {t('campaigns.cancel')}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {stats && (
                <Card>
                  <h3 className="text-base font-semibold">{t('campaigns.statsTitle')}</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    {([
                      ['campaigns.stat.audience', stats.audience],
                      ['campaigns.stat.queued', stats.queued],
                      ['campaigns.stat.pending', stats.pending],
                      ['campaigns.stat.sent', stats.sent],
                      ['campaigns.stat.captured', stats.captured],
                      ['campaigns.stat.failed', stats.failed],
                      ['campaigns.stat.cancelled', stats.cancelled],
                      ['campaigns.stat.unsubscribed', stats.unsubscribed],
                    ] as [TranslationKey, number][]).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-slate-200 p-3 dark:border-gray-700">
                        <dt className="text-xs text-slate-500 dark:text-gray-400">{t(key)}</dt>
                        <dd className="mt-1 text-lg font-semibold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {stats.excluded_after_confirmation > 0 && (
                    <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                      {t('campaigns.excluded')}: {stats.excluded_after_confirmation}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">{t('campaigns.noOpens')}</p>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-form-title"
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <h2 id="campaign-form-title" className="text-lg font-semibold">
              {editingId !== null ? t('campaigns.edit') : t('campaigns.new')}
            </h2>
            {editingId !== null && (
              <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{t('campaigns.editHint')}</p>
            )}
            <form onSubmit={submitForm} className="mt-4 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('campaigns.name')}</span>
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('campaigns.subject')}</span>
                <input
                  required
                  maxLength={200}
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('campaigns.body')}</span>
                <textarea
                  required
                  rows={8}
                  maxLength={10000}
                  value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                  className={inputClass}
                />
                <span className="mt-1 block text-xs text-slate-500 dark:text-gray-400">{t('campaigns.bodyHint')}</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t('campaigns.inactiveDays')}</span>
                  <input
                    required
                    type="number"
                    min={1}
                    max={3650}
                    value={form.inactive_days}
                    onChange={(event) => setForm({ ...form, inactive_days: event.target.value })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs text-slate-500 dark:text-gray-400">{t('campaigns.inactiveDaysHint')}</span>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t('campaigns.schedule')}</span>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs text-slate-500 dark:text-gray-400">{t('campaigns.scheduleHint')}</span>
                </label>
              </div>
              {formError && (
                <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {formError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={save.isPending}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending
                    ? t(editingId !== null ? 'campaigns.saving' : 'campaigns.creating')
                    : t(editingId !== null ? 'campaigns.save' : 'campaigns.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {dialog === 'confirm' && preview && (
        <Dialog
          title={t('campaigns.confirmQuestion')}
          confirmLabel={t('campaigns.confirmAction')}
          busyLabel={t('campaigns.confirming')}
          busy={busy}
          onConfirm={() => confirm.mutate()}
          onClose={() => setDialog(null)}
        >
          <p>{t('campaigns.willReceive').replace('{n}', String(preview.recipient_count))}</p>
          <p>{t('campaigns.confirmHint')}</p>
          {actionError && <p role="alert" className="text-red-600 dark:text-red-400">{actionError}</p>}
        </Dialog>
      )}

      {dialog === 'send' && preview && (
        <Dialog
          title={t('campaigns.sendQuestion')}
          confirmLabel={t('campaigns.sendAction')}
          busyLabel={t('campaigns.sending')}
          busy={busy}
          onConfirm={() => send.mutate()}
          onClose={() => setDialog(null)}
        >
          <p>{t('campaigns.willReceive').replace('{n}', String(preview.recipient_count))}</p>
          <p>{t('campaigns.sendHint')}</p>
          {actionError && <p role="alert" className="text-red-600 dark:text-red-400">{actionError}</p>}
        </Dialog>
      )}

      {dialog === 'cancel' && (
        <Dialog
          title={t('campaigns.cancelQuestion')}
          confirmLabel={t('campaigns.cancelAction')}
          busyLabel={t('campaigns.cancelling')}
          busy={busy}
          danger
          onConfirm={() => cancel.mutate()}
          onClose={() => setDialog(null)}
        >
          {actionError && <p role="alert" className="text-red-600 dark:text-red-400">{actionError}</p>}
        </Dialog>
      )}
    </div>
  )
}
