import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { HiOutlineDownload, HiOutlineUpload } from 'react-icons/hi'

import api from '../../api/client'
import { apiErrorCode, apiErrorMessage, apiErrorStatus } from '../../api/errors'
import type {
  ImportBatch,
  ImportBatchPage,
  ImportRow,
  ImportRowPage,
  ImportSummary,
} from '../../api/types'
import LoadingSpinner from '../../components/LoadingSpinner'
import QueryError from '../../components/QueryError'
import TablePagination from '../../components/TablePagination'
import { INTL_LOCALE } from '../../components/booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
import type { TranslationKey } from '../../i18n/translations'
import Button from '../../ui/Button'
import Card from '../../ui/Card'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ROWS_PER_PAGE = 50
const LIST_PAGE_SIZE = 10

type DuplicatePolicy = ImportBatch['duplicate_policy']

const TARGETS: {
  key: string
  label: TranslationKey
  required?: boolean
  visit?: boolean
}[] = [
  { key: 'full_name', label: 'importWizard.target.fullName', required: true },
  { key: 'phone', label: 'importWizard.target.phone' },
  { key: 'email', label: 'importWizard.target.email' },
  { key: 'birth_date', label: 'importWizard.target.birthDate' },
  { key: 'gender', label: 'importWizard.target.gender' },
  { key: 'language', label: 'importWizard.target.language' },
  { key: 'visit_date', label: 'importWizard.target.visitDate', visit: true },
  { key: 'visit_service', label: 'importWizard.target.visitService', visit: true },
  { key: 'visit_specialist', label: 'importWizard.target.visitSpecialist', visit: true },
  { key: 'visit_price', label: 'importWizard.target.visitPrice', visit: true },
  { key: 'visit_status', label: 'importWizard.target.visitStatus', visit: true },
  { key: 'visit_payment_method', label: 'importWizard.target.visitPaymentMethod', visit: true },
]

const STATUS_KEYS: Record<string, TranslationKey> = {
  uploaded: 'importWizard.status.uploaded',
  mapped: 'importWizard.status.mapped',
  previewed: 'importWizard.status.previewed',
  importing: 'importWizard.status.importing',
  completed: 'importWizard.status.completed',
  completed_with_errors: 'importWizard.status.completedWithErrors',
  failed: 'importWizard.status.failed',
}

const ROW_STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'importWizard.rowStatus.pending',
  valid: 'importWizard.rowStatus.valid',
  error: 'importWizard.rowStatus.error',
  imported: 'importWizard.rowStatus.imported',
  skipped: 'importWizard.rowStatus.skipped',
  failed: 'importWizard.rowStatus.failed',
}

const ACTION_KEYS: Record<string, TranslationKey> = {
  create: 'importWizard.action.create',
  update: 'importWizard.action.update',
  skip: 'importWizard.action.skip',
}

const ERROR_KEYS: Record<string, TranslationKey> = {
  required_field: 'importWizard.error.requiredField',
  too_long: 'importWizard.error.tooLong',
  invalid_phone: 'importWizard.error.invalidPhone',
  invalid_email: 'importWizard.error.invalidEmail',
  invalid_date: 'importWizard.error.invalidDate',
  invalid_choice: 'importWizard.error.invalidChoice',
  invalid_price: 'importWizard.error.invalidPrice',
  ambiguous_match: 'importWizard.error.ambiguousMatch',
  contact_conflict: 'importWizard.error.contactConflict',
  unknown_specialist: 'importWizard.error.unknownSpecialist',
  ambiguous_specialist: 'importWizard.error.ambiguousSpecialist',
  unknown_service: 'importWizard.error.unknownService',
  ambiguous_service: 'importWizard.error.ambiguousService',
  client_missing: 'importWizard.error.clientMissing',
  extra_columns: 'importWizard.error.extraColumns',
  cell_too_long: 'importWizard.error.cellTooLong',
  formula_not_allowed: 'importWizard.error.formulaNotAllowed',
  malformed_row: 'importWizard.error.malformedRow',
  row_failed: 'importWizard.error.rowFailed',
}

const POLICY_KEYS: Record<DuplicatePolicy, TranslationKey> = {
  skip: 'importWizard.policy.skip',
  update: 'importWizard.policy.update',
  create: 'importWizard.policy.create',
}

function allowedFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension !== 'csv' && extension !== 'xlsx') return 'type'
  if (file.size > MAX_FILE_BYTES) return 'size'
  if (file.size === 0) return 'empty'
  return null
}

export default function ImportWizard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [fileProblem, setFileProblem] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const managesBusiness = user?.role === 'admin' || user?.role === 'business_owner'
  const soloSpecialist = user?.role === 'specialist' && !user.employer_id
  const allowed = managesBusiness || soloSpecialist
  const batchParam = searchParams.get('batch')
  const batchId = batchParam && /^\d+$/.test(batchParam) ? Number(batchParam) : null

  const listQuery = useQuery<ImportBatchPage>({
    queryKey: ['imports', 'list'],
    enabled: allowed && !batchId,
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<ImportBatchPage>('/businesses/me/imports', {
        params: { page: 1, per_page: LIST_PAGE_SIZE },
      })
      return data
    },
  })

  const openBatch = (id: number) => {
    setUploadError(null)
    setSearchParams({ batch: String(id) })
  }

  const closeBatch = () => {
    setFile(null)
    setFileProblem(null)
    if (inputRef.current) inputRef.current.value = ''
    setSearchParams({})
    queryClient.invalidateQueries({ queryKey: ['imports'] })
  }

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null
    setUploadError(null)
    setFileProblem(null)
    if (!selected) {
      setFile(null)
      return
    }
    const problem = allowedFile(selected)
    if (problem) {
      setFile(null)
      setFileProblem(problem)
      event.target.value = ''
      return
    }
    setFile(selected)
  }

  const onUpload = async () => {
    if (!file || uploading) return
    setUploading(true)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append('file', file, file.name)
      const { data } = await api.post<ImportBatch>('/businesses/me/imports', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await queryClient.invalidateQueries({ queryKey: ['imports'] })
      openBatch(data.id)
    } catch (error) {
      setUploadError(apiErrorMessage(error, t('importWizard.uploadError')))
    } finally {
      setUploading(false)
    }
  }

  if (!allowed) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
        {t('importWizard.noAccess')}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">{t('importWizard.title')}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-gray-400">
          {t('importWizard.description')}
        </p>
      </header>

      {batchId ? (
        <BatchPanel batchId={batchId} onClose={closeBatch} />
      ) : (
        <>
          <Card>
            <h2 className="text-base font-semibold">{t('importWizard.uploadTitle')}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
              {t('importWizard.uploadHint')}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700">
                <HiOutlineUpload className="h-4 w-4" />
                <span>{file ? t('importWizard.replaceFile') : t('importWizard.selectFile')}</span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="sr-only"
                  aria-label={t('importWizard.selectFile')}
                  onChange={onFile}
                />
              </label>
              {file && (
                <p className="min-w-0 truncate text-sm text-slate-600 dark:text-gray-300" data-testid="selected-file">
                  {file.name}
                </p>
              )}
              <Button onClick={onUpload} disabled={!file || uploading}>
                {uploading ? t('importWizard.uploading') : t('importWizard.upload')}
              </Button>
            </div>
            {fileProblem && (
              <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                {t(fileProblem === 'size'
                  ? 'importWizard.fileTooLarge'
                  : fileProblem === 'empty'
                    ? 'importWizard.fileEmpty'
                    : 'importWizard.fileType')}
              </p>
            )}
            {uploadError && (
              <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {uploadError}
              </p>
            )}
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 p-4 dark:border-gray-700">
              <h2 className="text-base font-semibold">{t('importWizard.recent')}</h2>
            </div>
            {listQuery.isLoading ? (
              <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
            ) : listQuery.isError ? (
              <div className="p-4">
                <QueryError retry={listQuery.refetch} />
              </div>
            ) : (listQuery.data?.items.length ?? 0) === 0 ? (
              <p className="p-4 text-sm text-slate-500 dark:text-gray-400">{t('importWizard.recentEmpty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-gray-700">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-gray-900/60 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3">{t('importWizard.file')}</th>
                      <th scope="col" className="px-4 py-3">{t('importWizard.statusLabel')}</th>
                      <th scope="col" className="px-4 py-3">{t('importWizard.rowsLabel')}</th>
                      <th scope="col" className="px-4 py-3">{t('importWizard.createdLabel')}</th>
                      <th scope="col" className="px-4 py-3"><span className="sr-only">{t('importWizard.open')}</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                    {listQuery.data?.items.map((item) => (
                      <tr key={item.id}>
                        <td className="max-w-[18rem] truncate px-4 py-3">{item.source_filename}</td>
                        <td className="px-4 py-3">{STATUS_KEYS[item.status] ? t(STATUS_KEYS[item.status]) : item.status}</td>
                        <td className="px-4 py-3">{item.row_count}</td>
                        <td className="px-4 py-3">{item.created_count}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="secondary" onClick={() => openBatch(item.id)}>
                            {t('importWizard.open')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function StepIndicator({ step }: { step: number }) {
  const { t } = useTranslation()
  const labels: TranslationKey[] = [
    'importWizard.step.upload',
    'importWizard.step.mapping',
    'importWizard.step.preview',
    'importWizard.step.result',
  ]
  return (
    <ol className="flex flex-wrap gap-2 text-xs" aria-label={t('importWizard.steps')}>
      {labels.map((label, index) => (
        <li
          key={label}
          aria-current={index + 1 === step ? 'step' : undefined}
          className={`rounded-full px-3 py-1 font-medium ${
            index + 1 === step
              ? 'bg-slate-900 text-white dark:bg-white dark:text-gray-900'
              : index + 1 < step
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-slate-100 text-slate-500 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {index + 1}. {t(label)}
        </li>
      ))}
    </ol>
  )
}

function BatchPanel({ batchId, onClose }: { batchId: number; onClose: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const batchQuery = useQuery<ImportBatch>({
    queryKey: ['imports', 'batch', batchId],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<ImportBatch>(`/businesses/me/imports/${batchId}`)
      return data
    },
  })

  const batch = summary?.batch ?? batchQuery.data
  const managesBusiness = user?.role === 'admin' || user?.role === 'business_owner'
  const soloSpecialist = user?.role === 'specialist' && !user.employer_id
  const allowed = managesBusiness || soloSpecialist

  const refresh = async () => {
    setSummary(null)
    await queryClient.invalidateQueries({ queryKey: ['imports', 'batch', batchId] })
    await batchQuery.refetch()
  }

  if (!allowed) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
        {t('importWizard.noAccess')}
      </div>
    )
  }

  if (batchQuery.isLoading && !batch) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
  }

  if (batchQuery.isError && !batch) {
    const status = apiErrorStatus(batchQuery.error)
    if (status === 403) {
      return <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">{t('importWizard.noAccess')}</p>
    }
    if (status === 404) {
      return (
        <Card>
          <p className="text-sm">{t('importWizard.batchNotFound')}</p>
          <Button className="mt-4" onClick={onClose}>{t('importWizard.startOver')}</Button>
        </Card>
      )
    }
    return <QueryError retry={refresh} />
  }

  if (!batch) return null

  const finished = batch.status === 'completed' || batch.status === 'completed_with_errors'
  const step = finished ? 4 : batch.status === 'previewed' || batch.status === 'importing' ? 3 : 2

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StepIndicator step={step} />
        <Button variant="secondary" onClick={onClose}>{t('importWizard.startOver')}</Button>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{batch.source_filename}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              {STATUS_KEYS[batch.status] ? t(STATUS_KEYS[batch.status]) : batch.status}
              {' · '}
              {t('importWizard.timezoneHint').replace('{timezone}', batch.timezone)}
              {' · '}
              {t('importWizard.currencyHint').replace('{currency}', batch.currency)}
            </p>
          </div>
          <Button variant="quiet" onClick={refresh}>{t('importWizard.refresh')}</Button>
        </div>
      </Card>

      {finished ? (
        <ResultPanel batch={batch} onClose={onClose} />
      ) : batch.status === 'importing' ? (
        <ImportingPanel batch={batch} onFinished={setSummary} onOutdated={refresh} />
      ) : (
        <>
          <MappingPanel batch={batch} onBatch={(next) => queryClient.setQueryData(['imports', 'batch', batchId], next)} />
          {batch.status === 'previewed' && (
            <PreviewPanel
              batch={batch}
              onBatch={(next) => queryClient.setQueryData(['imports', 'batch', batchId], next)}
              onFinished={setSummary}
              onOutdated={refresh}
            />
          )}
        </>
      )}
    </div>
  )
}

function MappingPanel({ batch, onBatch }: { batch: ImportBatch; onBatch: (batch: ImportBatch) => void }) {
  const { t } = useTranslation()
  const [mapping, setMapping] = useState<Record<string, string>>(
    () => batch.mapping ?? batch.suggested_mapping ?? {},
  )
  const [policy, setPolicy] = useState<DuplicatePolicy>(batch.duplicate_policy)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMapping(batch.mapping ?? batch.suggested_mapping ?? {})
    setPolicy(batch.duplicate_policy)
  }, [batch.id, batch.mapping, batch.suggested_mapping, batch.duplicate_policy])

  const setTarget = (target: string, column: string) => {
    setMapping((current) => {
      const next = { ...current }
      if (column) next[target] = column
      else delete next[target]
      return next
    })
  }

  const onPreview = async () => {
    if (busy) return
    setError(null)
    if (!mapping.full_name) {
      setError(t('importWizard.mappingRequired'))
      return
    }
    const used = Object.values(mapping)
    if (new Set(used).size !== used.length) {
      setError(t('importWizard.duplicateColumns'))
      return
    }
    setBusy(true)
    try {
      const { data: saved } = await api.put<ImportBatch>(
        `/businesses/me/imports/${batch.id}/mapping`,
        { mapping },
      )
      onBatch(saved)
      const { data: previewed } = await api.post<ImportBatch>(
        `/businesses/me/imports/${batch.id}/preview`,
        { duplicate_policy: policy },
      )
      onBatch(previewed)
    } catch (err) {
      setError(apiErrorMessage(err, t('importWizard.saveError')))
    } finally {
      setBusy(false)
    }
  }

  const clientTargets = TARGETS.filter((target) => !target.visit)
  const visitTargets = TARGETS.filter((target) => target.visit)
  const used = new Set(Object.values(mapping))
  const selectClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700'

  const field = (target: (typeof TARGETS)[number]) => (
    <label key={target.key} className="space-y-1">
      <span className="block text-xs font-medium text-slate-600 dark:text-gray-300">
        {t(target.label)}
        {target.required && <span aria-hidden="true"> *</span>}
      </span>
      <select
        aria-label={t(target.label)}
        value={mapping[target.key] ?? ''}
        onChange={(event) => setTarget(target.key, event.target.value)}
        className={selectClass}
        required={target.required}
      >
        <option value="">{t('importWizard.notImported')}</option>
        {batch.headers.map((header) => (
          <option
            key={header}
            value={header}
            disabled={used.has(header) && mapping[target.key] !== header}
          >
            {header}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <Card>
      <h2 className="text-base font-semibold">{t('importWizard.mappingTitle')}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('importWizard.mappingHint')}</p>
      <div className="mt-4 space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold">{t('importWizard.clientFields')}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clientTargets.map(field)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">{t('importWizard.visitFields')}</legend>
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{t('importWizard.visitHint')}</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visitTargets.map(field)}
          </div>
        </fieldset>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-slate-600 dark:text-gray-300">
            {t('importWizard.duplicatePolicy')}
          </span>
          <select
            aria-label={t('importWizard.duplicatePolicy')}
            value={policy}
            onChange={(event) => setPolicy(event.target.value as DuplicatePolicy)}
            className={selectClass}
          >
            {(['skip', 'update', 'create'] as DuplicatePolicy[]).map((option) => (
              <option key={option} value={option}>{t(POLICY_KEYS[option])}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <div className="mt-4">
        <Button onClick={onPreview} disabled={busy}>
          {busy ? t('importWizard.previewing') : t('importWizard.buildPreview')}
        </Button>
      </div>
    </Card>
  )
}

function PreviewPanel({
  batch,
  onBatch,
  onFinished,
  onOutdated,
}: {
  batch: ImportBatch
  onBatch: (batch: ImportBatch) => void
  onFinished: (summary: ImportSummary) => void
  onOutdated: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [policy, setPolicy] = useState<DuplicatePolicy>(batch.duplicate_policy)
  const [filter, setFilter] = useState<'all' | 'error'>('all')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setPolicy(batch.duplicate_policy)
  }, [batch.duplicate_policy])

  const rowsQuery = useQuery<ImportRowPage>({
    queryKey: ['imports', 'rows', batch.id, batch.preview_version, filter, page],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<ImportRowPage>(`/businesses/me/imports/${batch.id}/rows`, {
        params: { page, per_page: ROWS_PER_PAGE, ...(filter === 'error' ? { status: 'error' } : {}) },
      })
      return data
    },
  })

  const rebuild = async () => {
    if (rebuilding) return
    setRebuilding(true)
    setError(null)
    try {
      const { data } = await api.post<ImportBatch>(
        `/businesses/me/imports/${batch.id}/preview`,
        { duplicate_policy: policy },
      )
      onBatch(data)
      setPage(1)
    } catch (err) {
      setError(apiErrorMessage(err, t('importWizard.saveError')))
    } finally {
      setRebuilding(false)
    }
  }

  const confirm = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post<ImportSummary>(
        `/businesses/me/imports/${batch.id}/confirm`,
        {
          source_hash: batch.source_hash,
          mapping_version: batch.mapping_version,
          preview_version: batch.preview_version,
          duplicate_policy: policy,
        },
      )
      onFinished(data)
    } catch (err) {
      const code = apiErrorCode(err)
      if (code === 'import_preview_outdated') {
        setError(t('importWizard.outdated'))
        await onOutdated()
      } else {
        setError(apiErrorMessage(err, t('importWizard.confirmError')))
      }
    } finally {
      setBusy(false)
    }
  }

  const downloadReport = async () => {
    setDownloading(true)
    setError(null)
    try {
      const { data } = await api.get(`/businesses/me/imports/${batch.id}/report.csv`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'import_report.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(apiErrorMessage(err, t('importWizard.reportError')))
    } finally {
      setDownloading(false)
    }
  }

  const rows = rowsQuery.data?.items ?? []
  const pages = rowsQuery.data?.pages ?? 1
  const selectClass =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700'

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t('importWizard.previewTitle')}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('importWizard.previewHint')}</p>
        </div>
        <Button variant="secondary" onClick={downloadReport} disabled={downloading}>
          <HiOutlineDownload className="mr-1 inline h-4 w-4" />
          {downloading ? t('importWizard.downloading') : t('importWizard.downloadReport')}
        </Button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ['importWizard.valid', batch.valid_count],
          ['importWizard.errors', batch.error_count],
          ['importWizard.create', batch.create_count],
          ['importWizard.update', batch.update_count],
          ['importWizard.skip', batch.skip_count],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-slate-200 p-3 dark:border-gray-700">
            <dt className="text-xs text-slate-500 dark:text-gray-400">{t(label as TranslationKey)}</dt>
            <dd className="text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-slate-600 dark:text-gray-300">
            {t('importWizard.duplicatePolicy')}
          </span>
          <select
            aria-label={t('importWizard.duplicatePolicy')}
            value={policy}
            onChange={(event) => setPolicy(event.target.value as DuplicatePolicy)}
            className={selectClass}
          >
            {(['skip', 'update', 'create'] as DuplicatePolicy[]).map((option) => (
              <option key={option} value={option}>{t(POLICY_KEYS[option])}</option>
            ))}
          </select>
        </label>
        <Button variant="secondary" onClick={rebuild} disabled={rebuilding || policy === batch.duplicate_policy}>
          {rebuilding ? t('importWizard.previewing') : t('importWizard.rebuildPreview')}
        </Button>
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          <Button variant="quiet" onClick={() => setFilter('all')} disabled={filter === 'all'}>
            {t('importWizard.filterAll')}
          </Button>
          <Button variant="quiet" onClick={() => { setFilter('error'); setPage(1) }} disabled={filter === 'error'}>
            {t('importWizard.filterErrors')}
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-gray-700">
        {rowsQuery.isLoading ? (
          <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
        ) : rowsQuery.isError ? (
          <div className="p-4"><QueryError retry={rowsQuery.refetch} /></div>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-500 dark:text-gray-400">{t('importWizard.noRows')}</p>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-gray-700">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-gray-900/60 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-3 py-2">{t('importWizard.row')}</th>
                <th scope="col" className="px-3 py-2">{t('importWizard.statusLabel')}</th>
                <th scope="col" className="px-3 py-2">{t('importWizard.actionLabel')}</th>
                <th scope="col" className="px-3 py-2">{t('importWizard.details')}</th>
                <th scope="col" className="px-3 py-2">{t('importWizard.error')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
              {rows.map((row) => (
                <tr key={row.row_number}>
                  <td className="px-3 py-2">{row.row_number}</td>
                  <td className="px-3 py-2">{ROW_STATUS_KEYS[row.status] ? t(ROW_STATUS_KEYS[row.status]) : row.status}</td>
                  <td className="px-3 py-2">{row.action && ACTION_KEYS[row.action] ? t(ACTION_KEYS[row.action]) : '—'}</td>
                  <td className="px-3 py-2">{rowDetails(row, batch, t)}</td>
                  <td className="px-3 py-2 text-red-600 dark:text-red-400">
                    {row.error_code
                      ? (ERROR_KEYS[row.error_code] ? t(ERROR_KEYS[row.error_code]) : row.error_code)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <TablePagination
          currentPage={page}
          totalPages={pages}
          totalItems={rowsQuery.data?.total ?? 0}
          perPage={ROWS_PER_PAGE}
          onPageChange={setPage}
        />
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-gray-400">{t('importWizard.confirmHint')}</p>
        <Button onClick={confirm} disabled={busy}>
          {busy ? t('importWizard.confirming') : t('importWizard.confirm')}
        </Button>
      </div>
    </Card>
  )
}

function ImportingPanel({
  batch,
  onFinished,
  onOutdated,
}: {
  batch: ImportBatch
  onFinished: (summary: ImportSummary) => void
  onOutdated: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resume = async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const { data } = await api.post<ImportSummary>(
        `/businesses/me/imports/${batch.id}/confirm`,
        {
          source_hash: batch.source_hash,
          mapping_version: batch.mapping_version,
          preview_version: batch.preview_version,
          duplicate_policy: batch.duplicate_policy,
        },
      )
      onFinished(data)
    } catch (err) {
      if (apiErrorCode(err) === 'import_preview_outdated') {
        setError(t('importWizard.outdated'))
        await onOutdated()
      } else {
        setError(apiErrorMessage(err, t('importWizard.confirmError')))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className="text-base font-semibold">{t('importWizard.importingTitle')}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('importWizard.importingHint')}</p>
      <p className="mt-3 text-sm">
        {t('importWizard.lastCheckpoint').replace('{row}', String(batch.last_checkpoint))}
        {' · '}
        {t('importWizard.importedSoFar')
          .replace('{created}', String(batch.created_count))
          .replace('{updated}', String(batch.updated_count))}
      </p>
      {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <Button className="mt-4" onClick={resume} disabled={busy}>
        {busy ? t('importWizard.confirming') : t('importWizard.continueImport')}
      </Button>
    </Card>
  )
}

function ResultPanel({ batch, onClose }: { batch: ImportBatch; onClose: () => void }) {
  const { t, locale } = useTranslation()
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const downloadReport = async () => {
    setDownloading(true)
    setError(null)
    try {
      const { data } = await api.get(`/businesses/me/imports/${batch.id}/report.csv`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(data as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'import_report.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(apiErrorMessage(err, t('importWizard.reportError')))
    } finally {
      setDownloading(false)
    }
  }

  const finished = batch.finished_at
    ? new Intl.DateTimeFormat(INTL_LOCALE[locale], {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: batch.timezone || undefined,
      }).format(new Date(batch.finished_at))
    : ''

  return (
    <Card>
      <h2 className="text-base font-semibold">{t('importWizard.resultTitle')}</h2>
      {batch.status === 'completed_with_errors' && (
        <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
          {t('importWizard.completedWithErrors')}
        </p>
      )}
      <p className="mt-3 text-sm">
        {t('importWizard.resultSummary')
          .replace('{created}', String(batch.created_count))
          .replace('{updated}', String(batch.updated_count))
          .replace('{skipped}', String(batch.skipped_count))
          .replace('{failed}', String(batch.failed_count))}
      </p>
      {finished && (
        <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
          {t('importWizard.finishedAt').replace('{when}', finished)}
        </p>
      )}
      {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={downloadReport} disabled={downloading}>
          <HiOutlineDownload className="mr-1 inline h-4 w-4" />
          {downloading ? t('importWizard.downloading') : t('importWizard.downloadReport')}
        </Button>
        <Button variant="secondary" onClick={onClose}>{t('importWizard.startOver')}</Button>
      </div>
    </Card>
  )
}

function rowDetails(row: ImportRow, batch: ImportBatch, t: (key: TranslationKey) => string): string {
  const parts: string[] = []
  if (row.client?.full_name) parts.push(row.client.full_name)
  if (row.client?.phone) parts.push(row.client.phone)
  if (row.client?.email) parts.push(row.client.email)
  if (row.visit) {
    const when = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: batch.timezone || undefined,
    }).format(new Date(row.visit.date_start))
    const service = row.visit.service_name || `#${row.visit.service_id ?? ''}`
    const price = row.visit.price !== null && row.visit.price !== undefined
      ? ` · ${row.visit.price} ${batch.currency}`
      : ''
    parts.push(`${when} · ${service}${price}`)
    if (row.visit.creates_service) parts.push(t('importWizard.createsService'))
  }
  return parts.join(' · ') || '—'
}
