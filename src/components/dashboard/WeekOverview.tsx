import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { HiOutlineFolder } from 'react-icons/hi'
import api from '../../api/client'
import { allPages } from '../../api/allPages'
import type { Schema, VisitOut } from '../../api/types'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../hooks/useTranslation'
import { useBusinessCurrency } from '../../hooks/useBusinessCurrency'
import { formatCurrency } from '../../utils/currency'
import { zonedDayKey, zonedWallTimeToIso } from '../../utils/dates'
import Card from '../../ui/Card'
import LoadingSpinner from '../LoadingSpinner'
import QueryError from '../QueryError'

const addDays = (dayKey: string, days: number) => {
  const [year, month, day] = dayKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

// Monday-to-Sunday load of the business week and the services that filled it.
export default function WeekOverview({ timeZone }: { timeZone: string }) {
  const { t, locale } = useTranslation()
  const currency = useBusinessCurrency()
  const { user, token, sessionRevision } = useAuthStore()
  const localeTag = locale === 'cz' ? 'cs-CZ' : locale === 'ru' ? 'ru-RU' : 'en-GB'

  const todayKey = zonedDayKey(new Date(), timeZone)
  const days = useMemo(() => {
    const [year, month, day] = todayKey.split('-').map(Number)
    const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7
    const monday = addDays(todayKey, -weekday)
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
  }, [todayKey])

  const range = useMemo(() => ({
    dateFrom: zonedWallTimeToIso(days[0], '00:00', timeZone),
    dateTo: new Date(Date.parse(zonedWallTimeToIso(addDays(days[6], 1), '00:00', timeZone)) - 1).toISOString(),
  }), [days, timeZone])

  const visits = useQuery({
    queryKey: ['visits', 'week-overview', sessionRevision, user?.id, user?.business_id, timeZone, range.dateFrom, range.dateTo],
    enabled: !!token && !!user,
    retry: false,
    queryFn: ({ signal }) => allPages<VisitOut>(async page => (await api.get<Schema<'PaginatedResponse_VisitOut_'>>('/visits/', {
      params: { page, per_page: 100, date_from: range.dateFrom, date_to: range.dateTo, sort_by: 'date_start', sort_order: 'asc' },
      signal,
    })).data),
  })

  const { occupancy, topServices } = useMemo(() => {
    const counts = new Map<string, number>()
    const services = new Map<string, { count: number; revenue: number }>()
    for (const visit of visits.data ?? []) {
      if (visit.status === 'cancelled') continue
      const key = zonedDayKey(new Date(visit.date_start), timeZone)
      counts.set(key, (counts.get(key) ?? 0) + 1)
      const name = visit.service_name || '—'
      const entry = services.get(name) ?? { count: 0, revenue: 0 }
      entry.count += 1
      entry.revenue += Number(visit.price) || 0
      services.set(name, entry)
    }
    const max = Math.max(1, ...counts.values())
    return {
      occupancy: days.map((day) => {
        const date = new Date(`${day}T12:00:00Z`)
        const count = counts.get(day) ?? 0
        return {
          key: day,
          day: new Intl.DateTimeFormat(localeTag, { weekday: 'long', timeZone: 'UTC' }).format(date),
          date: new Intl.DateTimeFormat(localeTag, { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(date),
          value: Math.round((count / max) * 100),
          count,
        }
      }),
      topServices: [...services.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5)
        .map(([name, entry]) => ({ name, ...entry })),
    }
  }, [visits.data, days, timeZone, localeTag])

  return <section aria-labelledby="week-overview-title" className="mt-8">
    <h2 id="week-overview-title" className="mb-4 text-[17px] font-semibold">{t('dashboard.thisWeek')}</h2>
    <div className="grid gap-6 xl:grid-cols-[2.2fr_1fr]">
      <Card className="p-7">
        <h3 className="text-[15px] font-semibold">{t('dashboard.occupancy')}</h3>
        {visits.isPending ? <LoadingSpinner size="sm" /> : visits.isError ? <QueryError retry={visits.refetch} /> :
          <div className="mt-4 h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#9b9ba3" strokeWidth={0.6} />
                <XAxis dataKey="key" axisLine={false} tickLine={false} interval={0} height={34}
                  tick={({ x, y, index }: { x: number; y: number; index: number }) => (
                    <g transform={`translate(${x},${y + 8})`}>
                      <text textAnchor="middle" fill="#6b6b76" fontSize={10} fontFamily="Roboto, sans-serif">
                        <tspan x={0} dy={0} style={{ textTransform: 'capitalize' }}>{occupancy[index]?.day}</tspan>
                        <tspan x={0} dy={12}>{occupancy[index]?.date}</tspan>
                      </text>
                    </g>
                  )} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`}
                  axisLine={false} tickLine={false} tick={{ fill: '#9b9ba3', fontSize: 8 }} />
                <Tooltip cursor={{ fill: 'rgba(159,90,239,0.06)' }}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload ? `${payload[0].payload.day} ${payload[0].payload.date}` : ''}
                  formatter={(_value, _name, item) => [`${item.payload.count} ${t('dashboard.visitsCount')}`, '']} />
                <Bar dataKey="value" barSize={30} minPointSize={2} isAnimationActive={false}>
                  {occupancy.map((entry) => <Cell key={entry.key} fill={entry.key === todayKey ? '#e04aa8' : '#e8e8ea'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>}
      </Card>
      <Card className="p-7">
        <h3 className="text-[15px] font-semibold">{t('dashboard.topThisWeek')}</h3>
        {visits.isPending ? <LoadingSpinner size="sm" /> : visits.isError ? <QueryError retry={visits.refetch} /> :
          topServices.length === 0 ? <p className="mt-4 text-[13px] font-semibold text-[var(--workspace-muted)]">{t('dashboard.noVisitsThisWeek')}</p> :
            <ul className="mt-5 space-y-3">
              {topServices.map((service, index) => <li key={service.name} className="text-[13px]">
                <div className="flex items-center gap-2 font-semibold">
                  <HiOutlineFolder aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="truncate">{service.name}</span>
                </div>
                {index < 2 && <p className="ml-6 mt-1 text-xs">
                  <span className="text-brand-pink">{service.count}</span> {t('dashboard.visitsCount')} · <span className="text-brand-pink">{formatCurrency(service.revenue, currency)}</span>
                </p>}
                {index >= 2 && <p className="ml-6 mt-0.5 text-xs text-[var(--workspace-muted)]">{service.count} {t('dashboard.visitsCount')}</p>}
              </li>)}
            </ul>}
      </Card>
    </div>
  </section>
}
