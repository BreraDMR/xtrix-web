import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'

interface SalaryCalculation {
  id: number
  employee_id: number
  period_start: string
  period_end: string
  total_visits: number
  completed_visits: number
  cancelled_visits: number
  total_revenue: number
  commission_amount: number
  base_salary: number
  total_salary: number
  is_paid: boolean
  paid_at?: string
  calculated_at: string
  notes?: string
}

export default function MySalary() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const currency = useBusinessCurrency()

  const { data: currentSalary, isLoading: isLoadingCurrent } = useQuery<SalaryCalculation>({
    queryKey: ['my-salary-current'],
    queryFn: async () => {
      const { data } = await api.get('/employees/me/salary/current')
      return data
    },
    enabled: user?.role === 'employee',
    retry: false, // Не повторяем, если нет невыплаченной зарплаты
  })

  const { data: salaryHistory, isLoading: isLoadingHistory } = useQuery<SalaryCalculation[]>({
    queryKey: ['my-salary-history'],
    queryFn: async () => {
      const { data } = await api.get('/employees/me/salary/history', {
        params: { limit: 20 },
      })
      return Array.isArray(data) ? data : []
    },
    enabled: user?.role === 'employee',
  })

  if (user?.role !== 'employee') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">{t('salary.access_denied')}</p>
        </div>
      </div>
    )
  }

  const isLoading = isLoadingCurrent || isLoadingHistory

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('salary.my_salary')}</h1>

      {/* Current Unpaid Salary */}
      {currentSalary ? (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t('salary.current_unpaid')}
            </h2>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {t('salary.unpaid')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{t('salary.period')}</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date(currentSalary.period_start).toLocaleDateString()} -{' '}
                {new Date(currentSalary.period_end).toLocaleDateString()}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{t('salary.total_visits')}</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentSalary.completed_visits} / {currentSalary.total_visits}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {t('salary.completed')} / {t('salary.total')}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">{t('salary.total_revenue')}</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(currentSalary.total_revenue, currency)}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <div className="text-sm text-green-600 mb-1">{t('salary.total_salary')}</div>
              <div className="text-2xl font-bold text-green-900">
                {formatCurrency(currentSalary.total_salary, currency)}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {currentSalary.base_salary > 0 && (
                  <>
                    {t('salary.base')}: {currentSalary.base_salary.toFixed(2)} +{' '}
                  </>
                )}
                {t('salary.commission')}: {currentSalary.commission_amount.toFixed(2)}
              </div>
            </div>
          </div>

          {currentSalary.notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 mb-1">{t('salary.notes')}</div>
              <div className="text-sm text-blue-700">{currentSalary.notes}</div>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">
            {t('salary.calculated_at')}:{' '}
            {new Date(currentSalary.calculated_at).toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600">{t('salary.no_unpaid_salary')}</p>
        </div>
      )}

      {/* Salary History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">{t('salary.history')}</h2>
        </div>

        {!salaryHistory || salaryHistory.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t('salary.no_history')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('salary.period')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('salary.visits')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('salary.revenue')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('salary.salary')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('salary.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('salary.paid_at')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryHistory.map((salary) => (
                  <tr key={salary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {new Date(salary.period_start).toLocaleDateString()} -{' '}
                        {new Date(salary.period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {salary.completed_visits} / {salary.total_visits}
                      </div>
                      <div className="text-xs text-gray-500">
                        {salary.cancelled_visits} {t('salary.cancelled')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(salary.total_revenue, currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(salary.total_salary, currency)}
                      <div className="text-xs text-gray-500 font-normal">
                        {salary.base_salary > 0 && (
                          <>
                            {t('salary.base')}: {salary.base_salary.toFixed(2)} +{' '}
                          </>
                        )}
                        {t('salary.commission')}: {salary.commission_amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          salary.is_paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {salary.is_paid ? t('salary.paid') : t('salary.unpaid')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {salary.paid_at
                        ? new Date(salary.paid_at).toLocaleString()
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

