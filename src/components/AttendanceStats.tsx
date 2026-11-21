import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import { dayEnd, dayStart } from '../utils/dates'
import LoadingSpinner from './LoadingSpinner'
import QueryError from './QueryError'
import type { Schema } from '../api/types'

const percent = (rate: number | null | undefined) => (rate === null || rate === undefined ? '—' : `${(rate * 100).toFixed(1)} %`)

// no-shows and late cancels for the picked period, overall and per specialist
export default function AttendanceStats({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['visit-attendance', dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (dateFrom) params.date_from = dayStart(dateFrom)
      if (dateTo) params.date_to = dayEnd(dateTo)
      const { data } = await api.get<Schema<'VisitStatisticsResponse'>>('/analytics/visits/statistics', { params })
      return data.attendance
    },
  })

  return (
    <section aria-label={t('analytics.attendanceTitle')} className="ui-card overflow-x-auto rounded-lg">
      <h3 className="border-b border-[var(--workspace-line)] p-4 text-xl font-semibold text-[var(--workspace-ink)]">
        {t('analytics.attendanceTitle')}
      </h3>
      {isLoading ? (
        <div className="p-4"><LoadingSpinner /></div>
      ) : isError || !data ? (
        <div className="p-4"><QueryError retry={refetch} /></div>
      ) : (
        <div className="space-y-4 p-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-[var(--workspace-bg)] p-3">
              <dt className="text-xs text-[var(--workspace-muted)]">{t('analytics.noShowCount')}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-[var(--workspace-ink)]">{data.no_show}</dd>
            </div>
            <div className="rounded-lg bg-[var(--workspace-bg)] p-3">
              <dt className="text-xs text-[var(--workspace-muted)]">{t('analytics.noShowRate')}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-[var(--workspace-ink)]">{percent(data.no_show_rate)}</dd>
              <dd className="text-xs text-[var(--workspace-muted)]">{t('analytics.noShowRateHint')}</dd>
            </div>
            <div className="rounded-lg bg-[var(--workspace-bg)] p-3">
              <dt className="text-xs text-[var(--workspace-muted)]">{t('analytics.lateCancelCount')}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-[var(--workspace-ink)]">{data.late_cancel}</dd>
            </div>
          </dl>
          {data.no_show === 0 && data.late_cancel === 0 ? (
            <p className="text-sm text-[var(--workspace-muted)]">{t('analytics.attendanceEmpty')}</p>
          ) : (
            <table className="min-w-full text-sm">
              <caption className="pb-2 text-left font-medium text-[var(--workspace-ink)]">{t('analytics.attendanceBySpecialist')}</caption>
              <thead>
                <tr className="text-left text-xs uppercase text-[var(--workspace-muted)]">
                  <th scope="col" className="py-2 pr-4">{t('analytics.specialist')}</th>
                  <th scope="col" className="py-2 pr-4">{t('analytics.noShowCount')}</th>
                  <th scope="col" className="py-2 pr-4">{t('analytics.noShowRate')}</th>
                  <th scope="col" className="py-2">{t('analytics.lateCancelCount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--workspace-line)]">
                {(data.by_specialist ?? []).map((row) => (
                  <tr key={row.specialist_id}>
                    <td className="py-2 pr-4 text-[var(--workspace-ink)]">{row.specialist_name || `#${row.specialist_id}`}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.no_show}</td>
                    <td className="py-2 pr-4 tabular-nums">{percent(row.no_show_rate)}</td>
                    <td className="py-2 tabular-nums">{row.late_cancel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  )
}
