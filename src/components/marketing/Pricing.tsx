import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { useOffers } from '../../hooks/useOffers'
import type { OfferOut } from '../../api/types'
import { HiOutlineCheck, HiOutlineSparkles } from 'react-icons/hi'

export default function Pricing() {
  const { t } = useTranslation()
  const [selectedProduct, setSelectedProduct] = useState<'crm' | 'ai'>('crm')
  const { data: catalog, isLoading, error } = useOffers()

  const allOffers = catalog?.offers ?? []
  const displayedOffers = allOffers.filter(
    (offer: OfferOut) => offer.product === selectedProduct
  )

  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-medium text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
            <HiOutlineSparkles className="h-3.5 w-3.5" />
            <span>{t('landing.nav.pricing')}</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('landing.pricing.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
            {t('landing.pricing.subtitle')}
          </p>

          {/* Product Line Toggle */}
          <div className="mt-8 inline-flex rounded-xl bg-slate-200/80 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setSelectedProduct('crm')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                selectedProduct === 'crm'
                  ? 'bg-white text-slate-900 shadow dark:bg-blue-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('landing.pricing.crm_tab')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedProduct('ai')}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
                selectedProduct === 'ai'
                  ? 'bg-white text-slate-900 shadow dark:bg-blue-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t('landing.pricing.ai_tab')}
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12">
          {isLoading && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              {t('landing.pricing.loading')}
            </div>
          )}

          {error && (
            <div className="py-12 text-center text-rose-500">
              {t('landing.pricing.error')}
            </div>
          )}

          {!isLoading && !error && displayedOffers.length === 0 && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              {t('landing.pricing.loading')}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
            {displayedOffers.map((offer: OfferOut) => {
              const isDraft = offer.status === 'draft'
              return (
                <div
                  key={offer.code}
                  className={`relative flex flex-col justify-between rounded-2xl border p-8 shadow-sm transition hover:shadow-md ${
                    isDraft
                      ? 'border-dashed border-amber-300 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-950/20'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {offer.name}
                      </h3>
                      {isDraft && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                          {t('landing.pricing.draft_badge')}
                        </span>
                      )}
                    </div>
                    {offer.description && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {offer.description}
                      </p>
                    )}

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {offer.price} {offer.currency}
                      </span>
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t('landing.pricing.per_month')}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300">
                      {offer.entitlements?.max_active_clients && (
                        <li className="flex items-center gap-2">
                          <HiOutlineCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>
                            До {offer.entitlements.max_active_clients} активных клиентов
                          </span>
                        </li>
                      )}
                      {offer.entitlements?.daily_requests_limit && (
                        <li className="flex items-center gap-2">
                          <HiOutlineCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span>
                            До {offer.entitlements.daily_requests_limit} запросов в день
                          </span>
                        </li>
                      )}
                      {offer.entitlements?.features?.map((feat: string) => (
                        <li key={feat} className="flex items-center gap-2">
                          <HiOutlineCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                          <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    {isDraft ? (
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-not-allowed rounded-xl bg-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                      >
                        {t('landing.pricing.choose_plan')}
                      </button>
                    ) : (
                      <Link
                        to="/register"
                        className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow transition hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500"
                      >
                        {t('landing.pricing.choose_plan')}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
