import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'

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

      {/* Рентабельность */}
      {profitData && (
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
      )}
    </div>
  )
}

