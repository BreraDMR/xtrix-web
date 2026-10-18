import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import type { Schema } from '../api/types'

export default function CheckoutReturn() {
  const [params] = useSearchParams()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const attempts = useRef(0)
  const sessionId = params.get('success') === 'true' ? params.get('session_id') : null
  const cancelled = params.get('canceled') === 'true'
  const verification = useQuery({
    queryKey: ['checkout-return', sessionId],
    enabled: !!sessionId && !cancelled,
    retry: false,
    queryFn: async () => {
      attempts.current += 1
      const { data: session } = await api.get<{ status: string; subscription_id: string | null }>(
        `/subscriptions/checkout/session/${encodeURIComponent(sessionId!)}`
      )
      if (session.status !== 'paid') return 'unpaid' as const
      const { data: subscription } = await api.get<Schema<'SubscriptionOut'> | null>('/subscriptions/me')
      return subscription && !subscription.is_trial && subscription.status === 'active'
        && subscription.external_id === session.subscription_id ? 'active' as const : 'pending' as const
    },
    // A successful redirect isn't proof of payment. Wait up to a minute for the webhook.
    refetchInterval: (query) => query.state.data === 'pending' && attempts.current < 30 ? 2000 : false,
  })

  useEffect(() => {
    if (verification.data !== 'active') return
    for (const key of ['subscription', 'subscription-history', 'subscription-transactions', 'trial-status']) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
  }, [verification.data, queryClient])

  if (!sessionId && !cancelled) return null
  const message = cancelled ? 'subscription.checkoutCancelled'
    : verification.isError ? 'subscription.checkoutVerifyError'
      : verification.data === 'active' ? 'subscription.checkoutActive'
        : verification.data === 'pending' ? 'subscription.checkoutPending'
          : verification.data === 'unpaid' ? 'subscription.checkoutUnpaid' : 'subscription.checkoutChecking'

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4" role="status">
      <p>{t(message)}</p>
      {!cancelled && verification.data !== 'active' && (
        <button type="button" className="mt-2 underline" disabled={verification.isFetching} onClick={() => {
          attempts.current = 0
          void verification.refetch()
        }}>{t('subscription.checkoutRetry')}</button>
      )}
    </div>
  )
}
