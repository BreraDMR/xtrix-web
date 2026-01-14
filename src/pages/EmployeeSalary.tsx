import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'

interface SalaryCalculation {
  id: number
  employee_id: number
  period_start: string
  period_end: string
  total_visits: number
  completed_visits: number
  cancelled_visits: number
  total_revenue: number
  commission_percentage: number
  commission_amount: number
  base_salary: number
  total_salary: number
  is_paid: boolean
  paid_at: string | null
  notes: string | null
  calculated_at: string
  calculated_by_user?: {
    id: number
    full_name: string
  }
}

export default function EmployeeSalary() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const currency = useBusinessCurrency()

  const employeeId = id ? parseInt(id, 10) : null

  const canManageSalaries = user?.role === 'admin' || user?.role === 'business_owner'

  // Загружаем информацию о сотруднике
  const { data: employee, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID is required')
      const { data } = await api.get(`/employees/${employeeId}`)
      return data
    },
    enabled: !!employeeId && canManageSalaries,
  })

  // Загружаем текущую невыплаченную зарплату
  const { data: currentSalary, isLoading: isLoadingCurrent } = useQuery<SalaryCalculation>({
    queryKey: ['employee-salary-current', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID is required')
      const { data } = await api.get(`/employees/${employeeId}/salary/current`)
      return data
    },
    enabled: !!employeeId && canManageSalaries,
    retry: false,
  })

  // Загружаем историю зарплат
  const { data: salaryHistory, isLoading: isLoadingHistory } = useQuery<SalaryCalculation[]>({
    queryKey: ['employee-salary-history', employeeId],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID is required')
      const { data } = await api.get(`/employees/${employeeId}/salary/history`, {
        params: { limit: 20 },
      })
      return Array.isArray(data) ? data : []
    },
    enabled: !!employeeId && canManageSalaries,
  })

  const markPaidMutation = useMutation({
    mutationFn: async (salaryId: number) => {
      await api.patch(`/employees/${employeeId}/salary/${salaryId}`, {
        is_paid: true,
        paid_at: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-current', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary-history', employeeId] })
    },
  })

  if (!canManageSalaries) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{t('salary.access_denied')}</p>
        </div>
      </div>
    )
  }

  if (!employeeId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Invalid employee ID</p>
        </div>
      </div>
    )
  }

  const isLoading = isLoadingEmployee || isLoadingCurrent || isLoadingHistory

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('employees.salary')}: {employee?.employee_user?.full_name || 'Employee'}
          </h1>
          {employee?.position && (
            <p className="text-gray-600 mt-1">{employee.position}</p>
          )}
        </div>
        <button
          onClick={() => navigate('/employees')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          {t('common.cancel')}
        </button>
      </div>

      {/* Current Unpaid Salary */}
      {currentSalary && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('salary.current_unpaid')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">{t('salary.period')}</p>
              <p className="text-lg font-medium">
                {new Date(currentSalary.period_start).toLocaleDateString()} -{' '}
                {new Date(currentSalary.period_end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('salary.total_visits')}</p>
              <p className="text-lg font-medium">{currentSalary.total_visits}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('salary.completed')}</p>
              <p className="text-lg font-medium">{currentSalary.completed_visits}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('salary.total_revenue')}</p>
              <p className="text-lg font-medium">
                {formatCurrency(currentSalary.total_revenue, currency)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-600">{t('salary.base')}</p>
              <p className="text-lg font-medium">
                {formatCurrency(currentSalary.base_salary, currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('salary.commission')} ({currentSalary.commission_percentage}%)</p>
              <p className="text-lg font-medium">
                {formatCurrency(currentSalary.commission_amount, currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-semibold">{t('salary.total_salary')}</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(currentSalary.total_salary, currency)}
              </p>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  if (window.confirm(t('salary.mark_paid_confirm'))) {
                    markPaidMutation.mutate(currentSalary.id)
                  }
                }}
                disabled={markPaidMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {t('salary.mark_paid')}
              </button>
            </div>
          </div>
          {currentSalary.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">{t('salary.notes')}</p>
              <p className="text-gray-800">{currentSalary.notes}</p>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            {t('salary.calculated_at')}: {new Date(currentSalary.calculated_at).toLocaleString()}
          </div>
        </div>
      )}

      {!currentSalary && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-gray-600">{t('salary.no_unpaid_salary')}</p>
        </div>
      )}

      {/* Salary History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{t('salary.history')}</h2>
        {salaryHistory && salaryHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('salary.period')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('salary.visits')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('salary.revenue')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('salary.salary')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('salary.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('salary.paid_at')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryHistory.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(salary.period_start).toLocaleDateString()} -{' '}
                      {new Date(salary.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {salary.completed_visits} / {salary.total_visits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(salary.total_revenue, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatCurrency(salary.total_salary, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {salary.is_paid ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {t('salary.paid')}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          {t('salary.unpaid')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {salary.paid_at ? new Date(salary.paid_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">{t('salary.no_history')}</p>
        )}
      </div>
    </div>
  )
}

