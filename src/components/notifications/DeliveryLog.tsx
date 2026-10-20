import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import LoadingSpinner from '../LoadingSpinner'
import Select from '../../ui/Select'
import { INTL_LOCALE } from '../booking/intl'
import { useTranslation } from '../../hooks/useTranslation'
import type {
  NotificationDeliveryOut,
  NotificationDeliveryPage,
} from '../../api/types'
import type { TranslationKey } from '../../i18n/translations'

const STATUSES = ['pending', 'processing', 'sent', 'captured', 'skipped', 'failed', 'cancelled'] as const

const STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'notifications.delivery.status.pending',
  processing: 'notifications.delivery.status.processing',
  sent: 'notifications.delivery.status.sent',
  captured: 'notifications.delivery.status.captured',
  skipped: 'notifications.delivery.status.skipped',
  failed: 'notifications.delivery.status.failed',
  cancelled: 'notifications.delivery.status.cancelled',
}

const KIND_KEYS: Record<string, TranslationKey> = {
  booking_created: 'notifications.delivery.kind.created',
  booking_changed: 'notifications.delivery.kind.changed',
  booking_cancelled: 'notifications.delivery.kind.cancelled',
  booking_reminder: 'notifications.delivery.kind.reminder',
}

const statusClass = (status: string) => {
  if (status === 'sent') {
    return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
  }
  if (status === 'failed') {
    return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
  }
  if (status === 'pending' || status === 'processing') {
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
  }
  if (status === 'captured') {
    return 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

export default function DeliveryLog() {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const deliveries = useQuery<NotificationDeliveryPage>({
    queryKey: ['notification-deliveries', status, page],
    queryFn: async () => {
      const { data } = await api.get('/businesses/me/notification-deliveries', {
        params: { page, per_page: 10, ...(status ? { status } : {}) },
      })
      return data
    },
    retry: false,
  })

  const retry = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<NotificationDeliveryOut>(
        `/businesses/me/notification-deliveries/${id}/retry`,
      )
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notification-deliveries'] })
    },
  })

  const kindLabel = (kind: string) => {
    const key = KIND_KEYS[kind]
    return key ? t(key) : kind
  }

  const statusLabel = (value: string) => {
    const key = STATUS_KEYS[value]
    return key ? t(key) : value
  }

  const data = deliveries.data

  return (
    <section
      aria-labelledby="delivery-log-title"
      className="rounded-lg bg-white p-6 shadow dark:bg-gray-800"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="delivery-log-title" className="text-lg font-semibold">
            {t('notifications.delivery.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('notifications.delivery.description')}
          </p>
        </div>
        <div>
          <label htmlFor="delivery-status" className="sr-only">
            {t('notifications.delivery.statusFilter')}
          </label>
          <Select
            id="delivery-status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
            className="w-44"
          >
            <option value="">{t('notifications.delivery.allStatuses')}</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {retry.isSuccess && (
        <p
          role="status"
          className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {t('notifications.delivery.retryQueued')}
        </p>
      )}
      {retry.isError && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
        >
          {apiErrorMessage(retry.error, t('notifications.delivery.retryError'))}
        </p>
      )}

      {deliveries.isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : deliveries.isError ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <p>{t('notifications.delivery.loadError')}</p>
          <button
            type="button"
            onClick={() => void deliveries.refetch()}
            className="mt-2 rounded-md border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : data ? (
        <>
          {data.items.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              {t('notifications.delivery.empty')}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
              {data.items.map((row) => (
                <li key={row.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{kindLabel(row.kind)}</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(row.created_at).toLocaleString(INTL_LOCALE[locale])}
                        {' · '}
                        {t('notifications.delivery.recipient')}: {row.recipient}
                        {' · '}
                        {t('notifications.delivery.attempts')}: {row.attempts}
                      </p>
                      {row.last_error && (
                        <p
                          className="mt-1 break-words text-xs text-red-700 dark:text-red-300"
                          title={row.last_error}
                        >
                          {t('notifications.delivery.error')}: {row.last_error}
                        </p>
                      )}
                    </div>
                    {row.retryable && (
                      <button
                        type="button"
                        disabled={retry.isPending}
                        onClick={() => retry.mutate(row.id)}
                        className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
                      >
                        {retry.isPending && retry.variables === row.id
                          ? t('notifications.delivery.retrying')
                          : t('notifications.delivery.retry')}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {data.pages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {t('notifications.delivery.previous')}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('notifications.delivery.page')} {data.page} / {data.pages}
              </span>
              <button
                type="button"
                disabled={page >= data.pages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {t('notifications.delivery.next')}
              </button>
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}
