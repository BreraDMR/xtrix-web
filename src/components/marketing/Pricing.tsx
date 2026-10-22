import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useOffers } from '../../hooks/useOffers'
import Select from '../../ui/Select'
import OfferCards from '../subscription/OfferCards'

export default function Pricing() {
  const { t } = useTranslation()
  const [product, setProduct] = useState<'crm' | 'ai'>('crm')
  const { data, isLoading, error } = useOffers()
  return <section id="pricing" className="scroll-mt-24 py-14 sm:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{t('landing.pricing.title')}</h2>
        <p className="mt-4 text-sm leading-relaxed text-[var(--workspace-muted)] sm:text-base">{t('landing.pricing.subtitle')}</p>
        <label className="mt-6 flex max-w-xs flex-col gap-2 text-xs font-medium text-[var(--workspace-muted)]">
          {t('pricing.product')}
          <Select value={product} onChange={event => setProduct(event.target.value as 'crm' | 'ai')}>
            <option value="crm">{t('landing.pricing.crm_tab')}</option>
            <option value="ai">{t('landing.pricing.ai_tab')}</option>
          </Select>
        </label>
      </div>
      <div className="mt-8 [&_article]:!rounded-lg [&_article]:!border-[var(--workspace-line)] [&_article]:!bg-[var(--workspace-panel)] [&_article_h3]:!text-[var(--workspace-ink)] [&_article_p]:!text-[var(--workspace-ink)] [&_article_a]:!rounded-md [&_article_a]:!bg-[var(--workspace-accent)] [&_article_a]:!text-[var(--workspace-panel)] [&_article_a:hover]:!bg-[var(--workspace-accent-hover)]">
        {isLoading ? <p role="status">{t('landing.pricing.loading')}</p>
          : error ? <p role="alert" className="text-red-600 dark:text-red-400">{t('landing.pricing.error')}</p>
            : <OfferCards key={product} offers={(data?.offers ?? []).filter(offer => offer.product === product)} registration />}
      </div>
      <p className="mt-6 text-sm leading-relaxed text-[var(--workspace-muted)]">{t('pricing.trial')}</p>
    </div>
  </section>
}
