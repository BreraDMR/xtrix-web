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

  const handleSuccess = () => {
    setShowForm(false)
    setEditingId(undefined)
    queryClient.invalidateQueries({ queryKey: ['visits'] })
    queryClient.invalidateQueries({ queryKey: ['visits-statistics'] })
    queryClient.invalidateQueries({ queryKey: ['clients-statistics'] })
  }

  const handleEdit = (id: number) => {
    setEditingId(id)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('visits.title')}</h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {t('visits.newVisit')}
          </button>
        )}
      </div>

      {!showForm && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                type="search"
                value={searchQuery}
                aria-label={t('visits.searchPlaceholder')}
                placeholder={t('visits.searchPlaceholder')}
                onChange={event => { setSearchQuery(event.target.value); setCurrentPage(1) }}
              />
            </div>
            {totalItems > 0 && (
              <ExportButton
                data={paginatedData}
                totalItems={totalItems}
                loadData={loadExport}
                columns={[
                  { key: 'date_start', label: t('visits.date'), format: (val) => format(new Date(val), 'PP', { locale: dateLocale }) },
                  { key: 'service_name', label: t('visits.service') },
                  { key: 'client_name', label: t('visits.client') },
                  { key: 'status', label: t('visits.status'), format: (val) => getStatusTranslation(val) },
                  { key: 'price', label: t('visits.price'), format: (val) => val ? formatCurrency(val, currency) : '-' },
                ]}
                filename={`visits-${today()}`}
                title={t('export.visitsReport')}
                reportTypes={[t('export.visitsReport')]}
                dataType={searchQuery || statusFilter || dateFrom || dateTo ? 'filtered' : 'all'}
              />
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              aria-label={t('visits.status')}
              value={statusFilter || ''}
              onChange={(e) => {
                setStatusFilter(e.target.value || null)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">{t('visits.allStatuses')}</option>
              <option value="planned">{t('visits.planned')}</option>
              <option value="in_progress">{t('visits.inProgress')}</option>
              <option value="completed">{t('visits.completed')}</option>
              <option value="cancelled">{t('visits.cancelled')}</option>
            </select>
            <div className="relative">
              <label htmlFor="visits-from" className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500 pointer-events-none dark:bg-gray-800 dark:text-gray-400">{t('visits.fromDate')}</label>
              <input
                type="date"
                id="visits-from"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 border rounded-md w-full pt-3"
              />
            </div>
            <div className="relative">
              <label htmlFor="visits-to" className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500 pointer-events-none dark:bg-gray-800 dark:text-gray-400">{t('visits.toDate')}</label>
              <input
                type="date"
                id="visits-to"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 border rounded-md w-full pt-3"
              />
            </div>
            {(searchQuery || statusFilter || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter(null)
                  setDateFrom('')
                  setDateTo('')
                  setCurrentPage(1)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-md dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t('visits.clearFilters')}
              </button>
            )}
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <VisitForm
            visitId={editingId}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingId(undefined)
            }}
          />
        </div>
      ) : (
      <div className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table role="table" className="responsive-card-table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead role="rowgroup" className="bg-gray-50 dark:bg-gray-900">
              <tr role="row">
                <TableSortHeader
                  columnKey="date_start"
                  label={t('visits.date')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-2 sm:px-6"
                />
                <TableSortHeader
                  columnKey="client_name"
                  label={t('visits.client')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-2 sm:px-6"
                />
                <TableSortHeader
                  columnKey="service_name"
                  label={t('visits.service')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-2 sm:px-6"
                />
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell dark:text-gray-400">
                  {t('visits.status')}
                </th>
                <TableSortHeader
                  columnKey="price"
                  label={t('services.price')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-2 sm:px-6 hidden md:table-cell"
                />
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {isError ? (
                <tr><td colSpan={6}><QueryError retry={refetch} /></td></tr>
              ) : isLoading ? (
                <tr><td colSpan={6} className="py-8"><LoadingSpinner /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr role="row">
                  <td role="cell" colSpan={6} className="px-2 sm:px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery || statusFilter || dateFrom || dateTo
                      ? t('visits.noVisitsMatch')
                      : t('visits.noVisitsFound')}
                  </td>
                </tr>
              ) : (
                paginatedData.map((visit) => (
                <tr role="row" key={visit.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td role="cell" data-label={t('visits.date')} className="px-2 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap">{format(new Date(visit.date_start), 'PP', { locale: dateLocale })}</span>
                      <span className="text-xs text-gray-500 sm:hidden dark:text-gray-400">{format(new Date(visit.date_start), 'p', { locale: dateLocale })}</span>
                    </div>
                  </td>
                  <td role="cell" data-label={t('visits.client')} className="px-2 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {visit.client_name || '-'}
                  </td>
                  <td role="cell" data-label={t('visits.service')} className="px-2 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span>{visit.service_name || '-'}</span>
                    </div>
                  </td>
                  <td role="cell" data-label={t('visits.status')} className="px-2 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      visit.status === 'completed' || visit.status === 'in_progress'
                        ? 'bg-purple-100 text-purple-700'
                        : visit.status === 'cancelled'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {getStatusTranslation(visit.status)}
                    </span>
                  </td>
                  <td role="cell" data-label={t('services.price')} className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {visit.price ? formatCurrency(visit.price, currency) : '-'}
                  </td>
                  <td role="cell" data-label={t('common.actions')} className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <button
                      onClick={() => handleEdit(visit.id)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        )}
      </div>
      )}
    </div>
  )
}

