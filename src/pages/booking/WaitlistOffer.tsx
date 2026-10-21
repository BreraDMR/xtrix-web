import { useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import LoadingSpinner from '../../components/LoadingSpinner'
import { INTL_LOCALE } from '../../components/booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type { WaitlistMessageOut, WaitlistOfferAcceptOut, WaitlistOfferOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

const TOKEN_KEY = 'waitlist_offer_token'

function initialToken(): string | null {
  let fromHash = ''
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    fromHash = params.get('token') ?? ''
  } catch {
    fromHash = ''
  }
  const token = fromHash.trim()
  if (token) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      // private windows may reject storage, the page still works
    }
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    } catch {
      // ignore
    }
    return token
  }
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  accepted: 'waitlistOffer.status.accepted',
  declined: 'waitlistOffer.status.declined',
  expired: 'waitlistOffer.status.expired',
  conflict: 'waitlistOffer.status.conflict',
  cancelled: 'waitlistOffer.status.cancelled',
}

function PublicFrame({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">{t('waitlistOffer.title')}</span>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
    </div>
  )
}

export default function WaitlistOffer() {
  const { t, locale } = useTranslation()
  const [token] = useState(initialToken)
  const [accepted, setAccepted] = useState<WaitlistOfferAcceptOut | null>(null)
  const [declined, setDeclined] = useState(false)
  const [actionError, setActionError] = useState<unknown>(null)

  const offerQuery = useQuery<WaitlistOfferOut>({
    queryKey: ['waitlist-offer', token],
    queryFn: async () => {
      const { data } = await api.get<WaitlistOfferOut>('/public/waitlist/offer', {
        headers: { 'X-Waitlist-Token': token },
      })
      return data
    },
    enabled: Boolean(token),
    retry: false,
  })

  const accept = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<WaitlistOfferAcceptOut>('/public/waitlist/offer/accept', null, {
        headers: { 'X-Waitlist-Token': token },
      })
      return data
    },
    onSuccess: (data) => {
      setAccepted(data)
      setActionError(null)
    },
    onError: (error) => {
      setActionError(error)
      void offerQuery.refetch()
    },
  })

  const decline = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<WaitlistMessageOut>('/public/waitlist/offer/decline', null, {
        headers: { 'X-Waitlist-Token': token },
      })
      return data
    },
    onSuccess: () => {
      setDeclined(true)
      setActionError(null)
    },
    onError: (error) => {
      setActionError(error)
      void offerQuery.refetch()
    },
  })

  if (!token) {
    return (
      <PublicFrame>
        <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <h1 className="text-xl font-semibold">{t('waitlistOffer.unavailableTitle')}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-gray-400">{t('waitlistOffer.unavailableText')}</p>
        </section>
      </PublicFrame>
    )
  }

  if (offerQuery.isLoading) {
    return (
      <PublicFrame>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </PublicFrame>
    )
  }

  if (offerQuery.isError) {
    const status = apiErrorStatus(offerQuery.error)
    return (
      <PublicFrame>
        <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <h1 className="text-xl font-semibold">
            {status === 404 ? t('waitlistOffer.unavailableTitle') : t('waitlistOffer.loadError')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-gray-400">
            {status === 404 ? t('waitlistOffer.unavailableText') : apiErrorMessage(offerQuery.error, '')}
          </p>
        </section>
      </PublicFrame>
    )
  }

  const offer = offerQuery.data
  if (!offer) return null

  const when = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: offer.timezone,
  }).format(new Date(offer.start))
  const expires = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: offer.timezone,
  }).format(new Date(offer.expires_at))
  const status = accepted ? 'accepted' : declined ? 'declined' : offer.status
  const isPending = status === 'pending'

  return (
    <PublicFrame>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        <h1 className="text-2xl font-bold">{offer.business_name}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('waitlistOffer.subtitle')}</p>

        <dl className="mt-5 divide-y divide-slate-100 text-sm dark:divide-gray-700">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('booking.service')}</dt>
            <dd className="text-right font-medium">{offer.service_name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('booking.master')}</dt>
            <dd className="text-right font-medium">{offer.staff_name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('booking.dateTime')}</dt>
            <dd className="text-right font-medium">
              {when}
              <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-gray-400">{offer.timezone}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('booking.price')}</dt>
            <dd className="text-right font-medium">
              {offer.price === null || offer.price === undefined
                ? t('booking.priceOnRequest')
                : formatCurrency(offer.price, offer.currency as Currency)}
            </dd>
          </div>
        </dl>

        {isPending && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {t('waitlistOffer.notReserved')}
          </p>
        )}

        {isPending && (
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
            {t('waitlistOffer.expires')}: <span className="font-medium">{expires}</span>
          </p>
        )}

        {actionError != null && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {apiErrorMessage(actionError, t('waitlistOffer.actionError'))}
          </p>
        )}

        {accepted ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
              {t('waitlistOffer.acceptedTitle')}
            </h2>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">{t('waitlistOffer.acceptedText')}</p>
            <p className="mt-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
              {t('booking.bookingNumber')}: #{accepted.id}
            </p>
            {accepted.manage_token && (
              <a
                href={`/manage#token=${encodeURIComponent(accepted.manage_token)}`}
                className="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                {t('booking.manageLink')}
              </a>
            )}
          </div>
        ) : declined ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-gray-600 dark:bg-gray-700">
            <h2 className="text-lg font-semibold">{t('waitlistOffer.declinedTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">{t('waitlistOffer.declinedText')}</p>
          </div>
        ) : isPending ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={accept.isPending || decline.isPending}
              onClick={() => accept.mutate()}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {accept.isPending ? t('waitlistOffer.accepting') : t('waitlistOffer.accept')}
            </button>
            <button
              type="button"
              disabled={accept.isPending || decline.isPending}
              onClick={() => decline.mutate()}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {decline.isPending ? t('waitlistOffer.declining') : t('waitlistOffer.decline')}
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-gray-600 dark:bg-gray-700">
            <h2 className="text-lg font-semibold">{t(STATUS_KEYS[status] ?? 'waitlistOffer.status.expired')}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">{t('waitlistOffer.closedText')}</p>
          </div>
        )}

        {(offer.business_phone || offer.business_address) && (
          <div className="mt-5 border-t border-slate-100 pt-4 text-sm dark:border-gray-700">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-gray-400">{t('booking.contacts')}</h2>
            <dl className="mt-2 space-y-1">
              {offer.business_phone && (
                <div>
                  <dt className="inline text-slate-500 dark:text-gray-400">{t('clients.phone')}: </dt>
                  <dd className="inline">
                    <a className="text-primary-600 hover:underline dark:text-primary-400" href={`tel:${offer.business_phone}`}>
                      {offer.business_phone}
                    </a>
                  </dd>
                </div>
              )}
              {offer.business_address && (
                <div>
                  <dt className="inline text-slate-500 dark:text-gray-400">{t('business.address')}: </dt>
                  <dd className="inline">{offer.business_address}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </section>
    </PublicFrame>
  )
}
