import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Card from '../ui/Card'
import QueryError from '../components/QueryError'
import ContextHint from '../components/onboarding/ContextHint'
import { useState, useMemo, useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import ClientForm from '../components/ClientForm'
import LoadingSpinner from '../components/LoadingSpinner'
import TableSortHeader from '../components/TableSortHeader'
import TablePagination from '../components/TablePagination'
import ExportButton from '../components/ExportButton'
import ClientPersonalReportModal from '../components/ClientPersonalReportModal'
import ImportClientsModal from '../components/ImportClientsModal'
import { HiPrinter, HiUpload } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { sortData, SortConfig } from '../utils/table'
import type { ClientOut } from '../api/types'
import { showDay, today } from '../utils/dates'

type Client = ClientOut

function ClientLoyaltyBalance({ clientId }: { clientId: number }) {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const { data: balance, isLoading } = useQuery({
    queryKey: ['client-loyalty-balance', clientId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/loyalty/balance/${clientId}`)
        return data
      } catch (error) {
        if (apiErrorStatus(error) === 404) {
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
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const perPageOptions = [10, 20, 50, 100]

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
  const [genderFilter, setGenderFilter] = useState<string | null>(() => searchParams.get('gender'))
  const [sortConfig, setSortConfig] = useState<SortConfig<Client>>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(() => {
    const page = Number(searchParams.get('page'))
    return Number.isInteger(page) && page > 0 ? page : 1
  })
  const [perPage, setPerPage] = useState(() => {
    const value = Number(searchParams.get('per_page'))
    return perPageOptions.includes(value) ? value : 20
  })
  const [clientReportId, setClientReportId] = useState<number | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const next = new URLSearchParams()
    if (searchQuery) next.set('q', searchQuery)
    if (genderFilter) next.set('gender', genderFilter)
    if (currentPage > 1) next.set('page', String(currentPage))
    if (perPage !== 20) next.set('per_page', String(perPage))
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [searchQuery, genderFilter, currentPage, perPage, searchParams, setSearchParams])

  const openWorkspace = (id: number) => {
    navigate(`/app/clients/${id}`, {
      state: { from: `${location.pathname}${location.search}` },
    })
  }

  const { data: clients, isLoading, isError, refetch } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients/')
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

    if (sortConfig.key && sortConfig.direction) {
      filtered = sortData(filtered, sortConfig)
    }

    return filtered
  }, [clients, searchQuery, genderFilter, sortConfig])

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
    queryClient.invalidateQueries({ queryKey: ['clients'] })
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
      <div className="page-toolbar">
        <div className="flex items-center gap-3">
          <h1 className="page-title">{t('clients.title')}</h1>
          <span className="rounded-full border border-[var(--workspace-line)] px-3 py-1 text-sm tabular-nums text-[var(--workspace-muted)]">{clients?.length ?? 0}</span>
        </div>
        {!showForm && (
          <div className="page-actions">
            <Button
              onClick={() => setShowImportModal(true)}
              variant="secondary"
            >
              <HiUpload className="w-4 h-4" />
              {t('import.title')}
            </Button>
            <Button
              onClick={() => {
                setEditingId(undefined)
                setShowForm(true)
              }}
              variant="primary"
            >
              {t('clients.addClient')}
            </Button>
          </div>
        )}
      </div>

      {!showForm && clients?.length === 0 && !searchQuery && !genderFilter && (
        <ContextHint
          hint="clients"
          onAction={() => {
            setEditingId(undefined)
            setShowForm(true)
          }}
        />
      )}

      {!showForm && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:max-w-md">
              <Input
                type="search"
                aria-label={t('clients.searchPlaceholder')}
                placeholder={t('clients.searchPlaceholder')}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                className="w-full"
              />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Select
                aria-label={t('clientForm.gender')}
                value={genderFilter || ''}
                onChange={(e) => {
                  setGenderFilter(e.target.value || null)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-auto"
              >
                <option value="">{t('clients.allGenders')}</option>
                <option value="male">{t('clients.male')}</option>
                <option value="female">{t('clients.female')}</option>
                <option value="other">{t('clients.other')}</option>
              </Select>
              {filteredClients.length > 0 && (
                <ExportButton
                  data={filteredClients}
                  columns={[
                    { key: 'full_name', label: t('clients.name') },
                    { key: 'contact_phone', label: t('clients.phone') },
                    { key: 'contact_email', label: t('clients.email') },
                    { key: 'gender', label: t('clientForm.gender') },
                    { key: 'birth_date', label: t('clientForm.birthDate'), format: (val) => showDay(val) },
                  ]}
                  filename={`clients-${today()}`}
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
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setGenderFilter(null)
                    setCurrentPage(1)
                  }}
                  variant="quiet"
                >
                  {t('clients.clearFilters')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {clientReportId && (
        <ClientPersonalReportModal
          isOpen={!!clientReportId}
          onClose={() => setClientReportId(null)}
          clientId={clientReportId}
        />
      )}

      {showImportModal && (
        <ImportClientsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onOpenClient={(id) => {
            setShowImportModal(false)
            handleEdit(id)
          }}
        />
      )}

      {showForm ? (
        <Card className="p-5 sm:p-6">
          <ClientForm
            key={editingId ?? 'new'}
            clientId={editingId}
            onSuccess={handleSuccess}
            onOpenExisting={handleEdit}
            onCancel={() => {
              setShowForm(false)
              setEditingId(undefined)
            }}
          />
        </Card>
      ) : (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--workspace-line)]">
            <thead className="bg-[var(--workspace-bg)]">
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
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell dark:text-gray-400">
                  {t('loyalty.points')}
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--workspace-line)]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 sm:px-6 py-4 text-center text-[var(--workspace-muted)]">
                    {searchQuery || genderFilter ? t('clients.noClientsMatch') : t('clients.noClientsFound')}
                  </td>
                </tr>
              ) : (
                paginatedData.map((client) => (
                <tr key={client.id} className="hover:bg-[var(--workspace-bg)]">
                  <td className="px-2 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">{client.full_name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase()}</span>
                      <div className="flex min-w-0 flex-col">
                        <span>{client.full_name}</span>
                      <span className="text-xs text-gray-500 sm:hidden mt-1 dark:text-gray-400">
                        {client.contact_phone || '-'}
                      </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
                    {client.contact_phone || '-'}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell dark:text-gray-400">
                    {client.contact_email || '-'}
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-sm text-gray-500 hidden lg:table-cell dark:text-gray-400">
                    <ClientLoyaltyBalance clientId={client.id} />
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-[var(--workspace-muted)]">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => openWorkspace(client.id)}
                        variant="quiet"
                      >
                        {t('clients.open')}
                      </Button>
                      <Button
                        onClick={() => handleEdit(client.id)}
                        variant="quiet"
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        onClick={() => setClientReportId(client.id)}
                        variant="quiet"
                        title={t('export.personalReport')}
                      >
                        <HiPrinter className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('common.print')}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={(value) => { setPerPage(value); setCurrentPage(1) }}
          />
        ) : (
          <p className="border-t border-[var(--workspace-line)] px-6 py-4 text-xs text-[var(--workspace-muted)]">{t('pagination.range').replace('{start}', String(totalItems ? 1 : 0)).replace('{end}', String(totalItems)).replace('{total}', String(totalItems))}</p>
        )}
      </Card>
      )}
    </div>
  )
}

