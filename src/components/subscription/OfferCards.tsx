import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type { OfferOut } from '../../api/types'

const tierKeys: Record<string, TranslationKey> = {
  starter: 'pricing.start', standard: 'pricing.standard', pro: 'pricing.standard',
  business: 'pricing.business', large_business: 'pricing.largeBusiness',
}

function offerName(offer: OfferOut, t: (key: TranslationKey) => string) {
  const tier = offer.code.replace(/^(crm|ai)_/, '').replace(/_czk$/, '')
  return tierKeys[tier] ? t(tierKeys[tier]) : offer.name
}

export default function OfferCards({ offers, registration = false }: { offers: OfferOut[]; registration?: boolean }) {
  const { t, locale } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const approved = offers.filter(offer => offer.status === 'approved').sort((a, b) => Number(a.price) - Number(b.price))
  const visible = expanded ? approved : approved.slice(0, 2)
  if (!approved.length) return <p className="py-8 text-center text-gray-500 dark:text-gray-400">{t('pricing.empty')}</p>
  return <>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {visible.map(offer => <article key={offer.code} className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{offerName(offer, t)}</h3>
        <p className="mt-5 text-3xl font-semibold text-gray-900 dark:text-white">
          {new Intl.NumberFormat(locale === 'cz' ? 'cs-CZ' : locale, { style: 'currency', currency: offer.currency, maximumFractionDigits: 0 }).format(Number(offer.price))}
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">{t('landing.pricing.per_month')}</span>
        </p>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          {offer.product === 'crm'
            ? t('pricing.visits').replace('{count}', String(offer.entitlements?.max_monthly_visits ?? '—'))
            : t('pricing.requests').replace('{count}', String(offer.entitlements?.daily_requests_limit ?? '—'))}
        </p>
        {registration && <Link to="/register" className="mt-6 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">{t('pricing.try')}</Link>}
      </article>)}
    </div>
    {approved.length > 2 && <div className="mt-6 text-center"><button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200">{t(expanded ? 'pricing.less' : 'pricing.more')}</button></div>}
  </>
}
