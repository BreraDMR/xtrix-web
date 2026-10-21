import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import type { EntitlementsUsageOut } from '../../api/types'
import { useTranslation } from '../../hooks/useTranslation'
import { useOffers } from '../../hooks/useOffers'
import type { WorkspaceAccess } from '../../hooks/useWorkspaceAccess'
import OfferCards from './OfferCards'
import AccessNotice from './AccessNotice'
import LoadingSpinner from '../LoadingSpinner'
import QueryError from '../QueryError'

export default function PilotSubscription({ access }: { access: WorkspaceAccess }) {
  const { t } = useTranslation()
  const [product, setProduct] = useState<'crm' | 'ai'>('crm')
  const offers = useOffers()
  const usage = useQuery({
    queryKey: ['subscription-usage'],
    queryFn: async () => (await api.get<EntitlementsUsageOut>('/subscriptions/usage')).data,
    enabled: access.crm_mode !== 'blocked',
  })
  return <div className="mx-auto max-w-4xl">
    <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-white">{t('subscription.title')}</h1>
    <AccessNotice access={access} />
    <p role="status" className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">{t('pilot.paymentUnavailable')}</p>
    {!access.can_manage_billing && <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">{t('subscription.paidByOwner')}</p>}
    {usage.data && <dl className="mb-8 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><dt className="text-sm text-gray-600 dark:text-gray-300">{t('subscription.crm_usage')}</dt><dd className="mt-2 text-xl font-semibold">{usage.data.crm.visits} / {usage.data.crm.limit ?? '—'}</dd></div>
      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><dt className="text-sm text-gray-600 dark:text-gray-300">{t('subscription.ai_usage')}</dt><dd className="mt-2 text-xl font-semibold">{usage.data.ai.daily_requests_used} / {usage.data.ai.daily_requests_limit ?? '—'}</dd></div>
    </dl>}
    <label className="mb-6 flex max-w-xs flex-col gap-2 text-sm font-medium">{t('pricing.product')}
      <select value={product} onChange={event => setProduct(event.target.value as 'crm' | 'ai')} className="rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
        <option value="crm">{t('landing.pricing.crm_tab')}</option><option value="ai">{t('landing.pricing.ai_tab')}</option>
      </select>
    </label>
    {offers.isLoading ? <LoadingSpinner /> : offers.isError ? <QueryError retry={offers.refetch} /> : <OfferCards key={product} offers={(offers.data?.offers ?? []).filter(offer => offer.product === product)} />}
    <p className="mt-6 text-sm text-gray-600 dark:text-gray-300">{t('pilot.aiOptIn')}</p>
  </div>
}
