import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { LuFlag, LuNotepadText, LuFolder, LuChevronDown, LuChevronRight } from 'react-icons/lu'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import DonutProgress from '../components/DonutProgress'

interface VisitLite {
  id: number
  date_start: string
  service_name?: string
  status?: string
  price?: number
}

const hasToken = () => !!useAuthStore.getState().token || !!localStorage.getItem('auth_token')

function startOfWeek(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  return date
}

export default function Dashboard() {
  const { t, locale } = useTranslation()
  const currency = useBusinessCurrency()
  const [openService, setOpenService] = useState<string | null>(null)

  const { data: profitData, isLoading: isLoadingProfit } = useQuery({
    queryKey: ['profit-current-month'],
    queryFn: async () => {
      const { data } = await api.get('/expenses/reports/profit')
      return data
    },
    retry: false,
    enabled: hasToken(),
  })

  const { data: visitStats, isLoading: isLoadingVisitStats } = useQuery({
    queryKey: ['visits-statistics'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/analytics/visits/statistics')
        return data
      } catch {
        return { total_visits: 0, visits_by_status: { completed: 0, planned: 0, in_progress: 0, cancelled: 0 } }
      }
    },
    retry: false,
    enabled: hasToken(),
  })

  const { data: clientStats, isLoading: isLoadingClientStats } = useQuery({
    queryKey: ['clients-statistics'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/analytics/clients/statistics')
        return data
      } catch {
        return { total_clients: 0, new_clients: 0, average_spending: 0 }
      }
    },
    retry: false,
    enabled: hasToken(),
  })

  const { data: visits } = useQuery<VisitLite[]>({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data } = await api.get('/visits/')
      return Array.isArray(data) ? data : data?.items || data?.data || []
    },
    retry: false,
    enabled: hasToken(),
  })

  const intlLocale = locale === 'cz' ? 'cs-CZ' : locale === 'ru' ? 'ru-RU' : 'en-GB'

  const { occupancy, todayIndex, topServices } = useMemo(() => {
    const weekStart = startOfWeek(new Date())
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
    const counts = new Array(7).fill(0)
    const services = new Map<string, { count: number; revenue: number; minutes: number }>()
    for (const v of visits || []) {
      if (!v.date_start) continue
      const d = new Date(v.date_start)
      const idx = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - weekStart.getTime()) / 86400000)
      if (idx < 0 || idx > 6) continue
      counts[idx] += 1
      const key = v.service_name || '—'
      const entry = services.get(key) || { count: 0, revenue: 0, minutes: 0 }
      entry.count += 1
      entry.revenue += Number(v.price) || 0
      services.set(key, entry)
    }
    const max = Math.max(...counts, 1)
    const today = (new Date().getDay() + 6) % 7
    return {
      todayIndex: today,
      occupancy: days.map((d, i) => ({
        day: d.toLocaleDateString(intlLocale, { weekday: 'long' }),
        date: d.toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit' }),
        value: Math.round((counts[i] / max) * 100),
        count: counts[i],
      })),
      topServices: [...services.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, s]) => ({ name, ...s })),
    }
  }, [visits, intlLocale])

  const totalVisits = visitStats?.total_visits || 0
  const completed = visitStats?.visits_by_status?.completed || 0
  const cancelled = visitStats?.visits_by_status?.cancelled || 0
  const completionPct = totalVisits > 0 ? Math.round((completed / totalVisits) * 100) : 0
  const revenue = profitData?.revenue || 0
  const averageCheck = completed > 0 ? revenue / completed : clientStats?.average_spending || 0

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr_1fr]">
        <div className="card flex flex-col p-7">
          <h3 className="text-[15px] font-semibold">{t('dashboard.monthlyRevenue')}</h3>
          {isLoadingProfit ? (
            <div className="py-8"><LoadingSpinner size="md" /></div>
          ) : (
            <>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-[36px] font-bold leading-none">{formatCurrency(revenue, currency)}</span>
                {profitData?.profit_margin !== undefined && (
                  <span className="text-xs font-semibold text-[#8f8f99]">
                    <span className="text-sm font-bold text-brand-pink">{Number(profitData.profit_margin).toFixed(0)}%</span>{' '}
                    {t('dashboard.margin.vs')}
                  </span>
                )}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-bold text-[#8f8f99]">{t('dashboard.visits')}:</div>
                  <div className="text-sm font-bold">{totalVisits}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-[#8f8f99]">{t('dashboard.averageCheck')}:</div>
                  <div className="text-sm font-bold">{formatCurrency(averageCheck, currency)}</div>
                </div>
              </div>
            </>
          )}
          <div className="min-h-[2rem] flex-1" />
          <Link to="/finance" className="btn-primary w-full py-2.5 text-[15px]">
            {t('dashboard.viewPayments')}
          </Link>
        </div>

        <div className="card p-7">
          <h3 className="text-[17px] font-semibold">{t('dashboard.reservations')}</h3>
          {isLoadingVisitStats ? (
            <div className="py-10"><LoadingSpinner size="md" /></div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
              <DonutProgress value={completionPct} caption={`${completed} / ${totalVisits} ${t('dashboard.completedOf')}`} />
              <div className="space-y-3 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-brand-pink" />
                  {t('dashboard.completedVisits')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#e6e6ea]" />
                  {t('dashboard.remaining')}
                </div>
              </div>
            </div>
          )}
          <div className="mt-5 space-y-1.5 text-[13px]">
            <Link to="/visits" className="flex items-center gap-2 hover:text-primary-600">
              <LuFlag className="h-3.5 w-3.5" /> {t('dashboard.ordersOverview')}
            </Link>
            <Link to="/analytics" className="flex items-center gap-2 hover:text-primary-600">
              <LuNotepadText className="h-3.5 w-3.5" /> {t('dashboard.ordersReport')}
            </Link>
          </div>
        </div>

        <div className="card p-7">
          <h3 className="text-[17px] font-semibold">{t('dashboard.topThisWeek')}</h3>
          <div className="mt-5 space-y-3">
            {topServices.length === 0 && (
              <p className="text-[13px] font-semibold text-[#8f8f99]">{t('dashboard.noVisitsThisWeek')}</p>
            )}
            {topServices.slice(0, 2).map((s) => {
              const open = openService === s.name || (openService === null && s === topServices[0])
              return (
                <div key={s.name}>
                  <button
                    onClick={() => setOpenService(open ? '' : s.name)}
                    className="flex w-full items-center gap-2 text-left text-[13px] font-semibold"
                  >
                    {open ? <LuChevronDown className="h-3.5 w-3.5 text-[#8f8f99]" /> : <LuChevronRight className="h-3.5 w-3.5 text-[#8f8f99]" />}
                    <span className="truncate">{s.name}</span>
                  </button>
                  {open && (
                    <div className="ml-6 mt-2 text-xs">
                      <span className="text-brand-pink">{s.count}</span> {t('dashboard.visits').toLowerCase()} ·{' '}
                      <span className="text-brand-pink">{formatCurrency(s.revenue, currency)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {topServices.length > 2 && (
            <div className="mt-6 space-y-1.5">
              {topServices.slice(2).map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-[13px]">
                  <LuFolder className="h-3.5 w-3.5" />
                  <span className="truncate">{s.name}</span>
                  <span className="ml-auto text-xs text-[#8f8f99]">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2.33fr_1fr]">
        <div className="card p-7">
          <h3 className="text-[17px] font-semibold">{t('dashboard.occupancy')}</h3>
          <div className="mt-4 h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#9b9ba3" strokeWidth={0.6} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={34}
                  tick={({ x, y, payload, index }: any) => (
                    <g transform={`translate(${x},${y + 8})`}>
                      <text textAnchor="middle" fill="#6b6b76" fontSize={10} fontFamily="Roboto">
                        <tspan x={0} dy={0} style={{ textTransform: 'capitalize' }}>{payload.value}</tspan>
                        <tspan x={0} dy={12}>{occupancy[index]?.date}</tspan>
                      </text>
                    </g>
                  )}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9b9ba3', fontSize: 8 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(159,90,239,0.06)' }}
                  formatter={(_v: any, _n: any, p: any) => [`${p.payload.count} ${t('dashboard.visits').toLowerCase()}`, '']}
                  labelFormatter={(l) => l}
                />
                <Bar dataKey="value" barSize={30} radius={[0, 0, 0, 0]} minPointSize={2}>
                  {occupancy.map((_, i) => (
                    <Cell key={i} fill={i === todayIndex ? '#e04aa8' : '#e8e8ea'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-7">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-semibold">{t('dashboard.quickStatus')}</h3>
            <span className="rounded bg-[#f0f0f3] px-3 py-0.5 text-xs">{t('dashboard.today')}</span>
          </div>
          {isLoadingClientStats ? (
            <div className="py-10"><LoadingSpinner size="md" /></div>
          ) : (
            <div className="mt-6 space-y-4">
              {[
                { label: t('dashboard.totalClients'), value: clientStats?.total_clients || 0 },
                { label: t('dashboard.newClients'), value: clientStats?.new_clients ?? 0 },
                { label: t('dashboard.averageSpending'), value: formatCurrency(clientStats?.average_spending || 0, currency) },
                { label: t('dashboard.expenses'), value: formatCurrency(profitData?.expenses || 0, currency) },
                ...(cancelled ? [{ label: t('visits.cancelled'), value: cancelled }] : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-[14px] bg-[#f4f4f6] px-3.5 py-2.5 dark:bg-white/5">
                  <span className="text-xs font-bold text-[#55555f] dark:text-gray-300">{row.label}</span>
                  <span className="min-w-[58px] rounded-md border border-[#d9c5f8] bg-[#efe6fc] px-3 py-0.5 text-center text-xs font-semibold">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
