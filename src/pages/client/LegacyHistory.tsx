import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import api from '../../api/client'
import { apiErrorStatus } from '../../api/errors'
import ClientShell from '../../components/client/ClientShell'
import { INTL_LOCALE } from '../../components/booking/intl'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import type { ClientHistoryResponse } from '../../api/types'

const STATUS_KEYS: Record<string, TranslationKey> = {
  planned: 'bookingManage.status.planned',
  completed: 'bookingManage.status.completed',
  cancelled: 'bookingManage.status.cancelled',
  in_progress: 'bookingManage.status.in_progress',
}

interface HistoryVisit {
  id: number | null
  start: string
  serviceName: string
  status: string
}

function historyVisits(response: ClientHistoryResponse): HistoryVisit[] {
  return response.visits.map((row) => ({
    id: typeof row.id === 'number' ? row.id : null,
    start: typeof row.date_start === 'string' ? row.date_start : '',
    serviceName: typeof row.service_name === 'string' ? row.service_name : '',
    status: typeof row.status === 'string' ? row.status : '',
  }))
}

export default function LegacyHistory() {
  const { t, locale } = useTranslation()
  const [searchParams] = useSearchParams()
  const [qr, setQr] = useState(() => (searchParams.get('qr') ?? '').trim())
  const [pin, setPin] = useState('')
  const [history, setHistory] = useState<ClientHistoryResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setHistory(null)
    if (!qr.trim() || pin.trim().length < 4) return
    setLoading(true)
    try {
      const { data } = await api.post<ClientHistoryResponse>('/clients/qr-code/access', {
        qr_code_data: qr.trim(),
        password: pin.trim(),
      })
      setHistory(data)
      setPin('')
    } catch (err) {
      setError(apiErrorStatus(err) === 429 ? t('legacy.locked') : t('legacy.invalid'))
    } finally {
      setLoading(false)
    }
  }

  const visits = history ? historyVisits(history) : []

  return (
    <ClientShell title={t('legacy.title')}>
      <section className="ui-card space-y-5 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('legacy.title')}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">{t('legacy.subtitle')}</p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div>
            <label htmlFor="legacy-qr" className="mb-2 block text-sm font-medium">
              {t('legacy.qr')}
            </label>
            <textarea
              id="legacy-qr"
              value={qr}
              onChange={(event) => {
                setQr(event.target.value)
                setHistory(null)
                setError('')
              }}
              rows={2}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{t('legacy.qrHint')}</p>
          </div>
          <div>
            <label htmlFor="legacy-pin" className="mb-2 block text-sm font-medium">
              {t('legacy.pin')}
            </label>
            <input
              id="legacy-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              minLength={4}
              maxLength={6}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              required
              className="w-full max-w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 tracking-widest text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !qr.trim() || pin.trim().length < 4}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>{t('legacy.showing')}</span>
              </>
            ) : (
              t('legacy.show')
            )}
          </button>
        </form>

        <Link to="/client/portal" className="inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          {t('legacy.back')}
        </Link>
      </section>

      {!qr.trim() && <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">{t('legacy.missingCode')}</p>}

      {history && (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('legacy.client')}</p>
              <h2 className="text-xl font-semibold">{history.client_name}</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {t('legacy.visits')}: {history.total_visits}
            </p>
          </div>
          {visits.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">{t('legacy.noVisits')}</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100 text-sm dark:divide-gray-700">
              {visits.map((visit, index) => {
                const key = STATUS_KEYS[visit.status]
                const when = visit.start
                  ? new Intl.DateTimeFormat(INTL_LOCALE[locale], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(visit.start))
                  : ''
                return (
                  <li key={visit.id ?? index} className="flex flex-wrap justify-between gap-2 py-3">
                    <span className="font-medium">{visit.serviceName || t('portal.visitNumber')}</span>
                    <span className="text-slate-500 dark:text-gray-400">
                      {when}
                      {visit.status && <span className="ml-2">{key ? t(key) : visit.status}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </ClientShell>
  )
}
