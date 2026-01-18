import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import ClientForm from '../components/ClientForm'
import SearchBar from '../components/SearchBar'
import LoadingSpinner from '../components/LoadingSpinner'
import TableSortHeader from '../components/TableSortHeader'
import TablePagination from '../components/TablePagination'
import ExportButton from '../components/ExportButton'
import ClientPersonalReportModal from '../components/ClientPersonalReportModal'
import { HiPrinter } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { sortData, SortConfig } from '../utils/table'

interface Client {
  id: number
  full_name: string
  contact_phone?: string
  contact_email?: string
  date_of_birth?: string
  gender?: string
}

function ClientLoyaltyBalance({ clientId }: { clientId: number }) {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const { data: balance, isLoading } = useQuery({
    queryKey: ['client-loyalty-balance', clientId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/loyalty/balance/${clientId}`)
        return data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        return null
      }
    },
    retry: false,
  })

  if (isLoading) {
    return <span className="text-gray-400">...</span>
  }

  if (!balance || (balance.points === 0 && balance.cashback === 0)) {
    return <span className="text-gray-400">-</span>
  }

  return (
    <div className="flex flex-col gap-1">
      {balance.points > 0 && (
        <span className="text-sm font-medium text-blue-600">
          {balance.points.toFixed(0)} {t('loyalty.points')}
        </span>
      )}
      {balance.cashback > 0 && (
        <span className="text-sm font-medium text-green-600">
          {formatCurrency(balance.cashback, currency)} {t('loyalty.cashback')}
        </span>
      )}
      {balance.level && (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
          {balance.level.name}
        </span>
      )}
    </div>
  )
}

export default function Clients() {
  const { t } = useTranslation()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig<Client>>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [clientReportId, setClientReportId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients/')
      // API returns paginated response, extract items array
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    },
  })

  const filteredClients = useMemo(() => {
    if (!clients) return []
    
    let filtered = clients.filter((client) => {
      const matchesSearch =
        searchQuery === '' ||
        client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesGender = genderFilter === null || client.gender === genderFilter
      
      return matchesSearch && matchesGender
    })
    
    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      filtered = sortData(filtered, sortConfig)
    }
    
    return filtered
  }, [clients, searchQuery, genderFilter, sortConfig])

  // Pagination
  const { paginatedData, totalPages, totalItems } = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return {
      paginatedData: filteredClients.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredClients.length / perPage),
      totalItems: filteredClients.length,
    }
  }, [filteredClients, currentPage, perPage])

  const handleSort = (key: keyof Client) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' }
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null }
        }
      }
      return { key, direction: 'asc' }
    })
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingId(undefined)
    queryClient.invalidateQueries({ queryKey: ['clients'] })
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('clients.title')}</h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {t('clients.addClient')}
          </button>
        )}
      </div>

      {!showForm && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <SearchBar
                placeholder={t('clients.searchPlaceholder')}
                onSearch={setSearchQuery}
              />
            </div>
            <div className="flex gap-4 items-center">
              <select
                value={genderFilter || ''}
                onChange={(e) => {
                  setGenderFilter(e.target.value || null)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 border rounded-md"
              >
                <option value="">{t('clients.allGenders')}</option>
                <option value="male">{t('clients.male')}</option>
                <option value="female">{t('clients.female')}</option>
                <option value="other">{t('clients.other')}</option>
              </select>
              {filteredClients.length > 0 && (
                <ExportButton
                  data={filteredClients}
                  columns={[
                    { key: 'full_name', label: t('clients.name') },
                    { key: 'contact_phone', label: t('clients.phone') },
                    { key: 'contact_email', label: t('clients.email') },
                    { key: 'gender', label: 'Gender' },
                    { key: 'date_of_birth', label: 'Date of Birth', format: (val) => val ? new Date(val).toLocaleDateString() : '-' },
                  ]}
                  filename={`clients-${new Date().toISOString().split('T')[0]}`}
                  title={t('export.clientReport')}
                  reportTypes={[
                    t('export.clientProfile'),
                    t('export.clientContacts'),
                    t('export.clientVisits'),
                  ]}
                  dataType={searchQuery || genderFilter ? 'filtered' : 'all'}
                />
              )}
              {(searchQuery || genderFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setGenderFilter(null)
                    setCurrentPage(1)
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {t('clients.clearFilters')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Personal Report Modal */}
      {clientReportId && (
        <ClientPersonalReportModal
          isOpen={!!clientReportId}
          onClose={() => setClientReportId(null)}
          clientId={clientReportId}
        />
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <ClientForm
            clientId={editingId}
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
                  columnKey="full_name"
                  label={t('clients.name')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-2 sm:px-6"
                />
                <TableSortHeader
                  columnKey="contact_phone"
                  label={t('clients.phone')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-2 sm:px-6 hidden sm:table-cell"
                />
                <TableSortHeader
                  columnKey="contact_email"
                  label={t('clients.email')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-2 sm:px-6 hidden md:table-cell"
                />
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                  {t('loyalty.points')}
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 sm:px-6 py-4 text-center text-gray-500">
                    {searchQuery || genderFilter ? t('clients.noClientsMatch') : t('clients.noClientsFound')}
                  </td>
                </tr>
              ) : (
                paginatedData.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{client.full_name}</span>
                      <span className="text-xs text-gray-500 sm:hidden mt-1">
                        {client.contact_phone || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {client.contact_phone || '-'}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {client.contact_email || '-'}
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell">
                    <ClientLoyaltyBalance clientId={client.id} />
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(client.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => setClientReportId(client.id)}
                        className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                        title={t('export.personalReport')}
                      >
                        <HiPrinter className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('common.print')}</span>
                      </button>
                    </div>
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

