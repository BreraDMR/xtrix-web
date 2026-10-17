import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
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
  cancel_at_period_end?: boolean
  cancelled_at?: string | null
  reactivated_at?: string | null
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

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/me')
      return data
    },
    enabled: user?.role === 'admin' || user?.role === 'specialist',
  })

  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ['trial-status'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/trial/status')
      return data
    },
  })

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/subscriptions/plans?active_only=true')
        console.log('[Subscription] Plans received from API:', data)
        const filtered = data.filter((plan: SubscriptionPlan) => !plan.is_trial)
        console.log('[Subscription] Plans after filtering trial:', filtered)
        return filtered
      } catch (error) {
        console.error('[Subscription] Error fetching plans:', error)
        throw error
      }
    },
  })

  const availablePlans = React.useMemo<SubscriptionPlan[]>(() => {
    console.log('[Subscription] Filtering plans. User role:', user?.role, 'Plans:', plans)
    if (!plans || plans.length === 0) {
      console.log('[Subscription] No plans available')
      return []
    }
    
    const nonTrialPlans = plans.filter((plan) => !plan.is_trial)
    console.log('[Subscription] Non-trial plans:', nonTrialPlans)
    
    if (nonTrialPlans.length === 0) {
      console.log('[Subscription] No non-trial plans')
      return []
    }
    
    if (user?.role === 'admin') {
      const adminPlans = nonTrialPlans.filter((plan) => {
        const code = plan.code?.toLowerCase() || ''
        const matches = code.includes('admin') || 
               code.includes('unlimited') ||
               (plan.price >= 50 && !code.includes('solo'))
        console.log(`[Subscription] Plan ${plan.name} (code: ${code}, price: ${plan.price}) matches admin: ${matches}`)
        return matches
      })
      
      console.log('[Subscription] Admin plans found:', adminPlans)
      
      if (adminPlans.length > 0) {
        return adminPlans
      }
      const fallback = nonTrialPlans.filter((plan) => plan.price >= 30)
      console.log('[Subscription] Using fallback (price >= 30):', fallback)
      return fallback
    }
    
    if (user?.role === 'specialist') {
      const soloPlans = nonTrialPlans.filter((plan) => {
        const code = plan.code?.toLowerCase() || ''
        return code.includes('solo') ||
               (plan.price < 50 && !code.includes('admin'))
      })
      
      if (soloPlans.length > 0) {
        return soloPlans
      }
      return nonTrialPlans.filter((plan) => plan.price < 50)
    }
    
    console.log('[Subscription] User role not admin or specialist')
    return []
  }, [plans, user?.role])

  const handleSubscribe = async (planId: number) => {
    setLoading(true)
    setError('')
    try {
      try {
        const { data: checkoutData } = await api.post('/subscriptions/checkout/create-session', null, {
          params: { plan_id: planId },
        })
        
        if (checkoutData.url) {
          window.location.href = checkoutData.url
          return
        }
      } catch (checkoutError: any) {
        console.warn('Stripe Checkout not available, creating subscription directly:', checkoutError)
      }
      
      await api.post('/subscriptions/', {
        user_id: user?.id,
        plan_id: planId,
        status: 'active',
      })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['trial-status'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] })
      setSelectedPlan(null)
    } catch (err: any) {
      setError(apiErrorMessage(err, t('subscription.failed_subscribe')))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (cancelAtPeriodEnd: boolean = true) => {
    if (!subscription) return
    
    setLoading(true)
    setError('')
    try {
      await api.post(`/subscriptions/${subscription.id}/cancel`, {
        cancel_at_period_end: cancelAtPeriodEnd,
      })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] })
    } catch (err: any) {
      setError(apiErrorMessage(err, t('subscription.failed_cancel')))
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!subscription) return
    
    setLoading(true)
    setError('')
    try {
      await api.post(`/subscriptions/${subscription.id}/reactivate`, {})
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] })
    } catch (err: any) {
      setError(apiErrorMessage(err, t('subscription.failed_reactivate')))
    } finally {
      setLoading(false)
    }
  }

  const { data: transactions } = useQuery<any[]>({
    queryKey: ['subscription-transactions', subscription?.id],
    queryFn: async () => {
      if (!subscription) return []
      const { data } = await api.get(`/subscriptions/${subscription.id}/transactions`)
      return data
    },
    enabled: !!subscription,
  })

  const { data: subscriptionHistory } = useQuery<Subscription[]>({
    queryKey: ['subscription-history'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/history')
      return data
    },
    enabled: user?.role === 'admin' || user?.role === 'specialist',
  })

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

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

      {}
      {subscription && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">
              {t('subscription.currentSubscription')}
            </h2>
            <div className="flex gap-2">
              {subscription.status === 'pending_cancellation' && (
                <button
                  onClick={handleReactivate}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {t('subscription.reactivate')}
                </button>
              )}
              {(subscription.status === 'active' || subscription.status === 'pending_cancellation') && !subscription.is_trial && (
                <button
                  onClick={() => handleCancel(true)}
                  disabled={loading || subscription.cancel_at_period_end}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  {subscription.cancel_at_period_end
                    ? t('subscription.cancelled')
                    : t('subscription.cancel')}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('subscription.status_label')}:</span>
              <span
                className={`font-medium ${
                  subscription.status === 'active' || subscription.status === 'pending_cancellation'
                    ? 'text-green-600'
                    : subscription.status === 'cancelled' || subscription.status === 'expired'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {subscription.status === 'pending_cancellation'
                  ? t('subscription.pendingCancellation')
                  : subscription.status}
              </span>
            </div>
            {subscription.cancel_at_period_end && subscription.current_period_end && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('subscription.cancellation_date')}:</span>
                <span className="font-medium text-orange-600">
                  {formatDate(subscription.current_period_end)} ({getDaysRemaining(subscription.current_period_end)} {t('subscription.days_remaining')})
                </span>
              </div>
            )}
            {subscription.is_trial && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('subscription.trial_period')}:</span>
                  <span className="font-medium text-yellow-600">{t('subscription.trial_period_active')}</span>
                </div>
                {subscription.trial_end && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('subscription.trialEnds')}:</span>
                    <span className="font-medium">
                      {formatDate(subscription.trial_end)} ({getDaysRemaining(subscription.trial_end)} {t('subscription.days_remaining')})
                    </span>
                  </div>
                )}
              </>
            )}
            {subscription.current_period_end && !subscription.cancel_at_period_end && (
              <div className="flex justify-between">
                <span className="text-gray-600">{t('subscription.period_ends')}:</span>
                <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
              </div>
            )}
          </div>

          {}
          {transactions && transactions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-3">
                {t('subscription.transactionHistory')}
              </h3>
              <div className="space-y-2">
                {transactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{transaction.payment_method}</div>
                      <div className="text-sm text-gray-600">
                        {transaction.transaction_date
                          ? formatDate(transaction.transaction_date)
                          : formatDate(transaction.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {transaction.amount > 0 ? `${transaction.amount}${transaction.currency?.toUpperCase() || '€'}` : '-'}
                      </div>
                      <div
                        className={`text-sm ${
                          transaction.status === 'succeeded'
                            ? 'text-green-600'
                            : transaction.status === 'failed'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {}
      {trialStatus && trialStatus.is_trial && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium mb-2">
            {t('subscription.trialActive')}
          </p>
          {trialStatus.trial_end && (
            <p className="text-sm text-yellow-700">
              {t('subscription.trialEnds')}: {formatDate(trialStatus.trial_end)} ({getDaysRemaining(trialStatus.trial_end)} {t('subscription.days_remaining')})
            </p>
          )}
        </div>
      )}

      {}
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
                  <span className="text-gray-600">{t('subscription.per_month')}</span>
                </div>
                <div className="mb-4 text-sm text-gray-600">
                  <p>{t('subscription.period_days')}: {plan.period_days} {t('common.days')}</p>
                </div>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || subscription?.status === 'active'}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    subscription?.status === 'active'
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
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

      {}
      {subscriptionHistory && subscriptionHistory.length > 1 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            {t('subscription.history')}
          </h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscription.plan_label')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscription.status_label')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscription.created_label')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscription.period_end_label')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptionHistory
                  .filter((sub: Subscription) => sub.id !== subscription?.id)
                  .map((sub: Subscription) => (
                    <tr key={sub.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {t('subscription.plan_number')} #{sub.plan_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            sub.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : sub.status === 'cancelled' || sub.status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sub.current_period_end)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

