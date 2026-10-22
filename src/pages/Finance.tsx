import { allPages } from '../api/allPages'
import QueryError from '../components/QueryError'
import { useState, useId, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { apiFormErrors } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import FormError from '../components/FormError'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { CURRENCY_SYMBOLS, formatCurrency, type Currency } from '../utils/currency'
import ExportButton from '../components/ExportButton'
import ServicePayments from '../components/payments/ServicePayments'
import { dayEnd, dayNoon, dayStart, today } from '../utils/dates'
import { useLabels } from '../i18n/labels'
import type { Schema } from '../api/types'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

// an expense keeps its own currency; show the symbol like every other amount, the code only if we don't know it
const expenseAmount = (amount: number, code: string) =>
  code in CURRENCY_SYMBOLS ? formatCurrency(amount, code as Currency) : `${amount.toFixed(2)} ${code}`

// system categories and automatic expenses come with codes (category.code, source) we translate
type Expense = Schema<'ExpenseOut'>
type ExpenseCategory = Schema<'ExpenseCategoryOut'>
type NewExpense = Omit<Schema<'ExpenseCreate'>, 'business_id'>
// one row from the profit report's expenses_by_category
type CategoryTotal = { category_id: number; category_name: string; category_code: string | null; color: string | null; total: number }

export default function Finance() {
  const { t } = useTranslation()
  const pageId = useId()
  const labels = useLabels()
  const expenseText = (expense: Expense) => {
    const source = labels.expenseSource(expense.source)
    if (source) return expense.description ? `${source}: ${expense.description}` : source
    return expense.description || '-'
  }
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const currency = useBusinessCurrency()
  
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date()
    return today(new Date(now.getFullYear(), now.getMonth(), 1))
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    const now = new Date()
    return today(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  })
  
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const { data: profitReport, isLoading: isLoadingProfit, isError: queryError0, refetch: retryQuery0 } = useQuery({
    queryKey: ['profit-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get('/expenses/reports/profit', {
        params: {
          date_from: dateFrom ? dayStart(dateFrom) : undefined,
          date_to: dateTo ? dayEnd(dateTo) : undefined,
        },
      })
      return data
    },
  })

  const { data: expenses, isLoading: isLoadingExpenses, isError: queryError1, refetch: retryQuery1 } = useQuery({
    queryKey: ['expenses', dateFrom, dateTo, selectedCategory],
    queryFn: ({ signal }) => allPages<Expense>(async page => {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category_id', selectedCategory.toString())
      if (dateFrom) params.append('date_from', dayStart(dateFrom))
      if (dateTo) params.append('date_to', dayEnd(dateTo))
      params.set('per_page', '100')
      params.set('page', String(page))
      const { data } = await api.get<Schema<'PaginatedResponse_ExpenseOut_'>>(`/expenses/?${params.toString()}`, { signal })
      return data
    }),
  })

  const { data: categories, isError: queryError2, refetch: retryQuery2 } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await api.get('/expenses/categories')
      return data
    },
  })

  const { data: paymentStats, isLoading: isLoadingPayments, isError: queryError3, refetch: retryQuery3 } = useQuery({
    queryKey: ['payment-statistics', dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get('/analytics/payments/statistics', {
        params: {
          date_from: dateFrom ? dayStart(dateFrom) : undefined,
          date_to: dateTo ? dayEnd(dateTo) : undefined,
        },
      })
      return data
    },
  })

  const expenseRows = expenses ?? []

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/expenses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['profit-report'] })
    },
  })

  const retryQueries = () => { void retryQuery0(); void retryQuery1(); void retryQuery2(); void retryQuery3() }

  return (
    <div className="space-y-5">
      <div className="page-toolbar">
        <div className="min-w-0">
          <h1 className="page-title">{t('finance.title')}</h1>
          <p className="page-subtitle">{t('finance.subtitle')}</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'business_owner') && (
          <Button onClick={() => setShowAddExpense(true)} className="shrink-0"><HiOutlinePlus />{t('finance.add_expense')}</Button>
        )}
      </div>

      <Card className="p-4">
        <div className="grid max-w-lg grid-cols-2 gap-3">
          <div className="min-w-0">
            <label htmlFor={`${pageId}-from`} className="mb-1.5 block text-xs font-medium text-[var(--workspace-muted)]">{t('finance.date_from')}</label>
            <Input id={`${pageId}-from`} type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} className="min-w-0 max-w-full" />
          </div>
          <div className="min-w-0">
            <label htmlFor={`${pageId}-to`} className="mb-1.5 block text-xs font-medium text-[var(--workspace-muted)]">{t('finance.date_to')}</label>
            <Input id={`${pageId}-to`} type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} className="min-w-0 max-w-full" />
          </div>
        </div>
      </Card>

      {(queryError0 || queryError1 || queryError2 || queryError3) && <QueryError retry={retryQueries} />}

      {isLoadingProfit ? <LoadingSpinner /> : profitReport ? (
        <Card>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 xl:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-xs text-[var(--workspace-muted)]">{t('finance.revenue')}</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums [overflow-wrap:anywhere] xl:text-2xl">{formatCurrency(profitReport.revenue, currency)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-[var(--workspace-muted)]">{t('finance.expenses')}</dt>
              <dd className="mt-2 text-xl font-semibold tabular-nums [overflow-wrap:anywhere] xl:text-2xl">{formatCurrency(profitReport.expenses, currency)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-[var(--workspace-muted)]">{t('finance.profit')}</dt>
              <dd className={`mt-2 text-xl font-semibold tabular-nums [overflow-wrap:anywhere] xl:text-2xl ${(profitReport.profit || 0) >= 0 ? 'text-[var(--workspace-accent)]' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(profitReport.profit, currency)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-[var(--workspace-muted)]">{t('finance.profit_margin')}</dt>
              <dd className={`mt-2 text-xl font-semibold tabular-nums [overflow-wrap:anywhere] xl:text-2xl ${(profitReport.profit_margin || 0) >= 0 ? 'text-[var(--workspace-accent)]' : 'text-red-600 dark:text-red-400'}`}>{profitReport.profit_margin?.toFixed(2) || '0.00'}%</dd>
            </div>
          </dl>
        </Card>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-2">
        {!isLoadingPayments && paymentStats && (
          <Card id="payment-chart" role="region" aria-labelledby={`${pageId}-payments`} className="min-w-0 p-4 sm:p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 id={`${pageId}-payments`} className="text-sm font-semibold">{t('finance.payments_volume')}</h2>
              <ExportButton
                data={[
                  {
                    'Payment Method': 'Card',
                    'Total': formatCurrency(paymentStats.card_payments?.total || 0, currency),
                    'Count': paymentStats.card_payments?.count || 0,
                    'Percentage': `${Math.round(paymentStats.card_payments?.percentage || 0)}%`,
                  },
                  {
                    'Payment Method': 'Cash',
                    'Total': formatCurrency(paymentStats.cash_payments?.total || 0, currency),
                    'Count': paymentStats.cash_payments?.count || 0,
                    'Percentage': `${Math.round(paymentStats.cash_payments?.percentage || 0)}%`,
                  },
                  {
                    'Payment Method': 'Other',
                    'Total': formatCurrency(paymentStats.other_payments?.total || 0, currency),
                    'Count': paymentStats.other_payments?.count || 0,
                    'Percentage': `${Math.round(paymentStats.other_payments?.percentage || 0)}%`,
                  },
                  {
                    'Payment Method': 'Total',
                    'Total': formatCurrency(paymentStats.total_payments || 0, currency),
                    'Count': paymentStats.total_count || 0,
                    'Percentage': '100%',
                  },
                ]}
                columns={[
                  { key: 'Payment Method', label: 'Payment Method' },
                  { key: 'Total', label: 'Total' },
                  { key: 'Count', label: 'Count' },
                  { key: 'Percentage', label: 'Percentage' },
                ]}
                filename={`payments-statistics-${today()}`}
                title={t('export.payments')}
                reportTypes={[t('export.payments')]}
                includeCharts={true}
                chartSelectors={['#payment-chart']}
              />
            </div>
            <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row">
              <div className="shrink-0">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Card', value: paymentStats.card_payments?.percentage || 0 },
                        { name: 'Cash', value: paymentStats.cash_payments?.percentage || 0 },
                        { name: 'Other', value: paymentStats.other_payments?.percentage || 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#3F6D54" />
                      <Cell fill="#94A78C" />
                      <Cell fill="#D2C8B8" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full min-w-0 flex-1">
                <dl className="space-y-3">
                  {[
                    { label: t('finance.payment_card'), color: '#3F6D54', stats: paymentStats.card_payments },
                    { label: t('finance.payment_cash'), color: '#94A78C', stats: paymentStats.cash_payments },
                    { label: t('finance.payment_other'), color: '#D2C8B8', stats: paymentStats.other_payments },
                  ].map(method => <div key={method.label} className="flex items-start justify-between gap-3">
                    <dt className="flex min-w-0 items-center gap-2 text-xs text-[var(--workspace-muted)]"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: method.color }} />{method.label}</dt>
                    <dd className="text-right tabular-nums">
                      <p className="text-sm font-medium">{formatCurrency(method.stats?.total || 0, currency)}</p>
                      <p className="mt-0.5 text-xs text-[var(--workspace-muted)]">{Math.round(method.stats?.percentage || 0)}% ({method.stats?.count || 0})</p>
                    </dd>
                  </div>)}
                </dl>
                <div className="mt-4 flex items-start justify-between gap-3 border-t border-[var(--workspace-line)] pt-3">
                  <div><p className="text-xs text-[var(--workspace-muted)]">{t('finance.total')}</p><p className="mt-1 text-xs text-[var(--workspace-muted)]">{paymentStats.total_count || 0} {t('finance.completed')}</p></div>
                  <p className="text-lg font-semibold tabular-nums">{formatCurrency(paymentStats.total_payments || 0, currency)}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {profitReport?.expenses_by_category && profitReport.expenses_by_category.length > 0 && (
          <Card className="min-w-0 p-4 sm:p-5" role="region" aria-labelledby={`${pageId}-categories`}>
            <h2 id={`${pageId}-categories`} className="mb-4 text-sm font-semibold">{t('finance.expenses_by_category')}</h2>
            <dl className="divide-y divide-[var(--workspace-line)]">
              {(profitReport.expenses_by_category as CategoryTotal[]).map(item => <div key={item.category_id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <dt className="flex min-w-0 items-center gap-2 text-sm"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color || '#6B7280' }} /><span className="[overflow-wrap:anywhere]">{labels.expenseCategory({ code: item.category_code, name: item.category_name })}</span></dt>
                <dd className="shrink-0 text-sm font-medium tabular-nums">{formatCurrency(item.total, currency)}</dd>
              </div>)}
            </dl>
          </Card>
        )}
      </div>

      <Card className="overflow-hidden" role="region" aria-labelledby={`${pageId}-expenses`}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--workspace-line)] p-4">
          <h2 id={`${pageId}-expenses`} className="text-sm font-semibold">{t('finance.expenses_list')}</h2>
          <div className="ml-auto flex max-w-full flex-wrap items-center gap-2">
            <label htmlFor={`${pageId}-category`} className="text-xs text-[var(--workspace-muted)]">{t('finance.category')}</label>
            <Select id={`${pageId}-category`} value={selectedCategory || ''} onChange={event => setSelectedCategory(event.target.value ? parseInt(event.target.value) : null)} className="w-auto max-w-full">
              <option value="">{t('finance.all_categories')}</option>
              {categories?.map((category: ExpenseCategory) => <option key={category.id} value={category.id}>{labels.expenseCategory(category)}</option>)}
            </Select>
            {expenseRows.length > 0 && !queryError1 && !isLoadingExpenses && (
            <ExportButton
              data={expenseRows}
              columns={[
                { key: 'expense_date', label: t('finance.date'), format: (val) => new Date(val).toLocaleDateString() },
                { key: 'category', label: t('finance.category'), format: (val) => labels.expenseCategory(val) || '-' },
                { key: 'description', label: t('finance.description'), format: (_val, row) => (row ? expenseText(row) : '-') },
                { key: 'amount', label: t('finance.amount'), format: (val, row) => `${val.toFixed(2)} ${row?.currency || ''}` },
                { key: 'payment_method', label: t('finance.payment_method') },
              ]}
              filename={`expenses-${today()}`}
              title={t('export.expensesReport')}
              reportTypes={[t('export.expensesReport')]}
              dataType={(dateFrom || dateTo || selectedCategory) ? 'filtered' : 'all'}
              includeCharts={false}
            />
            )}
          </div>
        </div>
        {queryError1 ? null : isLoadingExpenses ? <div className="p-8 text-center"><LoadingSpinner /></div>
          : expenseRows.length === 0 ? <div className="p-8 text-center text-sm text-[var(--workspace-muted)]">{t('finance.no_expenses')}</div>
            : <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-[var(--workspace-bg)] text-left text-xs font-medium text-[var(--workspace-muted)]">
                  <tr>
                    <th className="px-4 py-3 sm:px-5">{t('finance.description')}</th>
                    <th className="w-28 px-3 py-3 text-right sm:w-36 sm:px-5">{t('finance.amount')}</th>
                    {(user?.role === 'admin' || user?.role === 'business_owner') && <th className="w-12 px-1 py-3 text-right sm:w-20 sm:px-4">{t('finance.actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--workspace-line)]">
                  {expenseRows.map(expense => <tr key={expense.id} className="hover:bg-[var(--workspace-bg)]">
                    <td className="px-4 py-3 sm:px-5">
                      <p className="text-sm font-medium [overflow-wrap:anywhere]">{expenseText(expense)}</p>
                      <dl className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--workspace-muted)]">
                        <div><dt className="sr-only">{t('finance.date')}</dt><dd>{new Date(expense.expense_date).toLocaleDateString()}</dd></div>
                        <div><dt className="sr-only">{t('finance.category')}</dt><dd className="flex items-center gap-1.5 [overflow-wrap:anywhere]">{expense.category ? <><span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: expense.category.color || '#6B7280' }} />{labels.expenseCategory(expense.category)}</> : '-'}</dd></div>
                        <div><dt className="sr-only">{t('finance.payment_method')}</dt><dd>{expense.payment_method}</dd></div>
                      </dl>
                    </td>
                    <td className="px-3 py-3 text-right align-top text-sm font-medium tabular-nums [overflow-wrap:anywhere] sm:px-5">{expenseAmount(expense.amount, expense.currency)}</td>
                    {(user?.role === 'admin' || user?.role === 'business_owner') && <td className="px-1 py-3 text-right align-top sm:px-4">
                      <Button variant="quiet" aria-label={t('common.delete')} title={t('common.delete')} className="min-h-8 px-1.5 py-1 text-red-600 dark:text-red-400"
                        onClick={() => { if (confirm(t('finance.confirm_delete'))) deleteMutation.mutate(expense.id) }}><HiOutlineTrash /></Button>
                    </td>}
                  </tr>)}
                </tbody>
              </table>
            </div>}
      </Card>

      <ServicePayments />

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

// fields the form shows, API errors for these go right under them
const EXPENSE_FIELDS = ['amount', 'expense_date'] as const

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
  const labels = useLabels()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'EUR',
    description: '',
    expense_date: today(),
    payment_method: 'other',
    category_id: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')

  const createMutation = useMutation({
    mutationFn: async ({ businessId, ...expense }: NewExpense & { businessId: number }) => {
      const { data } = await api.post('/expenses/', {
        ...expense,
        business_id: businessId,
      })
      return data
    },
    onSuccess: () => {
      onSuccess()
    },
    onError: (error) => {
      const { fields, general } = apiFormErrors(error, EXPENSE_FIELDS, t('common.error_saving'))
      setErrors(fields)
      setFormError(general)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
    setFormError('')
    // /users/me gives the business, staff get their employer's
    const businessId = user?.business_id
    if (!businessId) {
      setFormError(t('finance.businessRequired'))
      return
    }

    const expenseData = {
      businessId,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description || undefined,
      expense_date: dayNoon(formData.expense_date),
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
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">{t('finance.add_expense')}</h3>
        <form onSubmit={handleSubmit}>
          {formError && <div role="alert" className="mb-4"><FormError message={formError} /></div>}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
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
                <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                  {t('finance.currency')}
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
                >
                  <option value="EUR">EUR</option>
                  <option value="CZK">CZK</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
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
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('finance.category')}
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
              >
                <option value="">{t('finance.no_category')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {labels.expenseCategory(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('finance.payment_method')}
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
              >
                <option value="cash">{t('finance.payment_cash')}</option>
                <option value="card">{t('finance.payment_card')}</option>
                <option value="transfer">{t('finance.payment_transfer')}</option>
                <option value="other">{t('finance.payment_other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('finance.description')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
                rows={3}
                placeholder={t('finance.description_placeholder')}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-700"
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

