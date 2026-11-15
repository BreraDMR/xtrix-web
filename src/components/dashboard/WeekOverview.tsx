import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts'
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

  return <section aria-labelledby="week-overview-title" className="mt-12">
    <h2 id="week-overview-title" className="mb-4 text-[20px] font-semibold tracking-[-0.02em]">{t('dashboard.thisWeek')}</h2>
    <div className="grid gap-5 xl:grid-cols-[2.2fr_1fr]">
      <Card className="p-7">
        <h3 className="eyebrow">{t('dashboard.occupancy')}</h3>
        {visits.isPending ? <LoadingSpinner size="sm" /> : visits.isError ? <QueryError retry={visits.refetch} /> :
          <div className="mt-4 h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy} margin={{ top: 10, right: 6, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="x-bar-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#9f5aef" />
                    <stop offset="1" stopColor="#e04aa8" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--workspace-line)" strokeDasharray="0" />
                <XAxis dataKey="key" axisLine={false} tickLine={false} interval={0} height={34}
                  tick={({ x, y, index }: { x: number; y: number; index: number }) => (
                    <g transform={`translate(${x},${y + 8})`}>
                      <text textAnchor="middle" fill="#86868b" fontSize={10.5} fontFamily="-apple-system, BlinkMacSystemFont, Inter, sans-serif">
                        <tspan x={0} dy={0} style={{ textTransform: 'capitalize' }}>{occupancy[index]?.day}</tspan>
                        <tspan x={0} dy={12}>{occupancy[index]?.date}</tspan>
                      </text>
                    </g>
                  )} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`}
                  axisLine={false} tickLine={false} tick={{ fill: '#aeaeb2', fontSize: 10 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,.06)', boxShadow: '0 8px 24px rgba(0,0,0,.08)', fontSize: 12 }}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload ? `${payload[0].payload.day} ${payload[0].payload.date}` : ''}
                  formatter={(_value, _name, item) => [`${item.payload.count} ${t('dashboard.visitsCount')}`, '']} />
                <Bar dataKey="value" barSize={28} minPointSize={3} radius={[8, 8, 8, 8]} isAnimationActive={false}>
                  {occupancy.map((entry) => <Cell key={entry.key} fill={entry.key === todayKey ? 'url(#x-bar-gradient)' : '#e8e8ed'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>}
      </Card>
      <Card className="p-7">
        <h3 className="eyebrow">{t('dashboard.topThisWeek')}</h3>
        {visits.isPending ? <LoadingSpinner size="sm" /> : visits.isError ? <QueryError retry={visits.refetch} /> :
          topServices.length === 0 ? <p className="mt-4 text-[13px] font-semibold text-[var(--workspace-muted)]">{t('dashboard.noVisitsThisWeek')}</p> :
            <ol className="mt-5 divide-y divide-[var(--workspace-line)]">
              {topServices.map((service, index) => <li key={service.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--workspace-fill)] text-xs font-medium tabular-nums text-[var(--workspace-muted)]">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium tracking-[-0.01em]">{service.name}</p>
                  <p className="text-xs text-[var(--workspace-muted)] tabular-nums">{service.count} {t('dashboard.visitsCount')}</p>
                </div>
                <span className="text-[13.5px] font-medium tabular-nums">{formatCurrency(service.revenue, currency)}</span>
              </li>)}
            </ol>}
      </Card>
    </div>
  </section>
}
