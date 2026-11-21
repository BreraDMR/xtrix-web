import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { useOffers } from '../../hooks/useOffers'
import Select from '../../ui/Select'
import OfferCards from '../subscription/OfferCards'
import { LuCheck } from 'react-icons/lu'

export default function Pricing() {
  const { t } = useTranslation()
  const [product, setProduct] = useState<'crm' | 'ai'>('crm')
  const { data, isLoading, error } = useOffers()
  const perks = [t('landing.pricing.perk1'), t('landing.pricing.perk2'), t('landing.pricing.perk3')]
  return <section id="pricing" className="scroll-mt-20 border-t border-[var(--workspace-line)] py-20 sm:py-28">
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="lp-eyebrow lp-gradient-text">{t('landing.nav.pricing')}</p>
        <h2 className="lp-section-title mt-3">{t('landing.pricing.title')}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-[var(--workspace-muted)]">{t('landing.pricing.subtitle')}</p>
        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--workspace-muted)]">
          {perks.map(perk => <li key={perk} className="flex items-center gap-2"><LuCheck className="h-4 w-4 shrink-0 text-[var(--workspace-accent)]" aria-hidden="true" />{perk}</li>)}
        </ul>
        <label className="mx-auto mt-8 flex max-w-xs flex-col gap-2 text-left text-xs font-medium text-[var(--workspace-muted)]">
          {t('pricing.product')}
          <Select value={product} onChange={event => setProduct(event.target.value as 'crm' | 'ai')}>
            <option value="crm">{t('landing.pricing.crm_tab')}</option>
            <option value="ai">{t('landing.pricing.ai_tab')}</option>
          </Select>
        </label>
      </div>
      <div className="mt-10 [&_article]:!rounded-[28px] [&_article]:!border-[var(--workspace-card-border)] [&_article]:!bg-[var(--workspace-panel)] [&_article]:!p-8 [&_article]:shadow-[var(--workspace-card-shadow)] [&_article_h3]:!text-[var(--workspace-ink)] [&_article_p]:!text-[var(--workspace-ink)] [&_article_a]:!rounded-full [&_article_a]:![background:var(--x-gradient)] [&_article_a]:!text-white [&_article_a:hover]:brightness-105">
        {isLoading ? <p role="status" className="text-center text-sm text-[var(--workspace-muted)]">{t('landing.pricing.loading')}</p>
          : error ? <p role="alert" className="text-center text-[var(--tint-red-ink)]">{t('landing.pricing.error')}</p>
            : <OfferCards key={product} offers={(data?.offers ?? []).filter(offer => offer.product === product)} registration />}
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-[var(--workspace-muted)]">{t('pricing.trial')}</p>
    </div>
  </section>
}
