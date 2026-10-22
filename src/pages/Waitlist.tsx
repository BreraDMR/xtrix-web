import { fetchAllServices } from '../api/services'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import QueryError from '../components/QueryError'
import TablePagination from '../components/TablePagination'
import { INTL_LOCALE } from '../components/booking/intl'
import { useTranslation } from '../hooks/useTranslation'
import type { TranslationKey } from '../i18n/translations'
import type { ServiceOut, WaitlistEntryOut, WaitlistPage } from '../api/types'

const STATUS_KEYS: Record<string, TranslationKey> = {
  active: 'waitlist.status.active',
  cancelled: 'waitlist.status.cancelled',
  fulfilled: 'waitlist.status.fulfilled',
  pending: 'waitlist.offer.pending',
  accepted: 'waitlist.offer.accepted',
  declined: 'waitlist.offer.declined',
  expired: 'waitlist.offer.expired',
  conflict: 'waitlist.offer.conflict',
}

const TIME_KEYS: Record<string, TranslationKey> = {
  any: 'booking.waitlist.timeAny',
  morning: 'booking.waitlist.timeMorning',
  afternoon: 'booking.waitlist.timeAfternoon',
  evening: 'booking.waitlist.timeEvening',
}

const statusClass: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  fulfilled: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300',
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  declined: 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300',
  expired: 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300',
  conflict: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
}

function formatDateTime(value: string, locale: 'en' | 'ru' | 'cz', timeZone?: string) {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(value))
}

function formatDateRange(entry: WaitlistEntryOut, locale: 'en' | 'ru' | 'cz') {
  const formatter = new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: 'medium', timeZone: 'UTC' })
  const from = formatter.format(new Date(`${entry.preferred_date_from}T00:00:00Z`))
  if (!entry.preferred_date_to) return from
  const to = formatter.format(new Date(`${entry.preferred_date_to}T00:00:00Z`))
  return `${from} – ${to}`
}

export default function Waitlist() {
  const { t, locale } = useTranslation()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState('active')
  const [serviceId, setServiceId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [actionError, setActionError] = useState<unknown>(null)

  const servicesQuery = useQuery<ServiceOut[]>({
    queryKey: ['services'],
    queryFn: ({ signal }) => fetchAllServices(signal),
  })

  const filters = useMemo(
    () => ({
      status: status || undefined,
      service_id: serviceId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [status, serviceId, dateFrom, dateTo],
  )

  const listQuery = useQuery<WaitlistPage>({
    queryKey: ['waitlist', filters, page, perPage],
    queryFn: async () => {
      const { data } = await api.get<WaitlistPage>('/waitlist', {
        params: { ...filters, page, per_page: perPage },
      })
      return data
    },
    retry: false,
  })

  const cancelEntry = useMutation({
    mutationFn: async (entryId: number) => {
      const { data } = await api.post<WaitlistEntryOut>(`/waitlist/${entryId}/cancel`)
      return data
    },
    onSuccess: () => {
      setActionError(null)
      void queryClient.invalidateQueries({ queryKey: ['waitlist'] })
    },
    onError: (error) => setActionError(error),
  })

  const resetPage = () => setPage(1)
  const selectClass =
    'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
  const items = listQuery.data?.items ?? []

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">{t('waitlist.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('waitlist.subtitle')}</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t('waitlist.filter.status')}</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                resetPage()
              }}
              className={`w-full ${selectClass}`}
            >
              <option value="">{t('waitlist.status.all')}</option>
              <option value="active">{t('waitlist.status.active')}</option>
              <option value="fulfilled">{t('waitlist.status.fulfilled')}</option>
              <option value="cancelled">{t('waitlist.status.cancelled')}</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t('waitlist.filter.service')}</span>
            <select
              disabled={servicesQuery.isLoading || servicesQuery.isError}
              value={serviceId}
              onChange={(event) => {
                setServiceId(event.target.value)
                resetPage()
              }}
              className={`w-full ${selectClass}`}
            >
              <option value="">{t('waitlist.filter.anyService')}</option>
              {(servicesQuery.data ?? []).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t('waitlist.filter.dateFrom')}</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                resetPage()
              }}
              className={`w-full ${selectClass}`}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t('waitlist.filter.dateTo')}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                resetPage()
              }}
              className={`w-full ${selectClass}`}
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setStatus('active')
                setServiceId('')
                setDateFrom('')
                setDateTo('')
                resetPage()
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {t('waitlist.filter.reset')}
            </button>
          </div>
        </div>
      </section>

      {actionError != null && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {apiErrorMessage(actionError, t('common.error'))}
        </div>
      )}

      {servicesQuery.isError && <QueryError retry={servicesQuery.refetch} />}
      {listQuery.isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : listQuery.isError ? (
        <QueryError retry={listQuery.refetch} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {t('waitlist.empty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-gray-700">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('waitlist.table.guest')}</th>
                  <th className="px-4 py-3 font-medium">{t('waitlist.table.preferences')}</th>
                  <th className="px-4 py-3 font-medium">{t('waitlist.table.offer')}</th>
                  <th className="px-4 py-3 font-medium">{t('waitlist.table.created')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('waitlist.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {items.map((entry) => (
                  <tr key={entry.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">{entry.full_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{entry.email}</p>
                      {entry.phone && (
                        <p className="text-xs text-slate-500 dark:text-gray-400">{entry.phone}</p>
                      )}
                      <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[entry.status] ?? statusClass.cancelled}`}>
                        {t(STATUS_KEYS[entry.status] ?? 'waitlist.status.cancelled')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{entry.service_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">
                        {entry.specialist_name || t('booking.anyMaster')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                        {formatDateRange(entry, locale)} · {t(TIME_KEYS[entry.time_preference] ?? 'booking.waitlist.timeAny')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {entry.latest_offer ? (
                        <>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[entry.latest_offer.status] ?? statusClass.cancelled}`}>
                            {t(STATUS_KEYS[entry.latest_offer.status] ?? 'waitlist.offer.expired')}
                          </span>
                          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                            {formatDateTime(entry.latest_offer.start, locale)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            {t('waitlist.table.expires')}: {formatDateTime(entry.latest_offer.expires_at, locale)}
                          </p>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-gray-500">{t('waitlist.table.noOffer')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-gray-400">
                      {formatDateTime(entry.created_at, locale)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.status === 'active' && (
                        <button
                          type="button"
                          disabled={cancelEntry.isPending}
                          onClick={() => {
                            if (window.confirm(t('waitlist.cancelConfirm'))) {
                              cancelEntry.mutate(entry.id)
                            }
                          }}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                        >
                          {t('waitlist.cancel')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={page}
            totalPages={listQuery.data?.pages ?? 1}
            totalItems={listQuery.data?.total ?? 0}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value)
              setPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}
