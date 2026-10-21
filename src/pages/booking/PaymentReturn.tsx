import { useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import LoadingSpinner from '../../components/LoadingSpinner'
import { INTL_LOCALE } from '../../components/booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type { PublicPaymentStatusOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

type PaymentParams = { ref: string; token: string }

function readPaymentParams(): PaymentParams | null {
  let ref = ''
  let token = ''
  try {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    ref = hash.get('ref') ?? ''
    token = hash.get('token') ?? ''
  } catch {
    ref = ''
    token = ''
  }
  if (!ref || !token) {
    const search = new URLSearchParams(window.location.search)
    ref = ref || (search.get('ref') ?? '')
    token = token || (search.get('token') ?? '')
  }
  return ref && token ? { ref, token } : null
}

function returnHash(params: PaymentParams): string {
  return `#ref=${encodeURIComponent(params.ref)}&token=${encodeURIComponent(params.token)}`
}

function PublicFrame({ children, title }: { children: ReactNode; title: string }) {
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

const STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'payment.status.pending',
  paid: 'payment.status.paid',
  failed: 'payment.status.failed',
  expired: 'payment.status.expired',
  cancelled: 'payment.status.cancelled',
  reconcile: 'payment.status.reconcile',
  partially_refunded: 'payment.status.partially_refunded',
  refunded: 'payment.status.refunded',
}

const PAID_STATUSES = new Set(['paid', 'partially_refunded', 'refunded'])
const FAILED_STATUSES = new Set(['failed', 'expired', 'cancelled'])

function statusKey(status: string): TranslationKey {
  return STATUS_KEYS[status] ?? 'payment.status.pending'
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation()
  const tone = PAID_STATUSES.has(status)
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : FAILED_STATUSES.has(status)
      ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {t(statusKey(status))}
    </span>
  )
}

function PaymentDetails({ payment }: { payment: PublicPaymentStatusOut }) {
  const { t, locale } = useTranslation()
  const when = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: payment.timezone,
  }).format(new Date(payment.visit_start))
  return (
    <dl className="mt-5 divide-y divide-slate-100 text-sm dark:divide-gray-700">
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-slate-500 dark:text-gray-400">{t('booking.service')}</dt>
        <dd className="text-right font-medium">{payment.service_name}</dd>
      </div>
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-slate-500 dark:text-gray-400">{t('booking.dateTime')}</dt>
        <dd className="text-right font-medium">
          {when}
          <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-gray-400">{payment.timezone}</span>
        </dd>
      </div>
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-slate-500 dark:text-gray-400">{t('payment.deposit')}</dt>
        <dd className="text-right font-medium">
          {formatCurrency(payment.amount, payment.currency as Currency)}
        </dd>
      </div>
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-slate-500 dark:text-gray-400">{t('payment.remaining')}</dt>
        <dd className="text-right font-medium">
          {formatCurrency(payment.remaining_amount, payment.currency as Currency)}
        </dd>
      </div>
    </dl>
  )
}

function InvalidLink() {
  const { t } = useTranslation()
  return (
    <PublicFrame title={t('payment.returnTitle')}>
      <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
        <h1 className="text-xl font-semibold">{t('payment.invalidLink')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-gray-400">
          {t('payment.invalidLinkText')}
        </p>
      </section>
    </PublicFrame>
  )
}

export default function PaymentReturn() {
  const { t } = useTranslation()
  const [params] = useState(readPaymentParams)
  const attempts = useRef(0)

  const paymentQuery = useQuery<PublicPaymentStatusOut>({
    queryKey: ['public-payment', params?.ref],
    enabled: Boolean(params),
    retry: false,
    queryFn: async () => {
      attempts.current += 1
      const { data } = await api.get<PublicPaymentStatusOut>(
        `/public/booking/payments/${encodeURIComponent(params!.ref)}`,
        { headers: { 'X-Payment-Token': params!.token } },
      )
      return data
    },
    // The provider's return URL is not proof of payment: keep asking the server.
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return (!status || status === 'pending') && attempts.current < 30 ? 2000 : false
    },
  })

  if (!params) return <InvalidLink />

  if (paymentQuery.isLoading) {
    return (
      <PublicFrame title={t('payment.returnTitle')}>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </PublicFrame>
    )
  }

  if (paymentQuery.isError) {
    const status = apiErrorStatus(paymentQuery.error)
    if (status === 404) return <InvalidLink />
    return (
      <PublicFrame title={t('payment.returnTitle')}>
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <p>{apiErrorMessage(paymentQuery.error, t('payment.loadError'))}</p>
          <button
            type="button"
            onClick={() => {
              attempts.current = 0
              void paymentQuery.refetch()
            }}
            className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
          >
            {t('payment.checkAgain')}
          </button>
        </section>
      </PublicFrame>
    )
  }

  const payment = paymentQuery.data
  if (!payment) return null

  const paid = PAID_STATUSES.has(payment.status)
  const failed = payment.status === 'failed'
  const expired = payment.status === 'expired'
  const cancelled = payment.status === 'cancelled'
  const review = payment.status === 'reconcile'
  const pending = payment.status === 'pending'

  const title = paid
    ? t('payment.paidTitle')
    : failed
      ? t('payment.failedTitle')
      : expired
        ? t('payment.expiredTitle')
        : cancelled
          ? t('payment.cancelledTitle')
          : review
            ? t('payment.reviewTitle')
            : t('payment.waitingTitle')
  const text = paid
    ? t('payment.paidText')
    : failed
      ? t('payment.failedText')
      : expired
        ? t('payment.expiredText')
        : cancelled
          ? t('payment.cancelledText')
          : review
            ? t('payment.reviewText')
            : t('payment.waitingText')

  return (
    <PublicFrame title={t('payment.returnTitle')}>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <StatusChip status={payment.status} />
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400" role="status">{text}</p>

        <PaymentDetails payment={payment} />

        {pending && (
          <>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {t('payment.waitingHint')}
            </p>
            <button
              type="button"
              disabled={paymentQuery.isFetching}
              onClick={() => {
                attempts.current = 0
                void paymentQuery.refetch()
              }}
              className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {t('payment.checkAgain')}
            </button>
          </>
        )}
      </section>
    </PublicFrame>
  )
}

export function SandboxCheckout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useState(readPaymentParams)

  const paymentQuery = useQuery<PublicPaymentStatusOut>({
    queryKey: ['public-payment', params?.ref],
    enabled: Boolean(params),
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<PublicPaymentStatusOut>(
        `/public/booking/payments/${encodeURIComponent(params!.ref)}`,
        { headers: { 'X-Payment-Token': params!.token } },
      )
      return data
    },
  })

  const finish = useMutation({
    mutationFn: async (outcome: 'paid' | 'failed') => {
      const { data } = await api.post<PublicPaymentStatusOut>(
        `/public/booking/payments/${encodeURIComponent(params!.ref)}/sandbox`,
        { outcome },
        { headers: { 'X-Payment-Token': params!.token } },
      )
      return data
    },
    onSuccess: () => {
      if (params) navigate({ pathname: '/payment/return', hash: returnHash(params) })
    },
  })

  if (!params) return <InvalidLink />

  if (paymentQuery.isLoading) {
    return (
      <PublicFrame title={t('payment.sandboxTitle')}>
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      </PublicFrame>
    )
  }

  if (paymentQuery.isError) {
    const status = apiErrorStatus(paymentQuery.error)
    if (status === 404) return <InvalidLink />
    return (
      <PublicFrame title={t('payment.sandboxTitle')}>
        <section role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <p>{apiErrorMessage(paymentQuery.error, t('payment.loadError'))}</p>
        </section>
      </PublicFrame>
    )
  }

  const payment = paymentQuery.data
  if (!payment) return null
  const settled = payment.status !== 'pending'

  return (
    <PublicFrame title={t('payment.sandboxTitle')}>
      <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('payment.sandboxTitle')}</h1>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {t('payment.sandboxBadge')}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{t('payment.sandboxText')}</p>

        <PaymentDetails payment={payment} />
        <div className="mt-3">
          <StatusChip status={payment.status} />
        </div>

        {settled ? (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm dark:bg-gray-700">
            <p>{t('payment.alreadySettled')}</p>
            <a
              href={`/payment/return${returnHash(params)}`}
              className="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              {t('payment.checkStatus')}
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
              {finish.isPending
                ? t('payment.sandboxSending')
                : t('payment.sandboxPay').replace('{amount}', formatCurrency(payment.amount, payment.currency as Currency))}
            </button>
            <button
              type="button"
              disabled={finish.isPending}
              onClick={() => finish.mutate('failed')}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {t('payment.sandboxFail')}
            </button>
          </div>
        )}

        {finish.isError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {apiErrorMessage(finish.error, t('payment.loadError'))}
          </p>
        )}
      </section>
    </PublicFrame>
  )
}
