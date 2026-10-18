import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { HiCheckCircle, HiExclamationCircle, HiXCircle } from 'react-icons/hi'
import ExportButton from '../components/ExportButton'

interface SalaryAdjustment {
  id: number
  type: 'bonus' | 'penalty' | 'overtime' | 'allowance' | 'deduction'
  amount: number
  description?: string
  created_at: string
}

interface SalaryPayment {
  id: number
  amount: number
  payment_date: string
  payment_method: 'cash' | 'card' | 'transfer' | 'other'
  status: 'completed' | 'pending' | 'failed'
  notes?: string
  created_at: string
}

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
  adjustments_total: number
  total_with_adjustments: number
  paid_amount: number
  payment_status: 'unpaid' | 'partial' | 'paid'
  is_paid: boolean
  paid_at: string | null
  notes: string | null
  calculated_at: string
  adjustments?: SalaryAdjustment[]
  payments?: SalaryPayment[]
}

export default function MySalary() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const currency = useBusinessCurrency()
  const [activeTab, setActiveTab] = useState<'current' | 'details' | 'history' | 'export'>('current')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('')

  const { data: currentSalary, isLoading: isLoadingCurrent } = useQuery<SalaryCalculation>({
    queryKey: ['my-salary-current'],
    queryFn: async () => {
      const { data } = await api.get('/employees/me/salary/current')
      return data
    },
    enabled: user?.role === 'employee' || user?.role === 'specialist',
    retry: false,
  })

  const { data: salaryHistory, isLoading: isLoadingHistory } = useQuery<SalaryCalculation[]>({
    queryKey: ['my-salary-history'],
    queryFn: async () => {
      const { data } = await api.get('/employees/me/salary/history', {
        params: { limit: 50 },
      })
      return Array.isArray(data) ? data : []
    },
    enabled: user?.role === 'employee' || user?.role === 'specialist',
  })

  if (user?.role !== 'employee' && user?.role !== 'specialist') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-200">{t('salary.access_denied')}</p>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'unpaid':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'bonus':
        return 'text-green-600'
      case 'penalty':
        return 'text-red-600'
      case 'overtime':
        return 'text-blue-600'
      case 'allowance':
        return 'text-purple-600'
      case 'deduction':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <HiCheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <HiExclamationCircle className="w-5 h-5 text-yellow-600" />
      case 'failed':
        return <HiXCircle className="w-5 h-5 text-red-600" />
      default:
        return null
    }
  }

  const remainingAmount = currentSalary
    ? currentSalary.total_with_adjustments - currentSalary.paid_amount
    : 0

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('salary.my_salary')}
          </h1>
        <p className="text-gray-600 mt-1">
          {t('salary.viewSalaryDetails')}
        </p>
      </div>

      {}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['current', 'details', 'history', 'export'] as const).map((tab) => {
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t(`salary.tabs.${tab}`)}
              </button>
            );
          })}
        </nav>
      </div>

      {}
      {activeTab === 'current' && (
        <>
          {currentSalary ? (
            <div className="space-y-6">
              {}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">{t('salary.currentSalary')}</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">{t('salary.period')}</p>
                    <p className="text-lg font-medium">
                      {new Date(currentSalary.period_start).toLocaleDateString()} -{' '}
                      {new Date(currentSalary.period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('salary.totalVisits')}</p>
                    <p className="text-lg font-medium">{currentSalary.total_visits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('salary.completed')}</p>
                    <p className="text-lg font-medium">{currentSalary.completed_visits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('salary.totalRevenue')}</p>
                    <p className="text-lg font-medium">
                      {formatCurrency(currentSalary.total_revenue, currency)}
                    </p>
                  </div>
                </div>

                {}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('salary.breakdown')}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('salary.base')}</span>
                      <span className="font-medium">{formatCurrency(currentSalary.base_salary, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {t('salary.commission')} ({currentSalary.commission_percentage}%)
                      </span>
                      <span className="font-medium">
                        {formatCurrency(currentSalary.commission_amount, currency)}
                      </span>
                    </div>
                    {currentSalary.adjustments_total !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('salary.adjustments')}</span>
                        <span className={`font-medium ${currentSalary.adjustments_total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {currentSalary.adjustments_total > 0 ? '+' : ''}
                          {formatCurrency(currentSalary.adjustments_total, currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="font-semibold text-gray-900">{t('salary.total')}</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(currentSalary.total_with_adjustments, currency)}
                      </span>
                    </div>
                    {currentSalary.paid_amount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('salary.paid')}</span>
                          <span className="font-medium text-red-600">
                            -{formatCurrency(currentSalary.paid_amount, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                          <span className="font-semibold text-gray-900">{t('salary.remaining')}</span>
                          <span className="font-bold text-lg text-green-600">
                            {formatCurrency(remainingAmount, currency)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSalary.payment_status)}`}>
                      {t(`salary.status.${currentSalary.payment_status}`)}
                    </span>
                  </div>
                  {currentSalary.notes && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">{t('salary.notes')}</p>
                      <p className="text-gray-800">{currentSalary.notes}</p>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {t('salary.calculatedAt')}: {new Date(currentSalary.calculated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600">{t('salary.noUnpaidSalary')}</p>
            </div>
          )}
        </>
      )}

      {}
      {activeTab === 'details' && currentSalary && (
        <div className="space-y-6">
          {}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t('salary.adjustments')}</h2>
            {currentSalary.adjustments && currentSalary.adjustments.length > 0 ? (
              <div className="space-y-3">
                {currentSalary.adjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`font-medium ${getAdjustmentTypeColor(adj.type)}`}>
                          {t(`salary.${adj.type}`)}
                        </span>
                        <span className={`font-semibold ${adj.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {adj.amount >= 0 ? '+' : ''}
                          {formatCurrency(adj.amount, currency)}
                        </span>
                      </div>
                      {adj.description && (
                        <p className="text-sm text-gray-600 mt-1">{adj.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(adj.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('salary.noAdjustments')}
              </div>
            )}
          </div>

          {}
          <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white">{t('salary.payments')}</h2>
              <div className="flex gap-2">
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">{t('salary.allMethods')}</option>
                  <option value="cash">{t('salary.paymentMethod.cash')}</option>
                  <option value="card">{t('salary.paymentMethod.card')}</option>
                  <option value="transfer">{t('salary.paymentMethod.transfer')}</option>
                  <option value="other">{t('salary.paymentMethod.other')}</option>
                </select>
              </div>
            </div>
            {currentSalary.payments && currentSalary.payments.length > 0 ? (
              <div className="space-y-3">
                {currentSalary.payments
                  .filter((p) => !paymentMethodFilter || p.payment_method === paymentMethodFilter)
                  .map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        {getPaymentStatusIcon(payment.status)}
                        <span className="font-semibold text-lg dark:text-white">
                          {formatCurrency(payment.amount, currency)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(payment.payment_date).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.payment_method === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          payment.payment_method === 'card' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          payment.payment_method === 'transfer' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {t(`salary.paymentMethod.${payment.payment_method}`)}
                        </span>
                      </div>
                      {payment.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{payment.notes}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('salary.status')}:
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {t(`salary.status.${payment.status}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('salary.noPayments')}
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoadingHistory ? (
            <div className="p-8 text-center">
              <LoadingSpinner />
            </div>
          ) : salaryHistory && salaryHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('salary.period')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('salary.total')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('salary.paid')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('salary.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaryHistory.map((salary) => (
                    <tr key={salary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(salary.period_start).toLocaleDateString()} -{' '}
                        {new Date(salary.period_end).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(salary.total_with_adjustments, currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(salary.paid_amount, currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(salary.payment_status)}`}
                        >
                          {t(`salary.status.${salary.payment_status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {t('salary.noHistory')}
            </div>
          )}
        </div>
      )}

      {}
      {activeTab === 'export' && currentSalary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">{t('salary.export')}</h2>
          <p className="text-gray-600 mb-4">
            {t('salary.exportDescription')}
          </p>
          <div className="flex gap-3">
            <ExportButton
              data={[
                { item: t('salary.period'), value: `${new Date(currentSalary.period_start).toLocaleDateString()} - ${new Date(currentSalary.period_end).toLocaleDateString()}` },
                { item: t('salary.totalVisits'), value: String(currentSalary.total_visits) },
                { item: t('salary.completed'), value: String(currentSalary.completed_visits) },
                { item: t('salary.totalRevenue'), value: formatCurrency(currentSalary.total_revenue, currency) },
                { item: t('salary.base'), value: formatCurrency(currentSalary.base_salary, currency) },
                { item: `${t('salary.commission')} (${currentSalary.commission_percentage}%)`, value: formatCurrency(currentSalary.commission_amount, currency) },
                { item: t('salary.adjustments'), value: formatCurrency(currentSalary.adjustments_total, currency) },
                { item: t('salary.total'), value: formatCurrency(currentSalary.total_with_adjustments, currency) },
                { item: t('salary.paid'), value: formatCurrency(currentSalary.paid_amount, currency) },
                { item: t('salary.remaining'), value: formatCurrency(remainingAmount, currency) },
              ]}
              columns={[
                { key: 'item', label: t('common.item') },
                { key: 'value', label: t('common.value') },
              ]}
              filename={`my-salary-${currentSalary.period_start.slice(0, 10)}`}
              title={t('salary.currentSalary')}
            />
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              {t('common.print')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
