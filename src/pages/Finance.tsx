import { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'

interface Expense {
  id: number
  amount: number
  currency: string
  description?: string
  expense_date: string
  payment_method: string
  category?: {
    id: number
    name: string
    color?: string
  }
}

interface ExpenseCategory {
  id: number
  name: string
  type: string
  color?: string
  is_system: boolean
}

export default function Finance() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const currency = useBusinessCurrency()
  
  // Фильтры периода
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  })
  
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  // Получаем отчет о прибыли
  const { data: profitReport, isLoading: isLoadingProfit } = useQuery({
    queryKey: ['profit-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get('/expenses/reports/profit', {
        params: {
          date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
          date_to: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
        },
      })
      return data
    },
  })

  // Получаем список расходов
  const { data: expensesResponse, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses', dateFrom, dateTo, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category_id', selectedCategory.toString())
      if (dateFrom) params.append('date_from', new Date(dateFrom).toISOString())
      if (dateTo) params.append('date_to', new Date(dateTo + 'T23:59:59').toISOString())
      params.append('per_page', '100')
      const { data } = await api.get(`/expenses?${params.toString()}`)
      return data
    },
  })

  // Получаем категории
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await api.get('/expenses/categories')
      return data
    },
  })

  // Получаем статистику платежей
  const { data: paymentStats, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payment-statistics', dateFrom, dateTo],
    queryFn: async () => {
      try {
        const { data } = await api.get('/analytics/payments/statistics', {
          params: {
            date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
            date_to: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
          },
        })
        return data
      } catch (error: any) {
        return {
          total_payments: 0,
          total_count: 0,
          gateway_payments: { total: 0, count: 0, percentage: 0 },
          terminal_payments: { total: 0, count: 0, percentage: 0 },
          physical_card: { total: 0, count: 0, percentage: 0 },
          virtual_card: { total: 0, count: 0, percentage: 0 },
          cash_payments: { total: 0, count: 0, percentage: 0 },
        }
      }
    },
  })

  const expenses: Expense[] = expensesResponse?.items || []

  // Удаление расхода
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/expenses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['profit-report'] })
    },
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('finance.title')}</h1>
          <p className="text-gray-600">{t('finance.subtitle')}</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'business_owner') && (
          <button
            onClick={() => setShowAddExpense(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            {t('finance.add_expense')}
          </button>
        )}
      </div>

      {/* Фильтры периода */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.date_from')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.date_to')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('finance.category')}</label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">{t('finance.all_categories')}</option>
              {categories?.map((cat: ExpenseCategory) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Виджеты платежей */}
      {!isLoadingPayments && paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Payments volume */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('finance.payments_volume')}</h3>
              <button className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
                ×
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Gateway', value: paymentStats.gateway_payments?.percentage || 0 },
                        { name: 'Terminal', value: Math.max(0, 100 - (paymentStats.gateway_payments?.percentage || 0)) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={50}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#EC4899" />
                      <Cell fill="#F3F4F6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(paymentStats.gateway_payments?.percentage || 0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {paymentStats.gateway_payments?.count || 0}/{paymentStats.total_count || 0} {t('finance.completed')}
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-500 rounded"></div>
                  <span className="text-sm text-gray-700">{t('finance.gateway_payments')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded"></div>
                  <span className="text-sm text-gray-700">{t('finance.terminal_payments')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gateway payments volume */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('finance.gateway_payments_volume')}</h3>
              <button className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
                ×
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Physical', value: paymentStats.physical_card?.percentage || 0 },
                        { name: 'Virtual', value: Math.max(0, 100 - (paymentStats.physical_card?.percentage || 0)) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={50}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#EC4899" />
                      <Cell fill="#F3F4F6" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(paymentStats.physical_card?.percentage || 0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {paymentStats.physical_card?.count || 0}/{paymentStats.total_count || 0} {t('finance.completed')}
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-500 rounded"></div>
                  <span className="text-sm text-gray-700">{t('finance.physical_card_payments')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded"></div>
                  <span className="text-sm text-gray-700">{t('finance.virtual_card_payments')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Статистика */}
      {isLoadingProfit ? (
        <LoadingSpinner />
      ) : profitReport ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('finance.revenue')}</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(profitReport.revenue, currency)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('finance.expenses')}</h3>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(profitReport.expenses, currency)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('finance.profit')}</h3>
            <p className={`text-3xl font-bold ${(profitReport.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profitReport.profit, currency)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('finance.profit_margin')}</h3>
            <p className={`text-3xl font-bold ${(profitReport.profit_margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitReport.profit_margin?.toFixed(2) || '0.00'}%
            </p>
          </div>
        </div>
      ) : null}

      {/* Расходы по категориям */}
      {profitReport?.expenses_by_category && profitReport.expenses_by_category.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('finance.expenses_by_category')}</h2>
          <div className="space-y-3">
            {profitReport.expenses_by_category.map((item: any) => (
              <div key={item.category_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color || '#6B7280' }}
                  />
                  <span className="font-medium">{item.category_name}</span>
                </div>
                <span className="font-bold text-red-600">{formatCurrency(item.total, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список расходов */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{t('finance.expenses_list')}</h2>
        </div>
        {isLoadingExpenses ? (
          <div className="p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('finance.no_expenses')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.category')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.description')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.amount')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.payment_method')}</th>
                  {(user?.role === 'admin' || user?.role === 'business_owner') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('finance.actions')}</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {expense.category ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: expense.category.color || '#6B7280' }}
                          />
                          <span className="text-sm text-gray-900">{expense.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {expense.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {expense.amount.toFixed(2)} {expense.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.payment_method}
                    </td>
                    {(user?.role === 'admin' || user?.role === 'business_owner') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            if (confirm(t('finance.confirm_delete'))) {
                              deleteMutation.mutate(expense.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Форма добавления расхода */}
      {showAddExpense && (
        <ExpenseForm
          categories={categories || []}
          onCancel={() => setShowAddExpense(false)}
          onSuccess={() => {
            setShowAddExpense(false)
            queryClient.invalidateQueries({ queryKey: ['expenses'] })
            queryClient.invalidateQueries({ queryKey: ['profit-report'] })
          }}
        />
      )}
    </div>
  )
}

// Компонент формы добавления расхода
function ExpenseForm({
  categories,
  onCancel,
  onSuccess,
}: {
  categories: ExpenseCategory[]
  onCancel: () => void
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'EUR',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'other',
    category_id: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Получаем бизнес пользователя
  const { data: userBusiness } = useQuery({
    queryKey: ['user-business'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/businesses/me')
        return data
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: !!user,
    retry: false,
  })

  // Создание расхода
  const createMutation = useMutation({
    mutationFn: async (expense: any) => {
      let businessId = user?.business_id
      if (!businessId && userBusiness?.id) {
        businessId = userBusiness.id
      }
      if (!businessId) {
        throw new Error('Business ID not found')
      }

      const { data } = await api.post('/expenses', {
        ...expense,
        business_id: businessId,
      })
      return data
    },
    onSuccess: () => {
      onSuccess()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to create expense'
      alert(errorMessage)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Валидация
    const newErrors: Record<string, string> = {}
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t('finance.amount_required')
    }
    if (!formData.expense_date) {
      newErrors.expense_date = t('finance.date_required')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})

    const expenseData = {
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description || undefined,
      expense_date: new Date(formData.expense_date + 'T12:00:00').toISOString(),
      payment_method: formData.payment_method,
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
    }

    createMutation.mutate(expenseData)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">{t('finance.add_expense')}</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finance.amount')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('finance.currency')}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="EUR">EUR</option>
                  <option value="CZK">CZK</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('finance.date')} *
              </label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg ${
                  errors.expense_date ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.expense_date && (
                <p className="text-red-500 text-xs mt-1">{errors.expense_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('finance.category')}
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">{t('finance.no_category')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('finance.payment_method')}
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="cash">{t('finance.payment_cash')}</option>
                <option value="card">{t('finance.payment_card')}</option>
                <option value="transfer">{t('finance.payment_transfer')}</option>
                <option value="other">{t('finance.payment_other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('finance.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder={t('finance.description_placeholder')}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

