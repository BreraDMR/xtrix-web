import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

export default function Dashboard() {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  
  // Получаем прибыль за текущий месяц (доходы - расходы)
  const { data: profitData, isLoading: isLoadingProfit } = useQuery({
    queryKey: ['profit-current-month'],
    queryFn: async () => {
      const token = useAuthStore.getState().token || localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Not authenticated')
      }
      
      // Endpoint автоматически использует текущий месяц
      const { data } = await api.get('/expenses/reports/profit')
      return data
    },
    retry: false,
    enabled: !!useAuthStore.getState().token || !!localStorage.getItem('auth_token'),
  })

  // Получаем статистику визитов
  const { data: visitStats, isLoading: isLoadingVisitStats } = useQuery({
    queryKey: ['visits-statistics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/visits/statistics')
      return data
    },
    retry: false,
    enabled: !!useAuthStore.getState().token || !!localStorage.getItem('auth_token'),
  })

  // Получаем статистику клиентов
  const { data: clientStats, isLoading: isLoadingClientStats } = useQuery({
    queryKey: ['clients-statistics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/clients/statistics')
      return data
    },
    retry: false,
    enabled: !!useAuthStore.getState().token || !!localStorage.getItem('auth_token'),
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
        <p className="text-gray-600">{t('dashboard.subtitle')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Прибыль */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{t('dashboard.monthlyProfit')}</h3>
          </div>
          {isLoadingProfit ? (
            <LoadingSpinner size="md" />
          ) : (
            <p className={`text-3xl font-bold ${(profitData?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profitData?.profit, currency)}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">{t('dashboard.thisMonth')}</p>
        </div>

        {/* Доходы */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{t('dashboard.monthlyRevenue')}</h3>
          </div>
          {isLoadingProfit ? (
            <LoadingSpinner size="md" />
          ) : (
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(profitData?.revenue, currency)}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">{t('dashboard.thisMonth')}</p>
        </div>

        {/* Расходы */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{t('dashboard.monthlyExpenses')}</h3>
          </div>
          {isLoadingProfit ? (
            <LoadingSpinner size="md" />
          ) : (
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(profitData?.expenses, currency)}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">{t('dashboard.thisMonth')}</p>
        </div>
      </div>

      {/* Widgets - Reservations and Quick Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Reservations Widget */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('dashboard.reservations')}</h3>
          {isLoadingVisitStats ? (
            <LoadingSpinner size="md" />
          ) : visitStats ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">{t('dashboard.totalVisits')}</span>
                <span className="text-2xl font-bold text-gray-900">{visitStats.total_visits || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('dashboard.completedVisits')}</span>
                <span className="text-xl font-semibold text-green-600">{visitStats.visits_by_status?.completed || 0}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick Status Widget */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('dashboard.quickStatus')}</h3>
          {isLoadingClientStats ? (
            <LoadingSpinner size="md" />
          ) : clientStats ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">{t('dashboard.totalClients')}</span>
                <span className="text-2xl font-bold text-gray-900">{clientStats.total_clients || 0}</span>
              </div>
              {clientStats.average_spending !== null && clientStats.average_spending !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('dashboard.averageSpending')}</span>
                  <span className="text-xl font-semibold text-purple-600">{formatCurrency(clientStats.average_spending, currency)}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Charts */}
      {profitData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Donut Chart - Revenue vs Expenses */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('dashboard.monthlyRevenue')} vs {t('dashboard.monthlyExpenses')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: t('dashboard.monthlyRevenue'), value: profitData.revenue || 0 },
                    { name: t('dashboard.monthlyExpenses'), value: profitData.expenses || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0, currency)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Profit Margin Bar */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('dashboard.profitMargin')}</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{t('dashboard.margin')}</span>
                  <span className="font-semibold">{profitData.profit_margin?.toFixed(2) || '0.00'}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${profitData.profit_margin >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(profitData.profit_margin || 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

