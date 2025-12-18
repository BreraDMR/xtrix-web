import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'

export default function Dashboard() {
  const { t } = useTranslation()
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      // Проверяем наличие токена перед запросом
      const token = useAuthStore.getState().token || localStorage.getItem('auth_token')
      if (!token) {
        console.error('[Dashboard] No token available for API request')
        throw new Error('Not authenticated')
      }
      
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const { data } = await api.get('/metrics/revenue', {
        params: { start: start.toISOString(), end: now.toISOString() },
      })
      return data
    },
    retry: false, // Не повторяем запрос при ошибке
    enabled: !!useAuthStore.getState().token || !!localStorage.getItem('auth_token'), // Запрос только если есть токен
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard')}</h1>
        <p className="text-gray-600">{t('overview')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">{t('monthlyRevenue')}</h3>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
          {isLoading ? (
            <LoadingSpinner size="md" />
          ) : (
            <p className="text-3xl font-bold text-green-600">
              ${metrics?.revenue?.toFixed(2) || '0.00'}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">{t('thisMonth')}</p>
        </div>
      </div>
    </div>
  )
}

