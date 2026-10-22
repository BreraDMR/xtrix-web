import { useEffect, useMemo, useState } from 'react'
import { HiOutlineChevronRight } from 'react-icons/hi'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/client'
import { allPages } from '../../api/allPages'
import type { EmployeeOut, Schema, VisitOut } from '../../api/types'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../hooks/useTranslation'
import { useWorkspaceAccessContext } from '../../hooks/useWorkspaceAccess'
import { useLabels } from '../../i18n/labels'
import { zonedDayKey, zonedWallTimeToIso } from '../../utils/dates'
import Button from '../../ui/Button'
import Card from '../../ui/Card'

interface TodayAgendaProps {
  timeZone: string
  onEdit: (id: number) => void
}

export default function TodayAgenda({ timeZone, onEdit }: TodayAgendaProps) {
  const { t, locale } = useTranslation()
  const labels = useLabels()
  const { user, token, sessionRevision } = useAuthStore()
  const access = useWorkspaceAccessContext()
  const canEdit = access == null || access.crm_mode === 'full'
  const managesStaff = user?.role === 'business_owner' || user?.role === 'admin'
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 60_000)
    const refreshClock = () => setNow(new Date())
    document.addEventListener('visibilitychange', refreshClock)
    return () => {
      window.clearInterval(clock)
      document.removeEventListener('visibilitychange', refreshClock)
    }
  }, [])

  const dayKey = zonedDayKey(now, timeZone)
  const range = useMemo(() => {
    const [year, month, day] = dayKey.split('-').map(Number)
    // Advance the calendar date, not 24 hours: a business day may have 23 or 25 hours.
    const tomorrow = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
    return {
      dateFrom: zonedWallTimeToIso(dayKey, '00:00', timeZone),
      dateTo: new Date(Date.parse(zonedWallTimeToIso(tomorrow, '00:00', timeZone)) - 1).toISOString(),
    }
  }, [dayKey, timeZone])

  const visits = useQuery({
    queryKey: ['visits', 'today-agenda', sessionRevision, user?.id, user?.business_id,
      user?.employer_id, timeZone, range.dateFrom, range.dateTo],
    enabled: !!token && !!user,
    retry: false,
    queryFn: ({ signal }) => allPages<VisitOut>(async page => {
      const current = useAuthStore.getState()
      if (signal.aborted || current.sessionRevision !== sessionRevision || current.user?.id !== user?.id
        || current.user?.business_id !== user?.business_id || current.user?.employer_id !== user?.employer_id) {
        throw new Error('Session changed')
      }
      return (await api.get<Schema<'PaginatedResponse_VisitOut_'>>('/visits/', {
        params: { page, per_page: 100, date_from: range.dateFrom, date_to: range.dateTo,
          sort_by: 'date_start', sort_order: 'asc' },
        signal,
      })).data
    }),
  })

  const employees = useQuery<EmployeeOut[]>({
    queryKey: ['employees', true],
    enabled: !!token && !!user && managesStaff,
    retry: false,
    queryFn: async ({ signal }) => (await api.get<EmployeeOut[]>('/employees/', {
      params: { is_active: true }, signal,
    })).data,
  })

  const staffNames = useMemo(() => {
    const names = new Map<number, string>()
    if (user) names.set(user.id, user.full_name)
    if (managesStaff) {
      for (const employee of employees.data ?? []) {
        if (names.has(employee.employee_user_id)) continue
        const name = employee.employee_user?.full_name
        if (typeof name === 'string' && name.trim()) names.set(employee.employee_user_id, name)
      }
    }
    return names
  }, [user, managesStaff, employees.data])

  const localeTag = locale === 'cz' ? 'cs-CZ' : locale === 'ru' ? 'ru-RU' : 'en-GB'
  const formatTime = (iso: string) => new Intl.DateTimeFormat(localeTag, {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(iso))
  const dateLabel = new Intl.DateTimeFormat(localeTag, { timeZone, dateStyle: 'full' }).format(now)
  const statusClass = (status: VisitOut['status']) => {
    switch (status) {
      case 'planned': return 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
      case 'in_progress': return 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
      case 'completed': return 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]'
      default: return 'bg-[var(--workspace-bg)] text-[var(--workspace-muted)]'
    }
  }

  return (
    <Card className="overflow-hidden text-[var(--workspace-ink)]">
      <section aria-label={t('today.title')}>
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--workspace-line)] px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold">{t('today.title')}</h2>
          <time dateTime={dayKey} className="text-xs text-[var(--workspace-muted)]">{dateLabel}</time>
        </header>
        {managesStaff && employees.isError && (
          <div role="status" className="flex flex-wrap items-center gap-2 border-b border-[var(--workspace-line)] px-4 py-2 text-xs text-[var(--workspace-muted)] sm:px-5">
            <p>{t('today.staffUnavailable')}</p>
            <Button variant="quiet" onClick={() => void employees.refetch()}>{t('today.retryStaff')}</Button>
          </div>
        )}
        {visits.isError ? (
          <div role="alert" className="space-y-3 px-5 py-6">
            <p className="text-sm">{t('common.loadError')}</p>
            <Button variant="secondary" onClick={() => void visits.refetch()}>{t('common.retry')}</Button>
          </div>
        ) : visits.isPending ? (
          <p role="status" className="px-5 py-8 text-sm text-[var(--workspace-muted)]">{t('common.loading')}</p>
        ) : !visits.data?.length ? (
          <p className="px-5 py-8 text-sm text-[var(--workspace-muted)]">{t('today.empty')}</p>
        ) : (
          <ul className="divide-y divide-[var(--workspace-line)]">
            {visits.data.map(visit => (
              <li key={visit.id} className="grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 px-4 py-3 sm:grid-cols-[5rem_minmax(0,1fr)_minmax(7rem,auto)] sm:items-center sm:px-5">
                <div className="row-span-2 text-sm tabular-nums sm:row-span-1">
                  <time dateTime={visit.date_start}>{formatTime(visit.date_start)}</time>
                  {visit.date_end && <time dateTime={visit.date_end} className="block text-xs text-[var(--workspace-muted)]">{formatTime(visit.date_end)}</time>}
                </div>
                <div className="min-w-0">
                  {canEdit ? <button type="button" aria-label={`${t('common.edit')}: ${visit.client_name || `#${visit.client_id}`}`}
                    onClick={() => onEdit(visit.id)} className="group inline-flex max-w-full items-center gap-2 text-left text-sm font-medium hover:text-[var(--workspace-accent)]">
                    <span className="break-words">{visit.client_name || `#${visit.client_id}`}</span><HiOutlineChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-muted)]" />
                  </button> : <p className="break-words text-sm font-medium">{visit.client_name || `#${visit.client_id}`}</p>}
                  <p className="mt-1 break-words text-xs text-[var(--workspace-muted)]">{visit.service_name || (visit.service_id ? `#${visit.service_id}` : t('today.noService'))}</p>
                </div>
                <div className="col-start-2 flex flex-wrap items-center gap-2 text-xs sm:col-start-auto sm:flex-col sm:items-start">
                  <span className="text-[var(--workspace-muted)]"><span className="sr-only">{t('visits.specialist')}: </span>{staffNames.get(visit.specialist_id) || `#${visit.specialist_id}`}</span>
                  <span className={`rounded px-2 py-1 ${statusClass(visit.status)}`}><span className="sr-only">{t('visits.status')}: </span>{labels.visitStatus(visit.status) || '—'}</span>
                </div>

              </li>
            ))}
          </ul>
        )}
        <footer className="border-t border-[var(--workspace-line)] px-4 py-3 text-xs text-[var(--workspace-muted)] sm:px-5">
          {t('today.timeZone')}: {timeZone}
        </footer>
      </section>
    </Card>
  )
}
