import QueryError from '../components/QueryError'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import EmployeeForm from '../components/EmployeeForm'
import TableSortHeader from '../components/TableSortHeader'
import TablePagination from '../components/TablePagination'
import ExportButton from '../components/ExportButton'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { sortData, SortConfig } from '../utils/table'
import { today } from '../utils/dates'

interface Employee {
  id: number
  business_owner_id: number
  employee_user_id: number
  position?: string
  permissions?: {
    can_create_visits?: boolean
    can_edit_clients?: boolean
    can_view_financials?: boolean
    can_manage_services?: boolean
    assigned_client_ids?: number[] | null
  }
  commission_percentage?: number
  base_salary?: number
  is_active: boolean
  hired_at?: string
  fired_at?: string
  employee_user?: {
    id: number
    full_name: string
    email: string
    phone?: string
  }
}

export default function Employees() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const currency = useBusinessCurrency()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [sortConfig, setSortConfig] = useState<SortConfig<Employee>>({ key: null, direction: null })
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(20)

  const { data: employees, isLoading, isError, refetch } = useQuery<Employee[]>({
    queryKey: ['employees', activeOnly],
    queryFn: async () => {
      const params: { is_active?: boolean } = {}
      if (activeOnly !== undefined) {
        params.is_active = activeOnly
      }
      const { data } = await api.get('/employees/', { params })
      return Array.isArray(data) ? data : []
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'business_owner'),
  })

  const fireEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      await api.delete(`/employees/${employeeId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const filteredEmployees = useMemo(() => {
    if (!employees) return []

    let filtered = employees.filter((emp) => {
      const employeeName = emp.employee_user?.full_name || ''
      const matchesSearch =
        searchQuery === '' ||
        employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_user?.email?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })
    
    if (sortConfig.key && sortConfig.direction) {
      filtered = sortData(filtered.map(emp => ({
        ...emp,
        employee_name: emp.employee_user?.full_name || '',
        email: emp.employee_user?.email || '',
      })), sortConfig as SortConfig<Employee & { employee_name: string; email: string }>).map((emp) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { employee_name, email, ...rest } = emp
        return rest
      })
    }
    
    return filtered
  }, [employees, searchQuery, sortConfig])

  const { paginatedData, totalPages, totalItems } = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    const endIndex = startIndex + perPage
    return {
      paginatedData: filteredEmployees.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredEmployees.length / perPage),
      totalItems: filteredEmployees.length,
    }
  }, [filteredEmployees, currentPage, perPage])

  const handleSort = (key: keyof Employee | 'employee_name' | 'email') => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') {
          return { key: key as keyof Employee, direction: 'desc' }
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null }
        }
      }
      return { key: key as keyof Employee, direction: 'asc' }
    })
    setCurrentPage(1)
  }

  const canManageEmployees = user?.role === 'admin' || user?.role === 'business_owner'

  if (!canManageEmployees) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{t('employees.access_denied')}</p>
        </div>
      </div>
    )
  }

  if (isError) return <QueryError retry={refetch} />

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-0 sm:p-6 animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900">{t('employees.title')}</h1>
        <button
          onClick={() => {
            setEditingId(undefined)
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          {t('employees.add_employee')}
        </button>
      </div>

      {}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:max-w-md">
          <input
            type="text"
            placeholder={t('employees.search_placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked)
                setCurrentPage(1)
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">{t('employees.active_only')}</span>
          </label>
          {filteredEmployees.length > 0 && (
            <ExportButton
              data={filteredEmployees}
              columns={[
                { key: 'employee_user', label: t('employees.employee'), format: (val) => val?.full_name || t('employees.unknown') },
                { key: 'employee_user', label: 'Email', format: (val) => val?.email || '-' },
                { key: 'position', label: t('employees.position') },
                { key: 'commission_percentage', label: t('employees.commission'), format: (val) => val ? `${val}%` : '-' },
                { key: 'base_salary', label: t('employees.base_salary'), format: (val) => val ? formatCurrency(val, currency) : '-' },
                { key: 'is_active', label: t('employees.status'), format: (val) => val ? t('employees.active') : t('employees.inactive') },
                { key: 'hired_at', label: t('employees.hired_at'), format: (val) => val ? new Date(val).toLocaleDateString() : '-' },
              ]}
              filename={`employees-${today()}`}
              title={t('export.employeesReport')}
              reportTypes={[t('export.employeesReport')]}
              dataType={searchQuery ? 'filtered' : 'all'}
            />
          )}
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table role="table" className="responsive-card-table min-w-full divide-y divide-gray-200">
            <thead role="rowgroup" className="bg-gray-50">
              <tr role="row">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.employee')}
                </th>
                <TableSortHeader
                  columnKey="position"
                  label={t('employees.position')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <TableSortHeader
                  columnKey="commission_percentage"
                  label={t('employees.commission')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <TableSortHeader
                  columnKey="base_salary"
                  label={t('employees.base_salary')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.status')}
                </th>
                <TableSortHeader
                  columnKey="hired_at"
                  label={t('employees.hired_at')}
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('employees.actions')}
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup" className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr role="row">
                  <td role="cell" colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {t('employees.no_employees')}
                  </td>
                </tr>
              ) : (
                paginatedData.map((employee) => (
                <tr role="row" key={employee.id} className="hover:bg-gray-50">
                  <td role="cell" data-label={t('employees.employee')} className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.employee_user?.full_name || t('employees.unknown')}
                      </div>
                      <div className="text-sm text-gray-500">{employee.employee_user?.email}</div>
                      {employee.employee_user?.phone && (
                        <div className="text-sm text-gray-500">{employee.employee_user.phone}</div>
                      )}
                    </div>
                  </td>
                  <td role="cell" data-label={t('employees.position')} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.position || '-'}
                  </td>
                  <td role="cell" data-label={t('employees.commission')} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.commission_percentage !== undefined
                      ? `${employee.commission_percentage}%`
                      : '-'}
                  </td>
                  <td role="cell" data-label={t('employees.base_salary')} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.base_salary !== undefined
                      ? formatCurrency(employee.base_salary, currency)
                      : '-'}
                  </td>
                  <td role="cell" data-label={t('employees.status')} className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {employee.is_active ? t('employees.active') : t('employees.inactive')}
                    </span>
                  </td>
                  <td role="cell" data-label={t('employees.hired_at')} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.hired_at
                      ? new Date(employee.hired_at).toLocaleDateString()
                      : '-'}
                  </td>
                  <td role="cell" data-label={t('employees.actions')} className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex flex-wrap md:justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingId(employee.id)
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('common.edit')}
                      </button>
                      {employee.is_active && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                t('employees.confirm_fire').replace('{name}', employee.employee_user?.full_name || 'Employee')
                              )
                            ) {
                              fireEmployeeMutation.mutate(employee.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t('employees.fire')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          navigate(`/employees/${employee.id}/salary`)
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        {t('employees.salary')}
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

      {}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? t('employees.edit_employee') : t('employees.add_employee')}
            </h2>
            <EmployeeForm
              employeeId={editingId}
              onSuccess={() => {
                setShowForm(false)
                setEditingId(undefined)
                queryClient.invalidateQueries({ queryKey: ['employees'] })
              }}
              onCancel={() => {
                setShowForm(false)
                setEditingId(undefined)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

