import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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

      {/* Статистика */}
      {isLoadingProfit ? (
        <LoadingSpinner />
      ) : profitReport ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('finance.revenue')}</h3>
            <p className="text-3xl font-bold text-green-600">{profitReport.revenue?.toFixed(2) || '0.00'} €</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('finance.expenses')}</h3>
            <p className="text-3xl font-bold text-red-600">{profitReport.expenses?.toFixed(2) || '0.00'} €</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('finance.profit')}</h3>
            <p className={`text-3xl font-bold ${(profitReport.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitReport.profit?.toFixed(2) || '0.00'} €
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
                <span className="font-bold text-red-600">{item.total.toFixed(2)} €</span>
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

      {/* Форма добавления расхода - TODO: реализовать позже */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t('finance.add_expense')}</h3>
            <p className="text-gray-600 mb-4">{t('finance.form_coming_soon')}</p>
            <button
              onClick={() => setShowAddExpense(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

