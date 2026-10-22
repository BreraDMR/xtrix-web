import QueryError from '../components/QueryError'
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
import type { EmployeeOut } from '../api/types'
import LoadingSpinner from '../components/LoadingSpinner'
import EmployeeForm from '../components/EmployeeForm'
import TableSortHeader from '../components/TableSortHeader'
import TablePagination from '../components/TablePagination'
import ExportButton from '../components/ExportButton'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { sortData, SortConfig } from '../utils/table'
import { today } from '../utils/dates'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { HiOutlinePlus } from 'react-icons/hi'

type Employee = EmployeeOut
function contact(employee: Employee, field: 'full_name' | 'email' | 'phone'): string {
  const value = employee.employee_user?.[field]
  return typeof value === 'string' ? value : ''
}

export default function Employees() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, sessionRevision } = useAuthStore()
  const access = useWorkspaceAccessContext()
  const canManageEmployees = user?.role === 'admin' || user?.role === 'business_owner'
  const canEdit = canManageEmployees && (!access || access.crm_mode === 'full')
  const queryClient = useQueryClient()
  const currency = useBusinessCurrency()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [sortConfig, setSortConfig] = useState<SortConfig<Employee>>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  useEffect(() => {
    if (!canEdit) { setShowForm(false); setEditingId(undefined) }
  }, [canEdit])

  const { data: employees, isLoading, isError, refetch } = useQuery<Employee[]>({
    queryKey: ['employees', activeOnly, sessionRevision, user?.id, user?.business_id, user?.employer_id],
    queryFn: async ({ signal }) => {
      const checkSession = () => {
        const state = useAuthStore.getState()
        if (signal.aborted || state.sessionRevision !== sessionRevision || state.user?.id !== user?.id ||
            state.user?.business_id !== user?.business_id || state.user?.employer_id !== user?.employer_id) throw new Error('Session changed')
      }
      const rows: Employee[] = []
      const ids = new Set<number>()
      // This endpoint has array pages, with no total/pages envelope.
      for (let page = 1; page <= 10000; page++) {
        checkSession()
        const { data } = await api.get<Employee[]>('/employees/', { params: { is_active: activeOnly, page, per_page: 100 }, signal })
        checkSession()
        if (!Array.isArray(data) || data.length > 100) throw new Error('Invalid employee page')
        for (const employee of data) {
          if (!Number.isInteger(employee.id) || ids.has(employee.id)) throw new Error('Employee data changed')
          ids.add(employee.id)
          rows.push(employee)
        }
        if (data.length < 100) return rows
      }
      throw new Error('Incomplete employee directory')
    },
    enabled: canManageEmployees,
  })

  const fireEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => { await api.delete(`/employees/${employeeId}`) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }) },
  })
  const filteredEmployees = useMemo(() => {
    const needle = searchQuery.toLowerCase()
    const filtered = (employees ?? []).filter(employee => [contact(employee, 'full_name'), contact(employee, 'email'),
      contact(employee, 'phone'), employee.position ?? ''].some(value => value.toLowerCase().includes(needle)))
    return sortData(filtered, sortConfig)
  }, [employees, searchQuery, sortConfig])
  const totalItems = filteredEmployees.length
  const totalPages = Math.ceil(totalItems / perPage)
  const paginatedData = filteredEmployees.slice((currentPage - 1) * perPage, currentPage * perPage)
  useEffect(() => {
    if (!isLoading && !isError && currentPage > Math.max(1, totalPages)) setCurrentPage(Math.max(1, totalPages))
  }, [isLoading, isError, currentPage, totalPages])
  const handleSort = (key: keyof Employee) => {
    setSortConfig(previous => previous.key === key && previous.direction === 'desc' ? { key: null, direction: null }
      : { key, direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc' })
    setCurrentPage(1)
  }

  if (!canManageEmployees) return <Card className="p-5"><p>{t('employees.access_denied')}</p></Card>

  return (
    <div className="min-w-0">
      <div className="page-toolbar">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="page-title">{t('employees.title')}</h1>
          <span className="rounded border border-[var(--workspace-line)] px-2 py-0.5 text-xs tabular-nums text-[var(--workspace-muted)]">{isLoading || isError ? '—' : totalItems}</span>
        </div>
        {canEdit && <Button onClick={() => { setEditingId(undefined); setShowForm(true) }}><HiOutlinePlus />{t('employees.add_employee')}</Button>}
      </div>
      <Card className="min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--workspace-line)] p-4">
          <div className="min-w-0 flex-1 basis-60 sm:max-w-sm">
            <Input type="search" aria-label={t('employees.search_placeholder')} placeholder={t('employees.search_placeholder')}
              value={searchQuery} onChange={event => { setSearchQuery(event.target.value); setCurrentPage(1) }} />
          </div>
          <Select aria-label={t('employees.status')} className="w-auto max-w-full" value={activeOnly ? 'active' : 'inactive'}
            onChange={event => { setActiveOnly(event.target.value === 'active'); setCurrentPage(1) }}>
            <option value="active">{t('employees.active')}</option><option value="inactive">{t('employees.inactive')}</option>
          </Select>
          {!isError && !isLoading && filteredEmployees.length > 0 && <div className="ml-auto"><ExportButton data={filteredEmployees}
            columns={[
              { key: 'employee_user', label: t('employees.employee'), format: value => typeof value?.full_name === 'string' ? value.full_name : t('employees.unknown') },
              { key: 'employee_user', label: t('register.email'), format: value => typeof value?.email === 'string' ? value.email : '-' },
              { key: 'position', label: t('employees.position') },
              { key: 'commission_percentage', label: t('employees.commission'), format: value => value == null ? '-' : `${value}%` },
              { key: 'base_salary', label: t('employees.base_salary'), format: value => value == null ? '-' : formatCurrency(value, currency) },
              { key: 'is_active', label: t('employees.status'), format: value => value ? t('employees.active') : t('employees.inactive') },
              { key: 'hired_at', label: t('employees.hired_at'), format: value => value ? new Date(value).toLocaleDateString() : '-' },
            ]} filename={`employees-${today()}`} title={t('export.employeesReport')} reportTypes={[t('export.employeesReport')]} dataType="filtered" /></div>}
        </div>
        {fireEmployeeMutation.isError && <p role="alert" className="px-4 py-3 text-sm text-red-700 dark:text-red-300">{apiErrorMessage(fireEmployeeMutation.error, t('common.error_saving'))}</p>}
        <div role="region" aria-label={t('employees.title')} tabIndex={0} className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed">
            <thead className="bg-[var(--workspace-bg)]">
              <tr>
                <th scope="col" className="w-[24%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--workspace-muted)]">{t('employees.employee')}</th>
                <TableSortHeader columnKey="position" label={t('employees.position')} currentSort={sortConfig} onSort={handleSort} className="w-[14%] px-4" />
                <TableSortHeader columnKey="commission_percentage" label={t('employees.commission')} currentSort={sortConfig} onSort={handleSort} className="w-[11%] px-4" />
                <TableSortHeader columnKey="base_salary" label={t('employees.base_salary')} currentSort={sortConfig} onSort={handleSort} className="w-[14%] px-4" />
                <th scope="col" className="w-[10%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--workspace-muted)]">{t('employees.status')}</th>
                <TableSortHeader columnKey="hired_at" label={t('employees.hired_at')} currentSort={sortConfig} onSort={handleSort} className="w-[12%] px-4" />
                <th scope="col" className="w-[15%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-[var(--workspace-muted)]">{t('employees.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--workspace-line)]">
              {isError ? <tr><td colSpan={7}><QueryError retry={refetch} /></td></tr>
                : isLoading ? <tr><td colSpan={7} className="py-8"><LoadingSpinner /></td></tr>
                  : paginatedData.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--workspace-muted)]">{t('employees.no_employees')}</td></tr>
                    : paginatedData.map(employee => <tr key={employee.id} className="hover:bg-[var(--workspace-bg)]">
                      <td className="px-4 py-3 align-top">
                        <p className="text-sm font-medium [overflow-wrap:anywhere]">{contact(employee, 'full_name') || t('employees.unknown')}</p>
                        <p className="mt-0.5 text-xs text-[var(--workspace-muted)] [overflow-wrap:anywhere]">{contact(employee, 'email')}</p>
                        {contact(employee, 'phone') && <p className="mt-0.5 text-xs text-[var(--workspace-muted)]">{contact(employee, 'phone')}</p>}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-[var(--workspace-muted)] [overflow-wrap:anywhere]">{employee.position || '-'}</td>
                      <td className="px-4 py-3 align-top text-sm tabular-nums">{employee.commission_percentage == null ? '-' : `${employee.commission_percentage}%`}</td>
                      <td className="px-4 py-3 align-top text-sm tabular-nums">{employee.base_salary == null ? '-' : formatCurrency(employee.base_salary, currency)}</td>
                      <td className="px-4 py-3 align-top"><span className={`inline-flex rounded px-2 py-1 text-xs ${employee.is_active ? 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]' : 'bg-[var(--workspace-bg)] text-[var(--workspace-muted)]'}`}>{t(employee.is_active ? 'employees.active' : 'employees.inactive')}</span></td>
                      <td className="px-4 py-3 align-top text-xs text-[var(--workspace-muted)]">{employee.hired_at ? new Date(employee.hired_at).toLocaleDateString() : '-'}</td>
                      <td className="px-3 py-2 align-top"><div className="flex flex-col items-end gap-1">
                        {canEdit && <Button variant="quiet" className="min-h-8 px-2 py-1 text-xs" onClick={() => { setEditingId(employee.id); setShowForm(true) }}>{t('common.edit')}</Button>}
                        <Button variant="quiet" className="min-h-8 px-2 py-1 text-xs" onClick={() => navigate(`/employees/${employee.id}/salary`)}>{t('employees.salary')}</Button>
                        {canEdit && employee.is_active && <Button variant="quiet" disabled={fireEmployeeMutation.isPending} className="min-h-8 px-2 py-1 text-xs text-red-600 dark:text-red-400"
                          onClick={() => { if (window.confirm(t('employees.confirm_fire').replace('{name}', contact(employee, 'full_name') || t('employees.unknown')))) fireEmployeeMutation.mutate(employee.id) }}>{t('employees.fire')}</Button>}
                      </div></td>
                    </tr>)}
            </tbody>
          </table>
        </div>
        {!isLoading && !isError && totalPages > 1 && <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems}
          perPage={perPage} onPageChange={setCurrentPage} onPerPageChange={setPerPage} />}
      </Card>
      {canEdit && showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <h2 className="text-2xl font-bold mb-4">{editingId ? t('employees.edit_employee') : t('employees.add_employee')}</h2>
            <EmployeeForm employeeId={editingId} onSuccess={() => { setShowForm(false); setEditingId(undefined); queryClient.invalidateQueries({ queryKey: ['employees'] }) }}
              onCancel={() => { setShowForm(false); setEditingId(undefined) }} />
          </div>
        </div>
      )}
    </div>
  )
}
