import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

interface Subscription {
  id: number
  user_id: number
  plan_id: number
  status: string
  is_trial: boolean
  trial_start: string | null
  trial_end: string | null
  current_period_end: string | null
  created_at: string
}

interface SubscriptionPlan {
  id: number
  code: string
  name: string
  period_days: number
  price: number
  currency: string
  is_trial: boolean
  trial_days: number | null
  is_active?: boolean
}

interface TrialStatus {
  is_trial_active: boolean
  is_trial: boolean
  trial_start: string | null
  trial_end: string | null
  has_access: boolean
}

export default function Subscription() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Получаем текущую подписку
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/me')
      return data
    },
    enabled: user?.role === 'admin' || user?.role === 'specialist',
  })

  // Получаем статус trial
  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ['trial-status'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/trial/status')
      return data
    },
  })

  // Получаем список планов
  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/plans?active_only=true')
      // Фильтруем trial планы из списка (они создаются автоматически)
      return data.filter((plan: SubscriptionPlan) => !plan.is_trial)
    },
  })

  // Фильтруем планы в зависимости от роли
  // Если планов нет или фильтрация не дает результатов, показываем все планы (кроме trial)
  const availablePlans = React.useMemo<SubscriptionPlan[]>(() => {
    if (!plans || plans.length === 0) return []
    
    // Сначала фильтруем trial планы
    const nonTrialPlans = plans.filter((plan) => !plan.is_trial)
    
    if (nonTrialPlans.length === 0) return []
    
    // Для админа: показываем планы для админов или все планы с ценой >= 50€
    if (user?.role === 'admin') {
      const adminPlans = nonTrialPlans.filter((plan) => {
        const code = plan.code?.toLowerCase() || ''
        return code.includes('admin') || 
               code.includes('unlimited') ||
               (plan.price >= 50 && !code.includes('solo'))
      })
      
      // Если нашлись специфичные планы, возвращаем их, иначе все планы с ценой >= 30€
      if (adminPlans.length > 0) {
        return adminPlans
      }
      // Fallback: показываем все планы с ценой >= 30€ (admin планы обычно дороже)
      return nonTrialPlans.filter((plan) => plan.price >= 30)
    }
    
    // Для специалиста: показываем Solo планы или все планы с ценой < 50€
    if (user?.role === 'specialist') {
      const soloPlans = nonTrialPlans.filter((plan) => {
        const code = plan.code?.toLowerCase() || ''
        return code.includes('solo') ||
               (plan.price < 50 && !code.includes('admin'))
      })
      
      // Если нашлись специфичные планы, возвращаем их, иначе все планы с ценой < 50€
      if (soloPlans.length > 0) {
        return soloPlans
      }
      // Fallback: показываем все планы с ценой < 50€
      return nonTrialPlans.filter((plan) => plan.price < 50)
    }
    
    // Для других ролей - пустой список
    return []
  }, [plans, user?.role])

  const handleSubscribe = async (planId: number) => {
    setLoading(true)
    setError('')
    try {
      await api.post('/subscriptions/', {
        user_id: user?.id,
        plan_id: planId,
        status: 'active',
      })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['trial-status'] })
      setSelectedPlan(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to subscribe')
    } finally {
      setLoading(false)
    }
  }

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Проверяем, нужна ли подписка для этой роли
  if (user?.role !== 'admin' && user?.role !== 'specialist') {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            {t('subscription.notRequired')}
          </p>
        </div>
      </div>
    )
  }

  // Проверяем, является ли пользователь сотрудником
  // Если да, то он использует подписку админа
  const isEmployee = user?.role === 'specialist' && user?.employer_id

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        {t('subscription.title')}
      </h1>

      {isEmployee && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            {t('subscription.employeeMessage')}
          </p>
        </div>
      )}

      {/* Текущая подписка */}
      {subscription && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {t('subscription.currentSubscription')}
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`font-medium ${
                  subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {subscription.status}
              </span>
            </div>
            {subscription.is_trial && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trial Period:</span>
                  <span className="font-medium text-yellow-600">Active</span>
                </div>
                {subscription.trial_end && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trial Ends:</span>
                    <span className="font-medium">
                      {formatDate(subscription.trial_end)} (
                      {getDaysRemaining(subscription.trial_end)} days remaining)
                    </span>
                  </div>
                )}
              </>
            )}
            {subscription.current_period_end && (
              <div className="flex justify-between">
                <span className="text-gray-600">Period Ends:</span>
                <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trial статус */}
      {trialStatus && trialStatus.is_trial && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium mb-2">
            {t('subscription.trialActive')}
          </p>
          {trialStatus.trial_end && (
            <p className="text-sm text-yellow-700">
              {t('subscription.trialEnds')}: {formatDate(trialStatus.trial_end)} (
              {getDaysRemaining(trialStatus.trial_end)} days remaining)
            </p>
          )}
        </div>
      )}

      {/* Список доступных планов */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {t('subscription.availablePlans')}
        </h2>
        {availablePlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  selectedPlan === plan.id ? 'border-blue-600' : 'border-gray-200'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}€</span>
                  <span className="text-gray-600"> / month</span>
                </div>
                <div className="mb-4 text-sm text-gray-600">
                  <p>Period: {plan.period_days} days</p>
                  {plan.code && (
                    <p className="text-xs text-gray-400">Code: {plan.code}</p>
                  )}
                </div>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || subscription?.status === 'active'}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    subscription?.status === 'active'
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                    {subscription?.status === 'active'
                    ? t('subscription.currentPlan')
                    : t('subscription.subscribe')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 mb-2">
              {t('subscription.noPlansAvailable') || 'Нет доступных планов для вашей роли'}
            </p>
            <p className="text-sm text-yellow-700">
              {t('subscription.contactAdmin') || 'Обратитесь к администратору для создания планов подписки'}
            </p>
            {plans && plans.length > 0 && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-yellow-700 font-medium">
                  Отладочная информация: найдено планов в базе: {plans.length}
                </summary>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div className="font-semibold">Все планы:</div>
                  {plans.map((p) => (
                    <div key={p.id} className="ml-2">
                      • {p.name} - код: {p.code || 'нет'} - {p.price}€ - trial: {p.is_trial ? 'да' : 'нет'} - активен: {(p.is_active !== false && p.is_active !== undefined) ? 'да' : 'нет'}
                    </div>
                  ))}
                  <div className="font-semibold mt-2">Отфильтровано (для роли {user?.role}): {availablePlans.length}</div>
                  {availablePlans.map((p) => (
                    <div key={p.id} className="ml-2 text-green-700">
                      ✓ {p.name} - {p.price}€
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!subscription && !trialStatus?.is_trial && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">
            {t('subscription.noSubscription')}
          </p>
          {availablePlans && availablePlans.length > 0 && (
            <p className="text-sm text-gray-500">
              {t('subscription.selectPlan')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

