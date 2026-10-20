import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { apiErrorMessage, apiErrorStatus } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import CheckoutReturn from '../components/CheckoutReturn'
import { useLabels } from '../i18n/labels'
import type { Schema, EntitlementsUsageOut } from '../api/types'

type Subscription = Schema<'SubscriptionOut'>
type SubscriptionPlan = Schema<'SubscriptionPlanOut'>
type Transaction = Schema<'TransactionOut'>

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
  const labels = useLabels()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // checkout answered 403: the API counts us as staff even if we couldn't tell up front
  const [checkoutForbidden, setCheckoutForbidden] = useState(false)

  // The owner pays for the whole team; /users/me gives employer_id for anyone on someone's staff.
  const isStaff = user?.role === 'employee' || !!user?.employer_id || checkoutForbidden
  const isPayer = !isStaff && (user?.role === 'admin' || user?.role === 'business_owner' || user?.role === 'specialist')

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/me')
      return data
    },
    enabled: isPayer,
  })

  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ['trial-status'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/trial/status')
      return data
    },
  })

  const { data: usageData } = useQuery<EntitlementsUsageOut>({
    queryKey: ['subscription-usage'],
    queryFn: async () => {
      const { data } = await api.get<EntitlementsUsageOut>('/subscriptions/usage')
      return data
    },
  })

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/plans?active_only=true')
      return data.filter((plan: SubscriptionPlan) => !plan.is_trial)
    },
  })

  const availablePlans = React.useMemo<SubscriptionPlan[]>(() => {
    if (!plans || plans.length === 0) {
      return []
    }
    
    const nonTrialPlans = plans.filter((plan) => !plan.is_trial)
    
    if (nonTrialPlans.length === 0) {
      return []
    }
    
    if (user?.role === 'admin' || user?.role === 'business_owner') {
      const adminPlans = nonTrialPlans.filter((plan) => {
        const code = plan.code?.toLowerCase() || ''
        const matches = code.includes('admin') || 
               code.includes('unlimited') ||
               (plan.price >= 50 && !code.includes('solo'))
        return matches
      })

      if (adminPlans.length > 0) {
        return adminPlans
      }
      const fallback = nonTrialPlans.filter((plan) => plan.price >= 30)
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
    
    return []
  }, [plans, user?.role])

  // Paying goes through Stripe Checkout only. Creating a subscription directly is
  // admin-only on the API now (403), so there's no fallback when Stripe is down.
  const handleSubscribe = async (planId: number) => {
    setLoading(true)
    setError('')
    try {
      const { data: checkoutData } = await api.post('/subscriptions/checkout/create-session', null, {
        params: { plan_id: planId },
      })
      if (checkoutData?.url) {
        window.location.href = checkoutData.url
        return
      }
      setError(t('subscription.checkoutUnavailable'))
    } catch (err) {
      if (apiErrorStatus(err) === 403) {
        setCheckoutForbidden(true)
        return
      }
      setError(
        apiErrorStatus(err) === 503
          ? t('subscription.checkoutUnavailable')
          : apiErrorMessage(err, t('subscription.failed_subscribe'))
      )
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
    } catch (err) {
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
    } catch (err) {
      setError(apiErrorMessage(err, t('subscription.failed_reactivate')))
    } finally {
      setLoading(false)
    }
  }

  const { data: transactions } = useQuery<Transaction[]>({
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
    enabled: isPayer,
  })

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isStaff) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">{t('subscription.title')}</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{t('subscription.paidByOwner')}</p>
        </div>
        {trialStatus && trialStatus.has_access === false && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">{t('subscription.ownerPlanInactive')}</p>
          </div>
        )}
      </div>
    )
  }

  if (!isPayer) {
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

  // every new specialist starts on an active trial subscription - that must not lock the
  // paid plans, only the plan you're actually paying for counts as current
  const isCurrentPlan = (plan: SubscriptionPlan) =>
    subscription?.status === 'active' && !subscription.is_trial && subscription.plan_id === plan.id

  const planById = (id: number) => plans?.find((plan) => plan.id === id)

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysRemaining = (endDate?: string | null) => {
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
      <CheckoutReturn />

      {/* Usage and Entitlements */}
      {usageData && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {t('subscription.usage_title')}
            </h2>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded text-slate-600 dark:text-slate-300">
              {usageData.period}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CRM active clients */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  {t('subscription.crm_usage')}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    usageData.crm.is_within_limit
                      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {usageData.crm.is_within_limit
                    ? t('subscription.within_limit')
                    : t('subscription.limit_exceeded')}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {usageData.crm.active_clients}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  / {usageData.crm.limit ?? '∞'}
                </span>
              </div>
              {usageData.crm.offer_code && (
                <div className="text-xs text-slate-500 mt-1">
                  Тариф: {usageData.crm.offer_code}
                </div>
              )}
            </div>

            {/* AI Sasha daily requests */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  {t('subscription.ai_usage')}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    usageData.ai.is_within_limit
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {usageData.ai.is_within_limit
                    ? t('subscription.within_limit')
                    : t('subscription.limit_exceeded')}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {usageData.ai.daily_requests_used}
                <span className="text-sm font-normal text-slate-500 ml-1">
                  / {usageData.ai.daily_requests_limit ?? 20}
                </span>
              </div>
              {usageData.ai.offer_code && (
                <div className="text-xs text-slate-500 mt-1">
                  Продукт: {usageData.ai.offer_code}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {}
      {subscription && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
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
              <span className="text-gray-600 dark:text-gray-400">{t('subscription.status_label')}:</span>
              <span
                className={`font-medium ${
                  subscription.status === 'active' || subscription.status === 'pending_cancellation'
                    ? 'text-green-600'
                    : subscription.status === 'cancelled' || subscription.status === 'expired'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {labels.subscriptionStatus(subscription.status)}
              </span>
            </div>
            {subscription.cancel_at_period_end && subscription.current_period_end && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('subscription.cancellation_date')}:</span>
                <span className="font-medium text-orange-600">
                  {formatDate(subscription.current_period_end)} ({getDaysRemaining(subscription.current_period_end)} {t('subscription.days_remaining')})
                </span>
              </div>
            )}
            {subscription.is_trial && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('subscription.trial_period')}:</span>
                  <span className="font-medium text-yellow-600">{t('subscription.trial_period_active')}</span>
                </div>
                {subscription.trial_end && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('subscription.trialEnds')}:</span>
                    <span className="font-medium">
                      {formatDate(subscription.trial_end)} ({getDaysRemaining(subscription.trial_end)} {t('subscription.days_remaining')})
                    </span>
                  </div>
                )}
              </>
            )}
            {subscription.current_period_end && !subscription.cancel_at_period_end && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('subscription.period_ends')}:</span>
                <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
              </div>
            )}
          </div>

          {}
          {transactions && transactions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3">
                {t('subscription.transactionHistory')}
              </h3>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 bg-gray-50 rounded dark:bg-gray-900">
                    <div>
                      <div className="font-medium">{transaction.payment_method}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
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
                        {labels.transactionStatus(transaction.status)}
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
                className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold mb-2">{labels.planName(plan)}</h3>
                {labels.planFeatures(plan) && (
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{labels.planFeatures(plan)}</p>
                )}
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}€</span>
                  <span className="text-gray-600 dark:text-gray-400">{t(plan.period_days >= 365 ? 'subscription.per_year' : 'subscription.per_month')}</span>
                </div>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>{t('subscription.period_days')}: {plan.period_days} {t('common.days')}</p>
                </div>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || isCurrentPlan(plan)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    isCurrentPlan(plan)
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isCurrentPlan(plan) ? t('subscription.currentPlan') : t('subscription.subscribe')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 mb-2">
              {t('subscription.noPlansAvailable')}
            </p>
            <p className="text-sm text-yellow-700">
              {t('subscription.contactAdmin')}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {!subscription && !trialStatus?.is_trial && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center dark:bg-gray-900 dark:border-gray-700">
          <p className="text-gray-600 mb-4 dark:text-gray-400">
            {t('subscription.noSubscription')}
          </p>
          {availablePlans && availablePlans.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
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
          <div className="bg-white rounded-lg shadow-md overflow-hidden dark:bg-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    {t('subscription.plan_label')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    {t('subscription.status_label')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    {t('subscription.created_label')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    {t('subscription.period_end_label')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {subscriptionHistory
                  .filter((sub: Subscription) => sub.id !== subscription?.id)
                  .map((sub: Subscription) => (
                    <tr key={sub.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {planById(sub.plan_id) ? labels.planName(planById(sub.plan_id)) : `${t('subscription.plan_number')} #${sub.plan_id}`}
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
                          {labels.subscriptionStatus(sub.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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

