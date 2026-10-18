import QueryError from '../components/QueryError'
import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cs } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import api from '../api/client'
import VisitForm from '../components/VisitForm'
import SearchBar from '../components/SearchBar'
import LoadingSpinner from '../components/LoadingSpinner'
import TableSortHeader from '../components/TableSortHeader'
import TablePagination from '../components/TablePagination'
import ExportButton from '../components/ExportButton'
import { useTranslation } from '../hooks/useTranslation'
import { useLabels } from '../i18n/labels'
import { useLocaleStore } from '../store/localeStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { sortData, SortConfig } from '../utils/table'
import type { VisitOut, ClientOut } from '../api/types'
import { today } from '../utils/dates'

type Visit = VisitOut & { client_name?: string }

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

  const { data: rawVisits, isLoading, isError, refetch } = useQuery<Visit[]>({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data } = await api.get('/visits/')
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    },
  })

  const { data: clients } = useQuery<ClientOut[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients/')
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    },
  })

  const visits = useMemo(() => {
    const clientNames = new Map(clients?.map(client => [client.id, client.full_name]))
    return rawVisits?.map(visit => ({
      ...visit,
      client_name: clientNames.get(visit.client_id) || visit.client_name,
    }))
  }, [rawVisits, clients])

  const filteredVisits = useMemo(() => {
    if (!visits) return []
    
    let filtered = visits.filter((visit) => {
      const matchesSearch =
        searchQuery === '' ||
        visit.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === null || visit.status === statusFilter
      
      let matchesDate = true
      if (dateFrom) {
        const fromDate = startOfDay(parseISO(dateFrom))
        const visitDate = new Date(visit.date_start)
        matchesDate = matchesDate && !isBefore(visitDate, fromDate)
      }
      if (dateTo) {
        const toDate = endOfDay(parseISO(dateTo))
        const visitDate = new Date(visit.date_start)
        matchesDate = matchesDate && !isAfter(visitDate, toDate)
      }
      
      return matchesSearch && matchesStatus && matchesDate
    })
    
    if (sortConfig.key && sortConfig.direction) {
      filtered = sortData(filtered, sortConfig)
    }
    
    return filtered
  }, [visits, searchQuery, statusFilter, dateFrom, dateTo, sortConfig])

  const { paginatedData, totalPages, totalItems } = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return {
      paginatedData: filteredVisits.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredVisits.length / perPage),
      totalItems: filteredVisits.length,
    }
  }, [filteredVisits, currentPage, perPage])

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

  if (isError) return <QueryError retry={refetch} />

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
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
              <SearchBar
                placeholder={t('visits.searchPlaceholder')}
                onSearch={setSearchQuery}
              />
            </div>
            {filteredVisits.length > 0 && (
              <ExportButton
                data={filteredVisits}
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
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500 pointer-events-none dark:bg-gray-800 dark:text-gray-400">{t('visits.fromDate')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 border rounded-md w-full pt-3"
              />
            </div>
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500 pointer-events-none dark:bg-gray-800 dark:text-gray-400">{t('visits.toDate')}</label>
              <input
                type="date"
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
              {paginatedData.length === 0 ? (
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

