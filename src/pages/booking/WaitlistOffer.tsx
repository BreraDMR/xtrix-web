import { useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import PublicShell from '../../components/public/PublicShell'
import LoadingSpinner from '../../components/LoadingSpinner'
import DepositStep from '../../components/booking/DepositStep'
import { INTL_LOCALE } from '../../components/booking/intl'
import { useLinkToken } from '../../hooks/useLinkToken'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type { WaitlistMessageOut, WaitlistOfferAcceptOut, WaitlistOfferOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

const TOKEN_KEY = 'waitlist_offer_token'

function initialToken(): string | null {
  const hadFragment = window.location.hash.length > 1
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
      // keep the router's history entry, otherwise back/forward loses its index
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
    } catch {
      // ignore
    }
    return token
  }
  if (hadFragment) {
    // an empty #token= is a new (broken) link, so the old offer must not stay on screen
    try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* storage may be unavailable */ }
    return null
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
  return <PublicShell title={t('waitlistOffer.title')}>{children}</PublicShell>
}

export default function WaitlistOffer() {
  // a second offer mail opened in the same tab only changes the fragment;
  // the key throws away the first offer's result and pending actions
  const token = useLinkToken(initialToken)
  return <WaitlistOfferSession key={token ?? 'missing'} token={token} />
}

function WaitlistOfferSession({ token }: { token: string | null }) {
  const { t, locale } = useTranslation()
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
        <section className="ui-card p-8 text-center">
          <h1 className="text-xl font-semibold">{t('waitlistOffer.unavailableTitle')}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--workspace-muted)]">{t('waitlistOffer.unavailableText')}</p>
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
        <section className="ui-card p-8 text-center">
          <h1 className="text-xl font-semibold">
            {status === 404 ? t('waitlistOffer.unavailableTitle') : t('waitlistOffer.loadError')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--workspace-muted)]">
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
      <section className="ui-card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{offer.business_name}</h1>
        <p className="mt-1 text-sm text-[var(--workspace-muted)]">{t('waitlistOffer.subtitle')}</p>

        <dl className="mt-5 divide-y divide-[var(--workspace-line)] text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.service')}</dt>
            <dd className="text-right font-medium">{offer.service_name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.master')}</dt>
            <dd className="text-right font-medium">{offer.staff_name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.dateTime')}</dt>
            <dd className="text-right font-medium">
              {when}
              <span className="mt-1 block text-xs font-normal text-[var(--workspace-muted)]">{offer.timezone}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.price')}</dt>
            <dd className="text-right font-medium">
              {offer.price === null || offer.price === undefined
                ? t('booking.priceOnRequest')
                : formatCurrency(offer.price, offer.currency as Currency)}
            </dd>
          </div>
        </dl>

        {isPending && (
          <p className="mt-4 rounded-lg bg-[var(--tint-amber)] p-3 text-sm text-[var(--tint-amber-ink)]">
            {t('waitlistOffer.notReserved')}
          </p>
        )}

        {isPending && (
          <p className="mt-2 text-sm text-[var(--workspace-muted)]">
            {t('waitlistOffer.expires')}: <span className="font-medium">{expires}</span>
          </p>
        )}

        {actionError != null && (
          <p role="alert" className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] p-3 text-sm text-[var(--tint-red-ink)]">
            {apiErrorMessage(actionError, t('waitlistOffer.actionError'))}
          </p>
        )}

        {accepted ? (
          <div className={`mt-5 rounded-xl border p-4 ${
            accepted.payment
              ? 'border-[color-mix(in_srgb,var(--tint-amber-ink)_25%,transparent)] bg-[var(--tint-amber)]'
              : 'border-[color-mix(in_srgb,var(--tint-green-ink)_25%,transparent)] bg-[var(--tint-green)]'
          }`}>
            <h2 className={`text-lg font-semibold ${
              accepted.payment
                ? 'text-[var(--tint-amber-ink)]'
                : 'text-[var(--tint-green-ink)]'
            }`}>
              {accepted.payment ? t('booking.heldTitle') : t('waitlistOffer.acceptedTitle')}
            </h2>
            <p className={`mt-1 text-sm ${
              accepted.payment
                ? 'text-[var(--tint-amber-ink)]'
                : 'text-[var(--tint-green-ink)]'
            }`}>
              {accepted.payment ? t('booking.heldText') : t('waitlistOffer.acceptedText')}
            </p>
            <p className={`mt-2 text-sm font-medium ${
              accepted.payment
                ? 'text-[var(--tint-amber-ink)]'
                : 'text-[var(--tint-green-ink)]'
            }`}>
              {t('booking.bookingNumber')}: #{accepted.id}
            </p>
            {accepted.payment && (
              <DepositStep
                payment={accepted.payment}
                timezone={accepted.timezone}
                currency={accepted.currency}
              />
            )}
            {accepted.manage_token && (
              <a
                href={`/manage#token=${encodeURIComponent(accepted.manage_token)}`}
                className="mt-3 inline-block ui-button ui-button-primary"
              >
                {t('booking.manageLink')}
              </a>
            )}
          </div>
        ) : declined ? (
          <div className="mt-5 rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-fill)] p-4">
            <h2 className="text-lg font-semibold">{t('waitlistOffer.declinedTitle')}</h2>
            <p className="mt-1 text-sm text-[var(--workspace-muted)]">{t('waitlistOffer.declinedText')}</p>
          </div>
        ) : isPending ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={accept.isPending || decline.isPending}
              onClick={() => accept.mutate()}
              className="ui-button ui-button-primary disabled:opacity-50"
            >
              {accept.isPending ? t('waitlistOffer.accepting') : t('waitlistOffer.accept')}
            </button>
            <button
              type="button"
              disabled={accept.isPending || decline.isPending}
              onClick={() => decline.mutate()}
              className="ui-button ui-button-secondary disabled:opacity-50"
            >
              {decline.isPending ? t('waitlistOffer.declining') : t('waitlistOffer.decline')}
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-fill)] p-4">
            <h2 className="text-lg font-semibold">{t(STATUS_KEYS[status] ?? 'waitlistOffer.status.expired')}</h2>
            <p className="mt-1 text-sm text-[var(--workspace-muted)]">{t('waitlistOffer.closedText')}</p>
          </div>
        )}

        {(offer.business_phone || offer.business_address) && (
          <div className="mt-5 border-t border-[var(--workspace-line)] pt-4 text-sm">
            <h2 className="text-sm font-semibold text-[var(--workspace-muted)]">{t('booking.contacts')}</h2>
            <dl className="mt-2 space-y-1">
              {offer.business_phone && (
                <div>
                  <dt className="inline text-[var(--workspace-muted)]">{t('clients.phone')}: </dt>
                  <dd className="inline">
                    <a className="text-[var(--workspace-accent)] hover:underline" href={`tel:${offer.business_phone}`}>
                      {offer.business_phone}
                    </a>
                  </dd>
                </div>
              )}
              {offer.business_address && (
                <div>
                  <dt className="inline text-[var(--workspace-muted)]">{t('business.address')}: </dt>
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
