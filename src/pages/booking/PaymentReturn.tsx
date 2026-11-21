import { useRef, useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import PublicShell from '../../components/public/PublicShell'
import LoadingSpinner from '../../components/LoadingSpinner'
import { INTL_LOCALE } from '../../components/booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type { PublicPaymentStatusOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'
import StatusBadge from '../../ui/StatusBadge'

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
  return <PublicShell title={title}>{children}</PublicShell>
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

function PaymentStatus({ status }: { status: string }) {
  const { t } = useTranslation()
  const tone = PAID_STATUSES.has(status) ? 'success' : FAILED_STATUSES.has(status) ? 'neutral' : 'warning'
  return (
    <StatusBadge tone={tone} className="px-3 py-1">
      {t(statusKey(status))}
    </StatusBadge>
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
    <dl className="mt-5 divide-y divide-[var(--workspace-line)] text-sm">
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-[var(--workspace-muted)]">{t('booking.service')}</dt>
        <dd className="text-right font-medium">{payment.service_name}</dd>
      </div>
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-[var(--workspace-muted)]">{t('booking.dateTime')}</dt>
        <dd className="text-right font-medium">
          {when}
          <span className="mt-1 block text-xs font-normal text-[var(--workspace-muted)]">{payment.timezone}</span>
        </dd>
      </div>
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-[var(--workspace-muted)]">{t('payment.deposit')}</dt>
        <dd className="text-right font-medium">
          {formatCurrency(payment.amount, payment.currency as Currency)}
        </dd>
      </div>
      <div className="flex justify-between gap-4 py-3">
        <dt className="text-[var(--workspace-muted)]">{t('payment.remaining')}</dt>
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
      <section className="ui-card p-8 text-center">
        <h1 className="text-xl font-semibold">{t('payment.invalidLink')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-[var(--workspace-muted)]">
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
        <section role="alert" className="rounded-2xl border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] p-6 text-[var(--tint-red-ink)]">
          <p>{apiErrorMessage(paymentQuery.error, t('payment.loadError'))}</p>
          <button
            type="button"
            onClick={() => {
              attempts.current = 0
              void paymentQuery.refetch()
            }}
            className="mt-3 rounded-md border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] px-4 py-2 text-sm font-medium hover:bg-[color-mix(in_srgb,var(--tint-red-ink)_12%,var(--tint-red))]"
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
      <section className="ui-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          <PaymentStatus status={payment.status} />
        </div>
        <p className="mt-2 text-sm text-[var(--workspace-muted)]" role="status">{text}</p>

        <PaymentDetails payment={payment} />

        {pending && (
          <>
            <p className="mt-4 rounded-lg bg-[var(--tint-amber)] p-3 text-sm text-[var(--tint-amber-ink)]">
              {t('payment.waitingHint')}
            </p>
            <button
              type="button"
              disabled={paymentQuery.isFetching}
              onClick={() => {
                attempts.current = 0
                void paymentQuery.refetch()
              }}
              className="mt-4 ui-button ui-button-primary disabled:opacity-60"
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
        <section role="alert" className="rounded-2xl border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] p-6 text-[var(--tint-red-ink)]">
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
      <section className="ui-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('payment.sandboxTitle')}</h1>
          <StatusBadge tone="info" className="px-3 py-1">
            {t('payment.sandboxBadge')}
          </StatusBadge>
        </div>
        <p className="mt-2 text-sm text-[var(--workspace-muted)]">{t('payment.sandboxText')}</p>

        <PaymentDetails payment={payment} />
        <div className="mt-3">
          <PaymentStatus status={payment.status} />
        </div>

        {settled ? (
          <div className="mt-5 rounded-lg bg-[var(--workspace-fill)] p-4 text-sm">
            <p>{t('payment.alreadySettled')}</p>
            <a
              href={`/payment/return${returnHash(params)}`}
              className="mt-3 inline-block ui-button ui-button-primary"
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
              className="ui-button ui-button-primary disabled:opacity-60"
            >
              {finish.isPending
                ? t('payment.sandboxSending')
                : t('payment.sandboxPay').replace('{amount}', formatCurrency(payment.amount, payment.currency as Currency))}
            </button>
            <button
              type="button"
              disabled={finish.isPending}
              onClick={() => finish.mutate('failed')}
              className="ui-button ui-button-secondary disabled:opacity-60"
            >
              {t('payment.sandboxFail')}
            </button>
          </div>
        )}

        {finish.isError && (
          <p role="alert" className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] p-3 text-sm text-[var(--tint-red-ink)]">
            {apiErrorMessage(finish.error, t('payment.loadError'))}
          </p>
        )}
      </section>
    </PublicFrame>
  )
}
