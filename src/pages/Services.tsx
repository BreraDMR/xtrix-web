import { fetchAllServices } from '../api/services'
import QueryError from '../components/QueryError'
import ContextHint from '../components/onboarding/ContextHint'
import { useEffect, useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ServiceForm from '../components/ServiceForm'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SidePanel from '../ui/SidePanel'
import { HiOutlineChevronRight, HiOutlinePlus } from 'react-icons/hi'
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
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
  const access = useWorkspaceAccessContext()
  const canEdit = !access || access.crm_mode === 'full'

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig<Service>>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const queryClient = useQueryClient()
  useEffect(() => { if (!canEdit) { setShowForm(false); setEditingId(undefined) } }, [canEdit])

  const { data: services, isLoading, isError, refetch } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: ({ signal }) => fetchAllServices(signal),
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

  useEffect(() => {
    if (!isLoading && !isError && currentPage > Math.max(1, totalPages)) setCurrentPage(Math.max(1, totalPages))
  }, [isLoading, isError, currentPage, totalPages])

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

  return (
    <div>
      <div className="page-toolbar">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">{t('services.title')}</h1>
            <span className="rounded border border-[var(--workspace-line)] px-2 py-0.5 text-xs tabular-nums text-[var(--workspace-muted)]">{isLoading || isError ? '—' : totalItems}</span>
          </div>
          <p className="page-subtitle">{t('services.subtitle')}</p>
        </div>
        {canEdit && <Button onClick={() => { setEditingId(undefined); setShowForm(true) }}><HiOutlinePlus />{t('services.addService')}</Button>}
      </div>

      {!isLoading && !isError && canEdit && services?.length === 0 && !searchQuery && !activeFilter && (
        <ContextHint hint="services" onAction={() => { setEditingId(undefined); setShowForm(true) }} />
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1 basis-64 sm:max-w-sm">
          <Input id="service-directory-search" type="search" aria-label={t('services.searchPlaceholder')} placeholder={t('services.searchPlaceholder')}
            value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setCurrentPage(1) }} />
        </div>
        <Select aria-label={t('services.status')} value={activeFilter || ''} className="w-auto max-w-full"
          onChange={event => { setActiveFilter(event.target.value || null); setCurrentPage(1) }}>
          <option value="">{t('services.allServices')}</option>
          <option value="active">{t('services.activeOnly')}</option>
          <option value="inactive">{t('services.inactiveOnly')}</option>
        </Select>
        {(searchQuery || activeFilter) && <Button variant="quiet" onClick={() => { setSearchQuery(''); setActiveFilter(null); setCurrentPage(1) }}>{t('services.clearFilters')}</Button>}
        {!isLoading && !isError && filteredServices.length > 0 && <div className="ml-auto">
          <ExportButton data={filteredServices}
            columns={[
              { key: 'name', label: t('services.name') },
              { key: 'duration_minutes', label: t('services.duration'), format: value => `${value} ${t('services.min')}` },
              { key: 'price', label: t('services.price'), format: value => formatCurrency(value, currency) },
              { key: 'is_active', label: t('services.status'), format: value => value ? t('services.active') : t('services.inactive') },
            ]}
            filename={`services-${today()}`} title={t('export.servicesReport')}
            reportTypes={[t('export.servicesReport')]} dataType={searchQuery || activeFilter ? 'filtered' : 'all'} />
        </div>}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-[var(--workspace-bg)]">
              <tr>
                <TableSortHeader columnKey="name" label={t('services.name')} currentSort={sortConfig} onSort={handleSort} className="px-4 sm:w-[44%] sm:px-5" />
                <TableSortHeader columnKey="duration_minutes" label={t('services.duration')} currentSort={sortConfig} onSort={handleSort} className="hidden px-4 sm:table-cell sm:px-5" />
                <TableSortHeader columnKey="price" label={t('services.price')} currentSort={sortConfig} onSort={handleSort} className="hidden px-4 sm:table-cell sm:px-5" />
                <th className="w-28 px-4 py-3 text-left text-xs font-medium text-[var(--workspace-muted)] sm:w-auto sm:px-5">{t('services.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--workspace-line)]">
              {isError ? <tr><td colSpan={4}><QueryError retry={refetch} /></td></tr>
                : isLoading ? <tr><td colSpan={4} className="py-8"><LoadingSpinner /></td></tr>
                  : paginatedData.length === 0 ? <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-[var(--workspace-muted)]">{searchQuery || activeFilter ? t('services.noServicesMatch') : t('services.noServicesFound')}</td></tr>
                    : paginatedData.map(service => <tr key={service.id} className="hover:bg-[var(--workspace-bg)]">
                      <td className="px-4 py-3 sm:px-5">
                        {canEdit ? <button type="button" onClick={() => handleEdit(service.id)} aria-label={`${t('common.edit')}: ${service.name}`}
                          className="inline-flex max-w-full items-center gap-2 text-left text-sm font-medium hover:text-[var(--workspace-accent)]">
                          <span className="min-w-0 [overflow-wrap:anywhere]">{service.name}</span><HiOutlineChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-muted)]" />
                        </button> : <span className="text-sm font-medium [overflow-wrap:anywhere]">{service.name}</span>}
                        {service.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--workspace-muted)] [overflow-wrap:anywhere]" title={service.description}>{service.description}</p>}
                        <span className="mt-1 block text-xs tabular-nums text-[var(--workspace-muted)] sm:hidden">{service.duration_minutes} {t('services.min')} · {formatCurrency(service.price, currency)}</span>
                      </td>
                      <td className="hidden px-4 py-3 text-sm tabular-nums text-[var(--workspace-muted)] sm:table-cell sm:px-5">{service.duration_minutes} {t('services.min')}</td>
                      <td className="hidden px-4 py-3 text-sm tabular-nums text-[var(--workspace-ink)] sm:table-cell sm:px-5">{formatCurrency(service.price, currency)}</td>
                      <td className="px-4 py-3 sm:px-5"><span className={`inline-flex rounded px-2 py-1 text-xs ${service.is_active ? 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]' : 'bg-[var(--workspace-bg)] text-[var(--workspace-muted)]'}`}>{service.is_active ? t('services.active') : t('services.inactive')}</span></td>
                    </tr>)}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && (totalPages > 1 ? <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems}
          perPage={perPage} onPageChange={setCurrentPage} onPerPageChange={value => { setPerPage(value); setCurrentPage(1) }} />
          : <p className="border-t border-[var(--workspace-line)] px-5 py-3 text-xs text-[var(--workspace-muted)]">{t('pagination.range').replace('{start}', String(totalItems ? 1 : 0)).replace('{end}', String(totalItems)).replace('{total}', String(totalItems))}</p>)}
      </Card>

      {showForm && canEdit && <SidePanel title={t(editingId ? 'services.editService' : 'services.addService')} onClose={() => { setShowForm(false); setEditingId(undefined) }}>
        <ServiceForm key={editingId ?? 'new'} serviceId={editingId} onSuccess={handleSuccess} onCancel={() => { setShowForm(false); setEditingId(undefined) }} />
      </SidePanel>}
    </div>
  )
}
