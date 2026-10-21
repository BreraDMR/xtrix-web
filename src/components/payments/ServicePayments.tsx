import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import { INTL_LOCALE } from '../booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type { ServicePaymentOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

const STATUSES = [
  'pending',
  'paid',
  'reconcile',
  'partially_refunded',
  'refunded',
  'failed',
  'expired',
  'cancelled',
] as const

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

const REFUNDABLE = new Set(['paid', 'reconcile', 'partially_refunded'])

function newRefundKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `rf-${crypto.randomUUID()}`
  }
  return `rf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation()
  const tone = status === 'paid' || status === 'partially_refunded' || status === 'refunded'
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : status === 'pending' || status === 'reconcile'
      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {t(STATUS_KEYS[status] ?? 'payment.status.pending')}
    </span>
  )
}

export default function ServicePayments() {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [refundTarget, setRefundTarget] = useState<ServicePaymentOut | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [refundKey, setRefundKey] = useState('')
  const [notice, setNotice] = useState('')

  const paymentsQuery = useQuery<ServicePaymentOut[]>({
    queryKey: ['service-payments', status],
    queryFn: async () => {
      const { data } = await api.get<ServicePaymentOut[]>('/businesses/me/service-payments', {
        params: { status: status || undefined, limit: 100 },
      })
      return data
    },
    retry: false,
  })

  const refund = useMutation({
    mutationFn: async (payment: ServicePaymentOut) => {
      const trimmed = amount.trim().replace(',', '.')
      const { data } = await api.post(
        `/businesses/me/service-payments/${payment.id}/refunds`,
        {
          refund_key: refundKey,
          ...(trimmed ? { amount: Number(trimmed) } : {}),
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
      )
      return data
    },
    onSuccess: () => {
      setRefundTarget(null)
      setNotice(t('finance.servicePayments.done'))
      void queryClient.invalidateQueries({ queryKey: ['service-payments'] })
    },
  })

  const openRefund = (payment: ServicePaymentOut) => {
    setRefundTarget(payment)
    setAmount('')
    setReason('')
    setRefundKey(newRefundKey())
    setNotice('')
    refund.reset()
  }

  const closeRefund = () => {
    if (refund.isPending) return
    setRefundTarget(null)
    refund.reset()
  }

  const money = (value: number, payment: ServicePaymentOut) =>
    formatCurrency(value, payment.currency as Currency)

  const formatMoment = (value: string) =>
    new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

  if (paymentsQuery.isError) {
    if (apiErrorStatus(paymentsQuery.error) === 403) return null
    return (
      <section role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
        <p>{apiErrorMessage(paymentsQuery.error, t('finance.servicePayments.loadError'))}</p>
        <button
          type="button"
          onClick={() => void paymentsQuery.refetch()}
          className="mt-2 rounded-md border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
        >
          {t('common.retry')}
        </button>
      </section>
    )
  }

  const payments = paymentsQuery.data ?? []

  return (
    <section aria-labelledby="service-payments-title" className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="service-payments-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('finance.servicePayments.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('finance.servicePayments.subtitle')}
          </p>
        </div>
        <select
          aria-label={t('finance.servicePayments.filter')}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
        >
          <option value="">{t('finance.servicePayments.allStatuses')}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>{t(STATUS_KEYS[value])}</option>
          ))}
        </select>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          {notice}
        </p>
      )}

      {paymentsQuery.isLoading ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
      ) : payments.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t('finance.servicePayments.empty')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {payments.map((payment) => (
            <li key={payment.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{payment.client_name}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {payment.service_name} · {formatMoment(payment.visit_start)}
                  </p>
                </div>
                <StatusChip status={payment.status} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{t('finance.servicePayments.amount')}</dt>
                  <dd className="font-medium">{money(payment.amount, payment)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{t('finance.servicePayments.refunded')}</dt>
                  <dd className="font-medium">{money(payment.refunded_amount, payment)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">{t('finance.servicePayments.refundable')}</dt>
                  <dd className="font-medium">{money(payment.refundable_amount, payment)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">
                    {payment.status === 'pending'
                      ? t('finance.servicePayments.holdExpires')
                      : t('finance.servicePayments.visit')}
                  </dt>
                  <dd className="font-medium">
                    {payment.status === 'pending'
                      ? formatMoment(payment.hold_expires_at)
                      : payment.visit_status}
                  </dd>
                </div>
              </dl>

              {(payment.refunds?.length ?? 0) > 0 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{t('finance.servicePayments.refundsTitle')}: </span>
                  {(payment.refunds ?? []).map((row) => (
                    <span key={row.id} className="mr-3 inline-block">
                      {money(row.amount, payment)} · {formatMoment(row.created_at)}
                    </span>
                  ))}
                </div>
              )}

              {REFUNDABLE.has(payment.status) && payment.refundable_amount > 0 && (
                <button
                  type="button"
                  onClick={() => openRefund(payment)}
                  className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {t('finance.servicePayments.refund')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="refund-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 id="refund-title" className="text-lg font-semibold">{t('finance.servicePayments.refundTitle')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {refundTarget.client_name} · {money(refundTarget.refundable_amount, refundTarget)}
            </p>

            <label className="mt-4 block text-sm font-medium">
              {t('finance.servicePayments.amountLabel')}
              <input
                type="number"
                min="0.01"
                max={refundTarget.refundable_amount}
                step="0.01"
                value={amount}
                placeholder={refundTarget.refundable_amount.toFixed(2)}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setRefundKey(newRefundKey())
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('finance.servicePayments.amountHint')}</p>

            <label className="mt-3 block text-sm font-medium">
              {t('finance.servicePayments.reason')}
              <input
                type="text"
                maxLength={255}
                value={reason}
                placeholder={t('finance.servicePayments.reasonPlaceholder')}
                onChange={(event) => {
                  setReason(event.target.value)
                  setRefundKey(newRefundKey())
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
            </label>

            {refund.isError && (
              <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                {apiErrorMessage(refund.error, t('finance.servicePayments.error'))}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeRefund}
                disabled={refund.isPending}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {t('finance.servicePayments.cancel')}
              </button>
              <button
                type="button"
                onClick={() => refund.mutate(refundTarget)}
                disabled={refund.isPending}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {refund.isPending ? t('finance.servicePayments.submitting') : t('finance.servicePayments.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
