import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
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
import { useLocaleStore } from '../store/localeStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { sortData, SortConfig } from '../utils/table'

export default function Visits() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const currency = useBusinessCurrency()
  
  const dateLocale = locale === 'ru' ? ru : locale === 'cz' ? cs : enUS
  
  const getStatusTranslation = (status: string) => {
    const statusMap: Record<string, string> = {
      'planned': t('visits.planned'),
      'in_progress': t('visits.inProgress'),
      'completed': t('visits.completed'),
      'cancelled': t('visits.cancelled'),
    }
    return statusMap[status] || status
  }

interface Visit {
  id: number
  date_start: string
  service_name?: string
  status: string
  price?: number
  client_name?: string
}

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

  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data } = await api.get('/visits/')
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    },
  })

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
        const fromDate = startOfDay(new Date(dateFrom))
        const visitDate = new Date(visit.date_start)
        matchesDate = matchesDate && !isBefore(visitDate, fromDate)
      }
      if (dateTo) {
        const toDate = endOfDay(new Date(dateTo))
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
                filename={`visits-${new Date().toISOString().split('T')[0]}`}
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
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500 pointer-events-none">{t('visits.fromDate')}</label>
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
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500 pointer-events-none">{t('visits.toDate')}</label>
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
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-md"
              >
                {t('visits.clearFilters')}
              </button>
            )}
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow">
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
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableSortHeader
                  columnKey="date_start"
                  label={t('visits.date')}
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
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  {t('visits.status')}
                </th>
                <TableSortHeader
                  columnKey="price"
                  label={t('services.price')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-2 sm:px-6 hidden md:table-cell"
                />
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 sm:px-6 py-4 text-center text-gray-500">
                    {searchQuery || statusFilter || dateFrom || dateTo
                      ? t('visits.noVisitsMatch')
                      : t('visits.noVisitsFound')}
                  </td>
                </tr>
              ) : (
                paginatedData.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap">{format(new Date(visit.date_start), 'PP', { locale: dateLocale })}</span>
                      <span className="text-xs text-gray-500 sm:hidden">{format(new Date(visit.date_start), 'p', { locale: dateLocale })}</span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>{visit.service_name || '-'}</span>
                      <span className="text-xs sm:hidden mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          visit.status === 'completed' || visit.status === 'in_progress'
                            ? 'bg-purple-100 text-purple-700'
                            : visit.status === 'cancelled'
                            ? 'bg-pink-100 text-pink-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {getStatusTranslation(visit.status)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
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
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {visit.price ? formatCurrency(visit.price, currency) : '-'}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

