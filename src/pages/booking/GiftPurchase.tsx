import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import LoadingSpinner from '../../components/LoadingSpinner'
import { INTL_LOCALE } from '../../components/booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type {
  GiftCertificateOut,
  GiftOfferOut,
  GiftOrderOut,
  GiftPurchaseIn,
  GiftShopOut,
} from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

type GiftParams = { ref: string; token: string }

function readGiftParams(location?: { hash: string; search: string }): GiftParams | null {
  let ref = ''
  let token = ''
  const hashText = location ? location.hash : window.location.hash
  const searchText = location ? location.search : window.location.search
  try {
    const hash = new URLSearchParams(hashText.replace(/^#/, ''))
    ref = hash.get('ref') ?? ''
    token = hash.get('token') ?? ''
  } catch {
    ref = ''
    token = ''
  }
  if (!ref || !token) {
    const search = new URLSearchParams(searchText)
    ref = ref || (search.get('ref') ?? '')
    token = token || (search.get('token') ?? '')
  }
  return ref && token ? { ref, token } : null
}

function returnHash(params: GiftParams): string {
  return `#ref=${encodeURIComponent(params.ref)}&token=${encodeURIComponent(params.token)}`
}

function newRequestKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `gift-${crypto.randomUUID()}`
  }
  return `gift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function checkoutHash(checkoutUrl: string | null | undefined): string | null {
  if (!checkoutUrl) return null
  const index = checkoutUrl.indexOf('#')
  return index >= 0 ? checkoutUrl.slice(index) : null
}

function GiftFrame({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">{title}</span>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">{children}</main>
    </div>
  )
}

function InvalidLink() {
  const { t } = useTranslation()
  return (
    <GiftFrame title={t('gift.returnTitle')}>
      <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
        <h1 className="text-xl font-semibold">{t('gift.invalidLink')}</h1>
      </section>
    </GiftFrame>
  )
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'gift.pendingTitle',
  paid: 'gift.paidTitle',
  failed: 'gift.failedTitle',
  expired: 'gift.expiredTitle',
  reconcile: 'gift.reconcileTitle',
}

export function GiftPurchase() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<{ offer: GiftOfferOut; key: string } | null>(null)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')

  const shopQuery = useQuery<GiftShopOut>({
    queryKey: ['gift-shop', slug],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get(`/public/gifts/${encodeURIComponent(slug)}`)
      return data
    },
  })

  const purchase = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('No offer selected')
      const payload: GiftPurchaseIn = {
        offer_id: selected.offer.id,
        client_request_id: selected.key,
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        recipient_name: recipientName.trim() || null,
        recipient_email: recipientEmail.trim() || null,
        message: message.trim() || null,
        processing_consent: consent,
      }
      const { data } = await api.post<GiftOrderOut>(
        `/public/gifts/${encodeURIComponent(slug)}/orders`,
        payload,
      )
      return data
    },
    onSuccess: (order) => {
      const hash = checkoutHash(order.checkout_url)
      if (!hash) {
        setError(t('gift.purchaseError'))
        return
      }
      navigate(`/gift/checkout${hash}`)
    },
    onError: (mutationError) => setError(apiErrorMessage(mutationError, t('gift.purchaseError'))),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    purchase.mutate()
  }

  const shop = shopQuery.data

  if (shopQuery.isLoading) {
    return (
      <GiftFrame title={t('gift.shopTitle')}>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </GiftFrame>
    )
  }

  if (shopQuery.isError) {
    const missing = apiErrorStatus(shopQuery.error) === 404
    return (
      <GiftFrame title={t('gift.shopTitle')}>
        <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <h1 className="text-xl font-semibold">
            {missing ? t('gift.shopTitle') : t('gift.loadError')}
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-gray-400">
            {missing ? t('gift.invalidLink') : apiErrorMessage(shopQuery.error, t('gift.loadError'))}
          </p>
        </section>
      </GiftFrame>
    )
  }

  if (!shop) return null
  const offers = shop.offers ?? []

  return (
    <GiftFrame title={shop.business_name}>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        <h1 className="text-2xl font-bold">{t('gift.shopTitle')}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{t('gift.shopSubtitle')}</p>
        {!shop.payments_available && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {t('gift.paymentsUnavailable')}
          </p>
        )}

        {offers.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500 dark:text-gray-400">{t('gift.noOffersPublic')}</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {offers.map((offer) => (
              <li key={offer.id} className="flex flex-col rounded-xl border border-slate-200 p-4 dark:border-gray-700">
                <p className="font-semibold">{offer.name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                  {offer.kind === 'money' ? t('gift.kindMoney') : t('gift.kindPackage')}
                </p>
                {offer.description && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">{offer.description}</p>
                )}
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-gray-400">{t('gift.price')}</dt>
                    <dd className="font-medium">{formatCurrency(offer.price, shop.currency as Currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-gray-400">
                      {offer.kind === 'money' ? t('gift.faceValue') : t('gift.visitsCount')}
                    </dt>
                    <dd className="font-medium">
                      {offer.kind === 'money'
                        ? formatCurrency(offer.face_value ?? 0, shop.currency as Currency)
                        : `${offer.visits_count} ${t('gift.visitsUnit')}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-gray-400">{t('gift.validityDays')}</dt>
                    <dd className="font-medium">{offer.validity_days}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  disabled={!shop.payments_available}
                  onClick={() => {
                    setSelected({ offer, key: newRequestKey() })
                    setError('')
                  }}
                  className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('gift.buy')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gift-purchase-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="gift-purchase-title" className="text-lg font-bold">
                  {selected.offer.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                  {formatCurrency(selected.offer.price, shop.currency as Currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                {t('gift.close')}
              </button>
            </div>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('gift.buyerName')}</span>
                <input
                  required
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('gift.buyerEmail')}</span>
                <input
                  required
                  type="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t('gift.recipientName')}</span>
                  <input
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">{t('gift.recipientEmail')}</span>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(event) => setRecipientEmail(event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">{t('gift.message')}</span>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  required
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>{t('gift.consent')}</span>
              </label>
              {error && (
                <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={purchase.isPending}
                className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {t('gift.continue')}
              </button>
            </form>
          </div>
        </div>
      )}
    </GiftFrame>
  )
}

export function GiftCheckout() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [params] = useState(() => readGiftParams(location))
  const [error, setError] = useState('')

  const orderQuery = useQuery<GiftOrderOut>({
    queryKey: ['gift-order', params?.ref],
    enabled: Boolean(params),
    retry: false,
    queryFn: async () => {
      const { data } = await api.get(`/public/gifts/orders/${encodeURIComponent(params!.ref)}`, {
        headers: { 'X-Gift-Token': params!.token },
      })
      return data
    },
  })

  const finish = useMutation({
    mutationFn: async (outcome: 'paid' | 'failed') => {
      const { data } = await api.post<GiftOrderOut>(
        `/public/gifts/orders/${encodeURIComponent(params!.ref)}/sandbox`,
        { outcome },
        { headers: { 'X-Gift-Token': params!.token } },
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['gift-order', params?.ref] })
      if (params) navigate({ pathname: '/gift/return', hash: returnHash(params) })
    },
    onError: (mutationError) => setError(apiErrorMessage(mutationError, t('gift.loadError'))),
  })

  if (!params) return <InvalidLink />

  if (orderQuery.isLoading) {
    return (
      <GiftFrame title={t('gift.checkoutTitle')}>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </GiftFrame>
    )
  }

  if (orderQuery.isError) {
    if (apiErrorStatus(orderQuery.error) === 404) return <InvalidLink />
    return (
      <GiftFrame title={t('gift.checkoutTitle')}>
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {apiErrorMessage(orderQuery.error, t('gift.loadError'))}
        </section>
      </GiftFrame>
    )
  }

  const order = orderQuery.data
  if (!order) return null
  const settled = order.status !== 'pending'
  const holdUntil = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(order.hold_expires_at))

  return (
    <GiftFrame title={t('gift.checkoutTitle')}>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('gift.checkoutTitle')}</h1>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {t('gift.sandboxBadge')}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{t('gift.checkoutText')}</p>

        <dl className="mt-5 divide-y divide-slate-100 text-sm dark:divide-gray-700">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('gift.name')}</dt>
            <dd className="text-right font-medium">{order.offer_name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('gift.recipient')}</dt>
            <dd className="text-right font-medium">{order.recipient_name}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('gift.price')}</dt>
            <dd className="text-right font-medium">
              {formatCurrency(order.amount, order.currency as Currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('gift.payBefore')}</dt>
            <dd className="text-right font-medium">{holdUntil}</dd>
          </div>
        </dl>

        <p className="mt-3 text-sm text-slate-500 dark:text-gray-400" role="status">
          {t(STATUS_KEYS[order.status] ?? 'gift.pendingTitle')}
        </p>

        {settled ? (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm dark:bg-gray-700">
            <p>{t('gift.alreadySettled')}</p>
            <a
              href={`/gift/return${returnHash(params)}`}
              className="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              {t('gift.checkAgain')}
            </a>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={finish.isPending}
              onClick={() => finish.mutate('paid')}
              className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {t('gift.pay')}
            </button>
            <button
              type="button"
              disabled={finish.isPending}
              onClick={() => finish.mutate('failed')}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {t('gift.fail')}
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}
      </section>
    </GiftFrame>
  )
}

function CertificateCard({ certificate, onCopy }: { certificate: GiftCertificateOut; onCopy: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            {t('gift.code')}
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-wider text-emerald-900 dark:text-emerald-100">
            {certificate.code ?? `•••• ${certificate.code_last4}`}
          </p>
        </div>
        {certificate.code && (
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900"
          >
            {t('gift.copy')}
          </button>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-emerald-700 dark:text-emerald-300">
            {certificate.kind === 'money' ? t('gift.balance') : t('gift.visitsLeft')}
          </dt>
          <dd className="font-semibold text-emerald-900 dark:text-emerald-100">
            {certificate.kind === 'money'
              ? formatCurrency(certificate.money_balance, certificate.currency as Currency)
              : `${certificate.visits_remaining} / ${certificate.visits_total}`}
          </dd>
        </div>
        <div>
          <dt className="text-emerald-700 dark:text-emerald-300">{t('gift.validUntil')}</dt>
          <dd className="font-semibold text-emerald-900 dark:text-emerald-100">
            {new Date(certificate.expires_at).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="text-emerald-700 dark:text-emerald-300">{t('gift.recipient')}</dt>
          <dd className="font-semibold text-emerald-900 dark:text-emerald-100">{certificate.recipient_name}</dd>
        </div>
        <div>
          <dt className="text-emerald-700 dark:text-emerald-300">{t('gift.issuedBy')}</dt>
          <dd className="font-semibold text-emerald-900 dark:text-emerald-100">{certificate.issuer_name}</dd>
        </div>
      </dl>
      {certificate.message && (
        <p className="mt-3 rounded-lg bg-white/60 p-3 text-sm text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
          {certificate.message}
        </p>
      )}
    </div>
  )
}

export function GiftReturn() {
  const { t } = useTranslation()
  const location = useLocation()
  const [params] = useState(() => readGiftParams(location))
  const [copied, setCopied] = useState(false)
  const attempts = useRef(0)

  const orderQuery = useQuery<GiftOrderOut>({
    queryKey: ['gift-order', params?.ref],
    enabled: Boolean(params),
    retry: false,
    queryFn: async () => {
      attempts.current += 1
      const { data } = await api.get(`/public/gifts/orders/${encodeURIComponent(params!.ref)}`, {
        headers: { 'X-Gift-Token': params!.token },
      })
      return data
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return (!status || status === 'pending') && attempts.current < 30 ? 2000 : false
    },
  })

  if (!params) return <InvalidLink />

  if (orderQuery.isLoading) {
    return (
      <GiftFrame title={t('gift.returnTitle')}>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </GiftFrame>
    )
  }

  if (orderQuery.isError) {
    if (apiErrorStatus(orderQuery.error) === 404) return <InvalidLink />
    return (
      <GiftFrame title={t('gift.returnTitle')}>
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <p>{apiErrorMessage(orderQuery.error, t('gift.loadError'))}</p>
          <button
            type="button"
            onClick={() => {
              attempts.current = 0
              void orderQuery.refetch()
            }}
            className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
          >
            {t('gift.checkAgain')}
          </button>
        </section>
      </GiftFrame>
    )
  }

  const order = orderQuery.data
  if (!order) return null

  const paid = order.status === 'paid'
  const failed = order.status === 'failed'
  const expired = order.status === 'expired'
  const review = order.status === 'reconcile'

  const title = paid
    ? t('gift.paidTitle')
    : failed
      ? t('gift.failedTitle')
      : expired
        ? t('gift.expiredTitle')
        : review
          ? t('gift.reconcileTitle')
          : t('gift.pendingTitle')
  const text = paid
    ? t('gift.paidText')
    : failed
      ? t('gift.failedText')
      : expired
        ? t('gift.expiredText')
        : review
          ? t('gift.reconcileText')
          : t('gift.pendingText')

  return (
    <GiftFrame title={t('gift.returnTitle')}>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400" role="status">{text}</p>

        <p className="mt-4 text-sm">
          <span className="text-slate-500 dark:text-gray-400">{t('gift.name')}: </span>
          <span className="font-medium">{order.offer_name}</span>
          <span className="ml-2 text-slate-500 dark:text-gray-400">
            {formatCurrency(order.amount, order.currency as Currency)}
          </span>
        </p>

        {paid && order.certificate && (
          <CertificateCard
            certificate={order.certificate}
            onCopy={() => {
              if (!order.certificate?.code) return
              void navigator.clipboard
                .writeText(order.certificate.code)
                .then(() => {
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 2000)
                })
                .catch(() => setCopied(false))
            }}
          />
        )}
        {paid && copied && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{t('gift.copied')}</p>}

        {(order.status === 'pending' || review) && (
          <button
            type="button"
            disabled={orderQuery.isFetching}
            onClick={() => {
              attempts.current = 0
              void orderQuery.refetch()
            }}
            className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {t('gift.checkAgain')}
          </button>
        )}
      </section>
    </GiftFrame>
  )
}
