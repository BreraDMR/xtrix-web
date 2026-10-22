import QueryError from '../components/QueryError'
import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cs } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import api from '../api/client'
import VisitForm from '../components/VisitForm'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import Card from '../ui/Card'
import SidePanel from '../ui/SidePanel'
import { HiOutlinePencil, HiOutlinePlus } from 'react-icons/hi'
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import LoadingSpinner from '../components/LoadingSpinner'
import TableSortHeader from '../components/TableSortHeader'
import TablePagination from '../components/TablePagination'
import ExportButton from '../components/ExportButton'
import { useTranslation } from '../hooks/useTranslation'
import { useLabels } from '../i18n/labels'
import { useLocaleStore } from '../store/localeStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { SortConfig } from '../utils/table'
import type { VisitOut, Schema } from '../api/types'
import { today } from '../utils/dates'
import { allPages } from '../api/allPages'
import { useAuthStore } from '../store/authStore'

type Visit = VisitOut

export default function Visits() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const currency = useBusinessCurrency()
  const access = useWorkspaceAccessContext()
  const canEdit = access === undefined || access?.crm_mode === 'full'
  
  const dateLocale = locale === 'ru' ? ru : locale === 'cz' ? cs : enUS
  
  const { visitStatus: getStatusTranslation } = useLabels()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [sortConfig, setSortConfig] = useState<SortConfig<Visit>>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const queryClient = useQueryClient()

  const identity = useAuthStore(state => state.sessionRevision)
  const user = useAuthStore(state => state.user)
  const filters = {
    q: searchQuery || undefined,
    status: statusFilter || undefined,
    date_from: dateFrom ? startOfDay(parseISO(dateFrom)).toISOString() : undefined,
    date_to: dateTo ? endOfDay(parseISO(dateTo)).toISOString() : undefined,
    sort_by: sortConfig.key ?? 'id',
    sort_order: sortConfig.direction ?? 'asc',
  }
  type VisitPage = Schema<'PaginatedResponse_VisitOut_'>
  const { data: result, isLoading, isError, refetch } = useQuery<VisitPage>({
    queryKey: ['visits', 'directory', identity, user?.id, user?.business_id, user?.employer_id,
      currentPage, perPage, filters],
    queryFn: async ({ signal }) => (await api.get<VisitPage>('/visits/', {
      params: { ...filters, page: currentPage, per_page: perPage }, signal,
    })).data,
  })
  const paginatedData = result?.items ?? []
  const totalItems = result?.total ?? 0
  const totalPages = result?.pages ?? 0
  const loadExport = () => allPages<Visit>(async page => (await api.get<VisitPage>('/visits/', {
    params: { ...filters, page, per_page: 100 },
  })).data)

  useEffect(() => {
    if (result && currentPage > Math.max(1, result.pages)) setCurrentPage(Math.max(1, result.pages))
  }, [result, currentPage])

  const handleSort = (key: keyof Visit) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' }
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null }
        }
      }
      return { key, direction: 'asc' }
    })
    setCurrentPage(1)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(undefined)
  }

  useEffect(() => {
    if (!canEdit) {
      setShowForm(false)
      setEditingId(undefined)
    }
  }, [canEdit])

  const handleSuccess = () => {
    closeForm()
    queryClient.invalidateQueries({ queryKey: ['visits'] })
    queryClient.invalidateQueries({ queryKey: ['visits-statistics'] })
    queryClient.invalidateQueries({ queryKey: ['clients-statistics'] })
  }

  const handleEdit = (id: number) => {
    setEditingId(id)
    setShowForm(true)
  }

  const statusClass = (status: Visit['status']) => {
    switch (status) {
      case 'planned': return 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
      case 'in_progress': return 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
      case 'completed': return 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]'
      default: return 'bg-[var(--workspace-bg)] text-[var(--workspace-muted)]'
    }
  }
  const hasFilters = Boolean(searchQuery || statusFilter || dateFrom || dateTo)
  const columnCount = canEdit ? 6 : 5

  return (
    <div className="min-w-0 text-[var(--workspace-ink)]">
      <div className="page-toolbar">
        <h1 className="page-title">{t('visits.title')}</h1>
        <div className="page-actions">
          {!isError && !isLoading && totalItems > 0 && (
            <ExportButton
              data={paginatedData}
              totalItems={totalItems}
              loadData={loadExport}
              columns={[
                { key: 'date_start', label: t('visits.date'), format: (val) => format(new Date(val), 'PP', { locale: dateLocale }) },
                { key: 'service_name', label: t('visits.service') },
                { key: 'client_name', label: t('visits.client') },
                { key: 'status', label: t('visits.status'), format: (val) => getStatusTranslation(val) },
                { key: 'price', label: t('visits.price'), format: (val) => val == null ? '-' : formatCurrency(val, currency) },
              ]}
              filename={`visits-${today()}`}
              title={t('export.visitsReport')}
              reportTypes={[t('export.visitsReport')]}
              dataType={hasFilters ? 'filtered' : 'all'}
              className="!border-[var(--workspace-line)] !bg-[var(--workspace-panel)] !text-[var(--workspace-ink)] !shadow-none hover:!bg-[var(--workspace-bg)] focus:!ring-[var(--workspace-focus)]"
            />
          )}
          {canEdit && (
            <Button onClick={() => { setEditingId(undefined); setShowForm(true) }}>
              <HiOutlinePlus aria-hidden="true" />
              {t('visits.newVisit')}
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-[var(--workspace-line)] p-4 sm:p-5">
          <Input
            id="visit-directory-search"
            type="search"
            value={searchQuery}
            aria-label={t('visits.searchPlaceholder')}
            placeholder={t('visits.searchPlaceholder')}
            onChange={event => { setSearchQuery(event.target.value); setCurrentPage(1) }}
            className="sm:max-w-md"
          />
          <div className="grid grid-cols-2 items-end gap-3 lg:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_auto]">
            <div className="col-span-2 sm:col-span-1">
              <span className="mb-1 block text-xs font-medium text-[var(--workspace-muted)]">{t('visits.status')}</span>
              <Select aria-label={t('visits.status')} value={statusFilter || ''}
                onChange={event => { setStatusFilter(event.target.value || null); setCurrentPage(1) }}>
                <option value="">{t('visits.allStatuses')}</option>
                <option value="planned">{t('visits.planned')}</option>
                <option value="in_progress">{t('visits.inProgress')}</option>
                <option value="completed">{t('visits.completed')}</option>
                <option value="cancelled">{t('visits.cancelled')}</option>
              </Select>
            </div>
            <div className="min-w-0">
              <label htmlFor="visits-from" className="mb-1 block text-xs font-medium text-[var(--workspace-muted)]">{t('visits.fromDate')}</label>
              <Input type="date" id="visits-from" value={dateFrom}
                onChange={event => { setDateFrom(event.target.value); setCurrentPage(1) }} />
            </div>
            <div className="min-w-0">
              <label htmlFor="visits-to" className="mb-1 block text-xs font-medium text-[var(--workspace-muted)]">{t('visits.toDate')}</label>
              <Input type="date" id="visits-to" value={dateTo}
                onChange={event => { setDateTo(event.target.value); setCurrentPage(1) }} />
            </div>
            {hasFilters && (
              <Button variant="quiet" className="col-span-2 justify-self-start sm:col-span-1"
                onClick={() => { setSearchQuery(''); setStatusFilter(null); setDateFrom(''); setDateTo(''); setCurrentPage(1) }}>
                {t('visits.clearFilters')}
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto" role="region" aria-label={t('visits.title')} tabIndex={0}>
          <table role="table" className="w-full min-w-[760px] table-fixed text-sm">
            <caption className="sr-only">{t('visits.title')}</caption>
            <thead role="rowgroup" className="border-b border-[var(--workspace-line)] bg-[var(--workspace-bg)]">
              <tr role="row">
                <TableSortHeader columnKey="date_start" label={t('visits.date')} currentSort={sortConfig} onSort={handleSort} className="w-[19%] px-4" />
                <TableSortHeader columnKey="client_name" label={t('visits.client')} currentSort={sortConfig} onSort={handleSort} className="w-[22%] px-4" />
                <TableSortHeader columnKey="service_name" label={t('visits.service')} currentSort={sortConfig} onSort={handleSort} className="w-[22%] px-4" />
                <th scope="col" className="w-[16%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--workspace-muted)]">{t('visits.status')}</th>
                <TableSortHeader columnKey="price" label={t('services.price')} currentSort={sortConfig} onSort={handleSort} className="w-[13%] px-4" />
                {canEdit && <th scope="col" className="w-[8%] px-2 py-3"><span className="sr-only">{t('common.actions')}</span></th>}
              </tr>
            </thead>
            <tbody role="rowgroup" className="divide-y divide-[var(--workspace-line)]">
              {isError ? (
                <tr><td colSpan={columnCount}><QueryError retry={refetch} /></td></tr>
              ) : isLoading ? (
                <tr><td colSpan={columnCount} className="py-8"><LoadingSpinner /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr role="row">
                  <td role="cell" colSpan={columnCount} className="px-4 py-10 text-center text-[var(--workspace-muted)]">
                    {hasFilters ? t('visits.noVisitsMatch') : t('visits.noVisitsFound')}
                  </td>
                </tr>
              ) : paginatedData.map(visit => (
                <tr role="row" key={visit.id} className="hover:bg-[var(--workspace-bg)]">
                  <td role="cell" className="px-4 py-3 align-top">
                    <time dateTime={visit.date_start} className="flex flex-col gap-0.5">
                      <span>{format(new Date(visit.date_start), 'PP', { locale: dateLocale })}</span>
                      <span className="text-xs tabular-nums text-[var(--workspace-muted)]">{format(new Date(visit.date_start), 'p', { locale: dateLocale })}</span>
                    </time>
                  </td>
                  <td role="cell" className="break-words px-4 py-3 align-top font-medium [overflow-wrap:anywhere]">{visit.client_name || '-'}</td>
                  <td role="cell" className="break-words px-4 py-3 align-top text-[var(--workspace-muted)] [overflow-wrap:anywhere]">{visit.service_name || '-'}</td>
                  <td role="cell" className="px-4 py-3 align-top">
                    <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusClass(visit.status)}`}>{getStatusTranslation(visit.status)}</span>
                  </td>
                  <td role="cell" className="break-words px-4 py-3 align-top tabular-nums [overflow-wrap:anywhere]">
                    {visit.price == null ? '-' : formatCurrency(visit.price, currency)}
                  </td>
                  {canEdit && (
                    <td role="cell" className="px-2 py-2 align-top text-center">
                      <Button variant="quiet" className="!px-2" onClick={() => handleEdit(visit.id)} title={t('common.edit')}>
                        <HiOutlinePencil aria-hidden="true" /><span className="sr-only">{t('common.edit')}</span>
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isError && totalPages > 1 && (
          <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems}
            perPage={perPage} onPageChange={setCurrentPage} onPerPageChange={setPerPage} />
        )}
      </Card>

      {canEdit && showForm && (
        <SidePanel fallbackFocusId="visit-directory-search" title={editingId === undefined ? t('visits.newVisit') : t('visits.editVisit')} onClose={closeForm}>
          <VisitForm key={editingId ?? 'new'} visitId={editingId} onSuccess={handleSuccess} onCancel={closeForm} />
        </SidePanel>
      )}
    </div>
  )
}
