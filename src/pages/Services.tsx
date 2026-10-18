import QueryError from '../components/QueryError'
import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import ServiceForm from '../components/ServiceForm'
import SearchBar from '../components/SearchBar'
import LoadingSpinner from '../components/LoadingSpinner'
import TableSortHeader from '../components/TableSortHeader'
import TablePagination from '../components/TablePagination'
import ExportButton from '../components/ExportButton'
import { useTranslation } from '../hooks/useTranslation'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { sortData, SortConfig } from '../utils/table'
import { today } from '../utils/dates'
import type { ServiceOut } from '../api/types'

type Service = ServiceOut

export default function Services() {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig<Service>>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const queryClient = useQueryClient()

  const { data: services, isLoading, isError, refetch } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get('/services/')
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    },
  })

  const filteredServices = useMemo(() => {
    if (!services) return []
    
    let filtered = services.filter((service) => {
      const needle = searchQuery.toLowerCase()
      const matchesSearch =
        searchQuery === '' ||
        service.name.toLowerCase().includes(needle) ||
        (service.description ?? '').toLowerCase().includes(needle)
      
      const matchesActive =
        activeFilter === null ||
        (activeFilter === 'active' && service.is_active) ||
        (activeFilter === 'inactive' && !service.is_active)
      
      return matchesSearch && matchesActive
    })
    
    if (sortConfig.key && sortConfig.direction) {
      filtered = sortData(filtered, sortConfig)
    }
    
    return filtered
  }, [services, searchQuery, activeFilter, sortConfig])

  const { paginatedData, totalPages, totalItems } = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return {
      paginatedData: filteredServices.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredServices.length / perPage),
      totalItems: filteredServices.length,
    }
  }, [filteredServices, currentPage, perPage])

  const handleSort = (key: keyof Service) => {
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
    queryClient.invalidateQueries({ queryKey: ['services'] })
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('services.title')}</h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {t('services.addService')}
          </button>
        )}
      </div>

      {!showForm && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <SearchBar
                placeholder={t('services.searchPlaceholder')}
                onSearch={setSearchQuery}
              />
            </div>
            {filteredServices.length > 0 && (
              <ExportButton
                data={filteredServices}
                columns={[
                  { key: 'name', label: t('services.name') },
                  { key: 'duration_minutes', label: t('services.duration'), format: (val) => `${val} ${t('services.min')}` },
                  { key: 'price', label: t('services.price'), format: (val) => formatCurrency(val, currency) },
                  { key: 'is_active', label: t('services.status'), format: (val) => val ? t('services.active') : t('services.inactive') },
                ]}
                  filename={`services-${today()}`}
                  title={t('export.servicesReport')}
                  reportTypes={[t('export.servicesReport')]}
                  dataType={searchQuery || activeFilter ? 'filtered' : 'all'}
              />
            )}
          </div>
          <div className="flex gap-4">
            <select
              value={activeFilter || ''}
              onChange={(e) => {
                setActiveFilter(e.target.value || null)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">{t('services.allServices')}</option>
              <option value="active">{t('services.activeOnly')}</option>
              <option value="inactive">{t('services.inactiveOnly')}</option>
            </select>
            {(searchQuery || activeFilter) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setActiveFilter(null)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t('services.clearFilters')}
              </button>
            )}
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <ServiceForm
            serviceId={editingId}
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
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <TableSortHeader
                  columnKey="name"
                  label={t('services.name')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <TableSortHeader
                  columnKey="duration_minutes"
                  label={t('services.duration')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <TableSortHeader
                  columnKey="price"
                  label={t('services.price')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  {t('services.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery || activeFilter
                      ? t('services.noServicesMatch')
                      : t('services.noServicesFound')}
                  </td>
                </tr>
              ) : (
                paginatedData.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {service.name}
                  {service.description && (
                    <p className="mt-1 max-w-md text-xs font-normal text-gray-500 line-clamp-2 dark:text-gray-400" title={service.description}>
                      {service.description}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {service.duration_minutes} {t('services.min')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatCurrency(service.price, currency)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      service.is_active
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-pink-100 text-pink-700'
                    }`}
                  >
                    {service.is_active ? t('services.active') : t('services.inactive')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => handleEdit(service.id)}
                    className="text-blue-600 hover:text-blue-800"
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

