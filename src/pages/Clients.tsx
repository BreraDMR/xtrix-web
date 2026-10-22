import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Card from '../ui/Card'
import QueryError from '../components/QueryError'
import ContextHint from '../components/onboarding/ContextHint'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import ClientForm from '../components/ClientForm'
import LoadingSpinner from '../components/LoadingSpinner'
import TableSortHeader from '../components/TableSortHeader'
import TablePagination from '../components/TablePagination'
import ExportButton from '../components/ExportButton'
import ClientWorkspace from '../components/clients/ClientWorkspace'
import SidePanel from '../ui/SidePanel'
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import ImportClientsModal from '../components/ImportClientsModal'
import { HiChevronRight, HiUpload } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { SortConfig } from '../utils/table'
import type { ClientOut, ClientPage } from '../api/types'
import { showDay, today } from '../utils/dates'
import { allPages } from '../api/allPages'
import { useAuthStore } from '../store/authStore'

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
  const access = useWorkspaceAccessContext()
  const canEdit = !access || access.crm_mode === 'full'
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
  const [selectedId, setSelectedId] = useState<number | null>(null)
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

  const openWorkspace = (id: number) => setSelectedId(id)
  useEffect(() => {
    if (!canEdit) { setShowForm(false); setShowImportModal(false) }
  }, [canEdit])

  const identity = useAuthStore(state => state.sessionRevision)
  const user = useAuthStore(state => state.user)
  const filters = {
    q: searchQuery || undefined,
    gender: genderFilter || undefined,
    sort_by: sortConfig.key ?? 'id',
    sort_order: sortConfig.direction ?? 'asc',
  }
  const { data: result, isLoading, isError, refetch } = useQuery<ClientPage>({
    queryKey: ['clients', 'directory', identity, user?.id, user?.business_id, user?.employer_id,
      currentPage, perPage, filters],
    queryFn: async ({ signal }) => (await api.get<ClientPage>('/clients/', {
      params: { ...filters, page: currentPage, per_page: perPage }, signal,
    })).data,
  })
  const clients = result?.items ?? []
  const paginatedData = clients
  const totalItems = result?.total ?? 0
  const totalPages = result?.pages ?? 0
  const loadExport = () => allPages<Client>(async page => (await api.get<ClientPage>('/clients/', {
    params: { ...filters, page, per_page: 100 },
  })).data)

  useEffect(() => {
    if (result && currentPage > Math.max(1, result.pages)) setCurrentPage(Math.max(1, result.pages))
  }, [result, currentPage])

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


  return (
    <div>
      <div className="page-toolbar">
        <div className="flex items-center gap-3">
          <h1 className="page-title">{t('clients.title')}</h1>
          <span className="rounded-full border border-[var(--workspace-line)] px-3 py-1 text-sm tabular-nums text-[var(--workspace-muted)]">{totalItems}</span>
        </div>
        {!showForm && canEdit && (
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

      {!showForm && canEdit && !isLoading && !isError && totalItems === 0 && !searchQuery && !genderFilter && (
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
                id="client-directory-search"
                type="search"
                maxLength={200}
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
              {totalItems > 0 && (
                <ExportButton
                  data={clients}
                  totalItems={totalItems}
                  loadData={loadExport}
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

      {selectedId !== null && <SidePanel title={t('clientWorkspace.record')} onClose={() => setSelectedId(null)} fallbackFocusId="client-directory-search">
        <ClientWorkspace key={selectedId} embeddedClientId={selectedId} onClose={() => setSelectedId(null)} />
      </SidePanel>}

      {showImportModal && canEdit && (
        <ImportClientsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onOpenClient={(id) => {
            setShowImportModal(false)
            handleEdit(id)
          }}
        />
      )}

      {showForm && canEdit ? (
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
          <table className="w-full table-fixed divide-y divide-[var(--workspace-line)]">
            <thead className="bg-[var(--workspace-bg)]">
              <tr>
                <TableSortHeader
                  columnKey="full_name"
                  label={t('clients.name')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-4 sm:px-5 sm:w-[40%] md:w-[30%]"
                />
                <TableSortHeader
                  columnKey="contact_phone"
                  label={t('clients.phone')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-4 sm:px-5 hidden sm:table-cell md:w-[20%]"
                />
                <TableSortHeader
                  columnKey="contact_email"
                  label={t('clients.email')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-4 sm:px-5 hidden md:table-cell"
                />
                <th className="px-4 sm:px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell lg:w-[12%] dark:text-gray-400">
                  {t('loyalty.points')}
                </th>

              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--workspace-line)]">
              {isError ? (
                <tr><td colSpan={4}><QueryError retry={refetch} /></td></tr>
              ) : isLoading ? (
                <tr><td colSpan={4} className="py-8"><LoadingSpinner /></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-5 py-4 text-center text-[var(--workspace-muted)]">
                    {searchQuery || genderFilter ? t('clients.noClientsMatch') : t('clients.noClientsFound')}
                  </td>
                </tr>
              ) : (
                paginatedData.map((client) => (
                <tr key={client.id} className="hover:bg-[var(--workspace-bg)]">
                  <td className="px-4 py-3 text-sm font-medium sm:px-5">
                    <button type="button" onClick={() => openWorkspace(client.id)} aria-label={`${t('clients.open')}: ${client.full_name}`}
                      className="group flex w-full min-w-0 items-center gap-3 text-left hover:text-[var(--workspace-accent)]">
                      <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--workspace-accent-soft)] text-[11px] font-semibold text-[var(--workspace-accent)]">{client.full_name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase()}</span>
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]"><span>{client.full_name}</span>
                        <span className="mt-0.5 block text-xs font-normal text-[var(--workspace-muted)] sm:hidden">{client.contact_phone || client.contact_email || '—'}</span>
                      </span>
                      <HiChevronRight className="h-4 w-4 shrink-0 text-[var(--workspace-muted)]" />
                    </button>
                  </td>
                  <td className="px-4 sm:px-5 py-3 truncate text-sm text-gray-500 hidden sm:table-cell dark:text-gray-400">
                    {client.contact_phone || '-'}
                  </td>
                  <td className="px-4 sm:px-5 py-3 truncate text-sm text-gray-500 hidden md:table-cell dark:text-gray-400">
                    {client.contact_email || '-'}
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-sm text-gray-500 hidden lg:table-cell dark:text-gray-400">
                    <ClientLoyaltyBalance clientId={client.id} />
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

