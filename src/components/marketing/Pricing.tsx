import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useOffers } from '../../hooks/useOffers'
import OfferCards from '../subscription/OfferCards'

export default function Pricing() {
  const { t } = useTranslation()
  const [product, setProduct] = useState<'crm' | 'ai'>('crm')
  const { data, isLoading, error } = useOffers()
  return <section id="pricing" className="py-20 lg:py-28">
    <div className="mx-auto max-w-4xl px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">{t('landing.pricing.title')}</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{t('landing.pricing.subtitle')}</p>
        <label className="mx-auto mt-6 flex max-w-xs flex-col gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          {t('pricing.product')}
          <select value={product} onChange={event => setProduct(event.target.value as 'crm' | 'ai')} className="rounded-xl border border-gray-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800">
            <option value="crm">{t('landing.pricing.crm_tab')}</option>
            <option value="ai">{t('landing.pricing.ai_tab')}</option>
          </select>
        </label>
      </div>
      <div className="mt-10">
        {isLoading ? <p role="status">{t('landing.pricing.loading')}</p>
          : error ? <p role="alert" className="text-red-600 dark:text-red-400">{t('landing.pricing.error')}</p>
            : <OfferCards key={product} offers={(data?.offers ?? []).filter(offer => offer.product === product)} registration />}
      </div>
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">{t('pricing.trial')}</p>
    </div>
  </section>
}
