import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import SalaryAdjustmentModal from '../components/SalaryAdjustmentModal'
import SalaryPaymentModal from '../components/SalaryPaymentModal'
import EditEmployeeSalaryModal from '../components/EditEmployeeSalaryModal'
import { HiPlus, HiTrash, HiCheckCircle, HiXCircle, HiExclamationCircle, HiPencil } from 'react-icons/hi'

interface SalaryAdjustment {
  id: number
  type: 'bonus' | 'penalty' | 'overtime' | 'allowance' | 'deduction'
  amount: number
  description?: string
  created_at: string
  created_by?: { id: number; full_name: string }
}

interface SalaryPayment {
  id: number
  amount: number
  payment_date: string
  payment_method: 'cash' | 'card' | 'transfer' | 'other'
  status: 'completed' | 'pending' | 'failed'
  notes?: string
  created_at: string
  created_by?: { id: number; full_name: string }
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
  calculated_by_id?: number
  adjustments?: SalaryAdjustment[]
  payments?: SalaryPayment[]
}

export default function EmployeeSalary() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const currency = useBusinessCurrency()

  const employeeId = id ? parseInt(id, 10) : null
  const [activeTab, setActiveTab] = useState<'current' | 'adjustments' | 'payments' | 'history'>('current')
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showEditSalaryModal, setShowEditSalaryModal] = useState(false)
  const [selectedSalaryId, setSelectedSalaryId] = useState<number | null>(null)
  const [showCalculateForm, setShowCalculateForm] = useState(false)
  const [periodStart, setPeriodStart] = useState<string>('')
  const [periodEnd, setPeriodEnd] = useState<string>('')
  const [calculateNotes, setCalculateNotes] = useState<string>('')

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

  // Загружаем детали конкретной зарплаты (для работы с adjustments/payments из истории)
  const { data: selectedSalary, refetch: refetchSelectedSalary } = useQuery<SalaryCalculation>({
    queryKey: ['employee-salary-detail', employeeId, selectedSalaryId],
    queryFn: async () => {
      if (!employeeId || !selectedSalaryId) throw new Error('IDs required')
      const { data } = await api.get(`/employees/${employeeId}/salary/${selectedSalaryId}`)
      return data
    },
    enabled: !!employeeId && !!selectedSalaryId && canManageSalaries,
  })

  // Мутация для расчета зарплаты
  const calculateSalaryMutation = useMutation({
    mutationFn: async (data: { period_start: string; period_end: string; notes?: string }) => {
      const { data: result } = await api.post(
        `/employees/${employeeId}/salary/calculate`,
        {
          period_start: new Date(data.period_start + 'T00:00:00').toISOString(),
          period_end: new Date(data.period_end + 'T23:59:59').toISOString(),
          notes: data.notes || undefined,
        }
      )
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-current', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary-history', employeeId] })
      setShowCalculateForm(false)
      setPeriodStart('')
      setPeriodEnd('')
      setCalculateNotes('')
    },
  })

  const deleteAdjustmentMutation = useMutation({
    mutationFn: async (adjustmentId: number) => {
      await api.delete(`/employees/${employeeId}/salary/${selectedSalaryId || currentSalary?.id}/adjustments/${adjustmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-current', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary-history', employeeId] })
      if (selectedSalaryId) {
        refetchSelectedSalary()
      }
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

  if (isLoadingEmployee || isLoadingCurrent) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
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
    : (selectedSalary ? selectedSalary.total_with_adjustments - selectedSalary.paid_amount : 0)

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('employees.salary')}: {employee?.employee_user?.full_name || 'Employee'}
          </h1>
          {employee?.position && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">{employee.position}</p>
          )}
          {employee && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{t('employees.base_salary')}: {formatCurrency(employee.base_salary || 0, currency)}</span>
              {' | '}
              <span>{t('employees.commission')}: {employee.commission_percentage || 0}%</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {employee && (
            <button
              onClick={() => setShowEditSalaryModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              title={t('employees.edit_salary') || 'Редактировать зарплату'}
            >
              <HiPencil className="w-4 h-4" />
              {t('employees.edit_salary') || 'Редактировать ЗП'}
            </button>
          )}
          <button
            onClick={() => navigate('/employees')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['current', 'adjustments', 'payments', 'history'].map((tab) => {
            const tabKey = `salary.tabs.${tab}` as any;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t(tabKey as any) || tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Current Salary Tab */}
      {activeTab === 'current' && (
        <>
          {currentSalary ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">{t('salary.currentCalculation') || 'Текущий расчет'}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

                {/* Salary Breakdown */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('salary.breakdown') || 'Детализация'}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('salary.base') || 'Базовая ставка'}</span>
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
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('salary.bonuses') || 'Бонусы'}</span>
                          <span className={`font-medium ${currentSalary.adjustments_total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {currentSalary.adjustments_total > 0 ? '+' : ''}
                            {formatCurrency(currentSalary.adjustments_total, currency)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="font-semibold text-gray-900">{t('salary.total') || 'Начислено'}</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(currentSalary.total_with_adjustments, currency)}
                      </span>
                    </div>
                    {currentSalary.paid_amount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('salary.paid') || 'Выплачено'}</span>
                          <span className="font-medium text-red-600">
                            -{formatCurrency(currentSalary.paid_amount, currency)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                          <span className="font-semibold text-gray-900">{t('salary.remaining') || 'Остаток'}</span>
                          <span className="font-bold text-lg text-green-600">
                            {formatCurrency(remainingAmount, currency)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentSalary.payment_status)}`}>
                        {t(`salary.status.${currentSalary.payment_status}`) || currentSalary.payment_status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedSalaryId(currentSalary.id)
                          setShowAdjustmentModal(true)
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                      >
                        <HiPlus className="w-4 h-4" />
                        {t('salary.addAdjustment') || 'Добавить бонус/штраф'}
                      </button>
                      {remainingAmount > 0 && (
                        <button
                          onClick={() => {
                            setSelectedSalaryId(currentSalary.id)
                            setShowPaymentModal(true)
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                          <HiPlus className="w-4 h-4" />
                          {t('salary.recordPayment') || 'Зарегистрировать выплату'}
                        </button>
                      )}
                    </div>
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">{t('salary.noUnpaidSalary') || 'Нет невыплаченной зарплаты'}</p>
                {!showCalculateForm ? (
                  <button
                    onClick={() => setShowCalculateForm(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    {t('salary.calculate_salary') || 'Рассчитать зарплату'}
                  </button>
                ) : (
                  <div className="max-w-md mx-auto mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('salary.periodStart') || 'Начало периода'}
                      </label>
                      <input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('salary.periodEnd') || 'Конец периода'}
                      </label>
                      <input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('salary.notes') || 'Заметки'}
                      </label>
                      <textarea
                        value={calculateNotes}
                        onChange={(e) => setCalculateNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setShowCalculateForm(false)
                          setPeriodStart('')
                          setPeriodEnd('')
                          setCalculateNotes('')
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={() => {
                          if (!periodStart || !periodEnd) {
                            alert(t('salary.fillPeriod') || 'Заполните период')
                            return
                          }
                          calculateSalaryMutation.mutate({
                            period_start: periodStart,
                            period_end: periodEnd,
                            notes: calculateNotes,
                          })
                        }}
                        disabled={calculateSalaryMutation.isPending}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        {calculateSalaryMutation.isPending
                          ? t('common.loading') || 'Расчет...'
                          : t('salary.calculate_salary') || 'Рассчитать'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Adjustments Tab */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('salary.adjustments') || 'Начисления/удержания'}</h2>
            {/* Выбор зарплаты, если нет текущей */}
            {!currentSalary && salaryHistory && salaryHistory.length > 0 && (
              <div className="flex gap-2 items-center">
                <select
                  value={selectedSalaryId || ''}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value, 10) : null
                    setSelectedSalaryId(id)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('salary.selectSalary') || 'Выберите зарплату из истории'}</option>
                  {salaryHistory.map((sal) => (
                    <option key={sal.id} value={sal.id}>
                      {new Date(sal.period_start).toLocaleDateString()} - {new Date(sal.period_end).toLocaleDateString()} 
                      {' '}({formatCurrency(sal.total_with_adjustments, currency)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(currentSalary || selectedSalary) && (
              <button
                onClick={() => {
                  const salaryId = currentSalary?.id || selectedSalary?.id
                  if (salaryId) {
                    setSelectedSalaryId(salaryId)
                    setShowAdjustmentModal(true)
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <HiPlus className="w-4 h-4" />
                {t('salary.addAdjustment') || 'Добавить'}
              </button>
            )}
          </div>

          {(() => {
            const salaryToShow = currentSalary || selectedSalary
            if (!salaryToShow) {
              return (
                <div className="text-center py-8 text-gray-500">
                  {!currentSalary && (!salaryHistory || salaryHistory.length === 0)
                    ? t('salary.noUnpaidSalary') || 'Нет зарплаты. Сначала рассчитайте зарплату на вкладке "Текущая"'
                    : t('salary.selectSalary') || 'Выберите зарплату из истории для просмотра начислений'}
                </div>
              )
            }
            return salaryToShow.adjustments && salaryToShow.adjustments.length > 0 ? (
            <div className="space-y-3">
              {salaryToShow.adjustments!.map((adj) => (
                <div
                  key={adj.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${getAdjustmentTypeColor(adj.type)}`}>
                        {t(`salary.${adj.type}`) || adj.type}
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
                  <button
                    onClick={() => {
                      if (confirm(t('salary.deleteAdjustmentConfirm') || 'Удалить начисление?')) {
                        deleteAdjustmentMutation.mutate(adj.id)
                      }
                    }}
                    className="text-red-600 hover:text-red-800 p-2"
                    disabled={deleteAdjustmentMutation.isPending}
                  >
                    <HiTrash className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('salary.noAdjustments') || 'Нет начислений/удержаний'}
            </div>
          )
          })()}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('salary.payments') || 'Выплаты'}</h2>
            {/* Выбор зарплаты, если нет текущей */}
            {!currentSalary && salaryHistory && salaryHistory.length > 0 && (
              <div className="flex gap-2 items-center">
                <select
                  value={selectedSalaryId || ''}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value, 10) : null
                    setSelectedSalaryId(id)
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('salary.selectSalary') || 'Выберите зарплату из истории'}</option>
                  {salaryHistory.map((sal) => (
                    <option key={sal.id} value={sal.id}>
                      {new Date(sal.period_start).toLocaleDateString()} - {new Date(sal.period_end).toLocaleDateString()} 
                      {' '}({formatCurrency(sal.total_with_adjustments, currency)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(() => {
              const salaryToShow = currentSalary || selectedSalary
              if (!salaryToShow) return null
              const remAmount = salaryToShow.total_with_adjustments - salaryToShow.paid_amount
              if (remAmount > 0) {
                return (
                  <button
                    onClick={() => {
                      setSelectedSalaryId(salaryToShow.id)
                      setShowPaymentModal(true)
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <HiPlus className="w-4 h-4" />
                    {t('salary.recordPayment') || 'Зарегистрировать выплату'}
                  </button>
                )
              }
              return null
            })()}
          </div>

          {(() => {
            const salaryToShow = currentSalary || selectedSalary
            if (!salaryToShow) {
              return (
                <div className="text-center py-8 text-gray-500">
                  {!currentSalary && (!salaryHistory || salaryHistory.length === 0)
                    ? t('salary.noUnpaidSalary') || 'Нет зарплаты. Сначала рассчитайте зарплату на вкладке "Текущая"'
                    : t('salary.selectSalary') || 'Выберите зарплату из истории для просмотра выплат'}
                </div>
              )
            }
            return salaryToShow.payments && salaryToShow.payments.length > 0 ? (
            <div className="space-y-3">
              {salaryToShow.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getPaymentStatusIcon(payment.status)}
                      <span className="font-semibold">{formatCurrency(payment.amount, currency)}</span>
                      <span className="text-sm text-gray-600">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {t(`salary.paymentMethod.${payment.payment_method}`) || payment.payment_method}
                      </span>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {t('salary.status')}: {t(`salary.status.${payment.status}`) || payment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('salary.noPayments') || 'Нет выплат'}
            </div>
          )
          })()}
        </div>
      )}

      {/* History Tab */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.actions')}
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
                          {t(`salary.status.${salary.payment_status}`) || salary.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedSalaryId(salary.id)
                            setActiveTab('current') // Переключаемся на вкладку с деталями
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('common.view' as any) || 'Просмотр'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {t('salary.noHistory') || 'Нет истории зарплат'}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showAdjustmentModal && selectedSalaryId && (
        <SalaryAdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={() => {
            setShowAdjustmentModal(false)
            // Обновляем данные после закрытия
            if (selectedSalaryId && !currentSalary) {
              refetchSelectedSalary()
            }
            if (!currentSalary) {
              setSelectedSalaryId(null)
            }
          }}
          employeeId={employeeId!}
          salaryId={selectedSalaryId}
        />
      )}

      {showPaymentModal && selectedSalaryId && (() => {
        const salaryForPayment = currentSalary || selectedSalary
        const remAmount = salaryForPayment ? salaryForPayment.total_with_adjustments - salaryForPayment.paid_amount : 0
        return (
          <SalaryPaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false)
              // Обновляем данные после закрытия
              if (selectedSalaryId && !currentSalary) {
                refetchSelectedSalary()
              }
              if (!currentSalary) {
                setSelectedSalaryId(null)
              }
            }}
            employeeId={employeeId!}
            salaryId={selectedSalaryId}
            remainingAmount={remAmount}
          />
        )
      })()}

      {showEditSalaryModal && employee && (
        <EditEmployeeSalaryModal
          isOpen={showEditSalaryModal}
          onClose={() => setShowEditSalaryModal(false)}
          employeeId={employee.id}
          currentBaseSalary={employee.base_salary || 0}
          currentCommissionPercentage={employee.commission_percentage || 0}
        />
      )}
    </div>
  )
}
