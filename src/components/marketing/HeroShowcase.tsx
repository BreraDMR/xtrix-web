import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'
import { LuBell, LuCalendar, LuChartColumn, LuCircleCheck, LuHouse, LuLink, LuSparkles, LuUsers, LuWallet } from 'react-icons/lu'

type Tone = 'purple' | 'pink' | 'blue' | 'green' | 'amber'
// fictional day: [specialist column, start hour, length in hours, service, tone]
const visits: [number, number, number, TranslationKey, Tone][] = [
  [0, 10, 1.5, 'landing.mock.svc_haircut', 'purple'],
  [0, 12, 1, 'landing.mock.svc_haircut', 'purple'],
  [0, 14.5, 2, 'landing.mock.svc_coloring', 'pink'],
  [1, 10.5, 1, 'landing.mock.svc_manicure', 'blue'],
  [1, 12, 1.5, 'landing.mock.svc_pedicure', 'green'],
  [1, 15.5, 1, 'landing.mock.svc_manicure', 'blue'],
  [2, 11, 1, 'landing.mock.svc_brows', 'amber'],
  [2, 13, 1.5, 'landing.mock.svc_massage', 'green'],
  [2, 15, 1, 'landing.mock.svc_brows', 'amber'],
]
const firstHour = 10
const hours = [10, 11, 12, 13, 14, 15, 16]
const rowHeight = 44

export function DaySchedule({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const staff = [t('landing.mock.staff1'), t('landing.mock.staff2'), t('landing.mock.staff3')]
  const fmt = (hour: number) => `${Math.floor(hour)}:${hour % 1 ? '30' : '00'}`
  return <div className="min-w-0">
    <div className="grid grid-cols-[2.25rem_repeat(3,minmax(0,1fr))] gap-2 pb-2 text-[11px] font-medium text-[var(--workspace-muted)]">
      <span />
      {staff.map((name, index) => <span key={name} className="flex min-w-0 items-center gap-1.5">
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-white ${['bg-[#9f5aef]', 'bg-[#e04aa8]', 'bg-[#4f8df7]'][index]}`} aria-hidden="true">{name[0]}</span>
        <span className="truncate">{name}</span>
      </span>)}
    </div>
    <div className="relative grid grid-cols-[2.25rem_repeat(3,minmax(0,1fr))] gap-x-2" style={{ height: (compact ? 5 : hours.length) * rowHeight }}>
      <div className="relative">
        {hours.slice(0, compact ? 5 : hours.length).map((hour, index) => <span key={hour} className="absolute -translate-y-1/2 text-[10px] tabular-nums text-[var(--workspace-subtle)]" style={{ top: index * rowHeight }}>{hour}:00</span>)}
      </div>
      {[0, 1, 2].map(column => <div key={column} className="relative rounded-xl bg-[var(--workspace-bg)]/60"
        style={{ backgroundImage: `repeating-linear-gradient(to bottom, var(--workspace-line) 0 1px, transparent 1px ${rowHeight}px)` }}>
        {visits.filter(visit => visit[0] === column && (!compact || visit[1] + 1 <= firstHour + 5)).map(([, start, length, service, tone]) => (
          <div key={start} className={`lp-ev lp-ev-${tone} absolute inset-x-1 text-[10.5px] leading-tight`}
            style={{ top: (start - firstHour) * rowHeight + 2, height: Math.min(length, compact ? firstHour + 5 - start : length) * rowHeight - 4 }}>
            <b className="font-semibold">{t(service)}</b>
            <span className="mt-0.5 tabular-nums">{fmt(start)}–{fmt(start + length)}</span>
          </div>
        ))}
      </div>)}
    </div>
  </div>
}

export default function HeroShowcase() {
  const { t, locale } = useTranslation()
  const money = new Intl.NumberFormat(locale === 'cz' ? 'cs-CZ' : locale, { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(18400)
  const kpis = [
    { label: t('landing.mock.visits'), value: '12', trend: '+3' },
    { label: t('landing.mock.revenue'), value: money, trend: '+12%' },
    { label: t('landing.mock.occupancy'), value: '86%', trend: '+5%' },
  ]
  const nav = [LuHouse, LuCalendar, LuUsers, LuChartColumn, LuWallet]
  const upcoming = [
    { time: '10:00', text: t('landing.hero.preview_slot1'), status: t('visits.completed'), done: true },
    { time: '11:30', text: t('landing.hero.preview_slot2'), status: t('visits.planned'), done: false },
  ]

  return <div className="relative mx-auto max-w-6xl">
    <figure aria-labelledby="landing-hero-sample" className="lp-window lp-rise lp-rise-3 min-w-0">
      <div className="lp-window-bar">
        <span className="lp-dots" aria-hidden="true"><span /><span /><span /></span>
        <span className="mx-auto hidden rounded-md bg-[var(--workspace-panel)] px-10 py-1 text-[11px] text-[var(--workspace-muted)] ring-1 ring-[var(--workspace-line)] sm:block">xtrix.app</span>
        <span className="text-[11px] font-medium text-[var(--workspace-muted)] sm:hidden">Xtrix</span>
      </div>
      <div className="grid min-w-0 md:grid-cols-[3.75rem_minmax(0,1fr)]">
        <div className="hidden flex-col items-center gap-2 border-r border-[var(--workspace-line)] py-4 md:flex" aria-hidden="true">
          <span className="crm-logo mb-2 h-8 w-8 text-[15px]">X</span>
          {nav.map((Icon, index) => <span key={index} className={`grid h-9 w-9 place-items-center rounded-xl ${index === 1 ? 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]' : 'text-[var(--workspace-subtle)]'}`}><Icon className="h-[18px] w-[18px]" /></span>)}
        </div>
        <div className="min-w-0 p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-[var(--workspace-muted)]">{t('landing.mock.greeting')}</p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">{t('landing.mock.today')}</h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--workspace-accent-soft)] px-3 py-1 text-[11px] font-medium text-[var(--workspace-accent)]"><LuCalendar className="h-3.5 w-3.5" aria-hidden="true" />{t('landing.hero.preview_title')}</span>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            {kpis.map(kpi => <div key={kpi.label} className="min-w-0 rounded-2xl bg-[var(--workspace-bg)] p-3 sm:p-4">
              <dt className="truncate text-[10.5px] text-[var(--workspace-muted)] sm:text-xs">{kpi.label}</dt>
              <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="text-base font-semibold tabular-nums tracking-tight sm:text-2xl">{kpi.value}</span>
                <span className="text-[10.5px] font-medium text-[var(--lp-green-ink)]">{kpi.trend}</span>
              </dd>
            </div>)}
          </dl>
          <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <DaySchedule />
            <div className="hidden min-w-0 flex-col gap-3 lg:flex">
              <h3 className="text-xs font-semibold text-[var(--workspace-muted)]">{t('landing.mock.upcoming')}</h3>
              {upcoming.map(item => <div key={item.time} className="rounded-2xl border border-[var(--workspace-line)] p-3">
                <div className="flex items-center justify-between text-[11px] text-[var(--workspace-muted)]"><span className="tabular-nums">{item.time}</span>
                  <span className={`rounded-full px-2 py-0.5 ${item.done ? 'bg-[var(--lp-green-soft)] text-[var(--lp-green-ink)]' : 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]'}`}>{item.status}</span></div>
                <p className="mt-1.5 text-[13px] font-medium leading-snug">{item.text}</p>
              </div>)}
              <div className="mt-auto rounded-2xl bg-[var(--workspace-bg)] p-3">
                <p className="flex items-center gap-2 text-xs font-semibold"><LuLink className="h-4 w-4 text-[var(--workspace-accent)]" aria-hidden="true" />{t('landing.features.booking_title')}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--workspace-muted)]">{t('landing.features.booking_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption id="landing-hero-sample" className="border-t border-[var(--workspace-line)] px-4 py-3 text-center text-[11px] leading-relaxed text-[var(--workspace-muted)] sm:px-6">{t('landing.preview.sampleNotice')}</figcaption>
    </figure>

    <div className="lp-glass lp-float pointer-events-none absolute -right-6 -top-10 hidden w-64 p-3.5 xl:block" aria-hidden="true">
      <p className="flex items-center gap-2 text-[11px] font-medium text-[var(--workspace-muted)]"><span className="grid h-6 w-6 place-items-center rounded-lg text-white" style={{ background: 'var(--x-gradient)' }}><LuBell className="h-3.5 w-3.5" /></span>{t('landing.mock.new_booking')}</p>
      <p className="mt-2 text-sm font-semibold">{t('landing.mock.new_booking_detail')}</p>
      <p className="mt-0.5 text-xs text-[var(--workspace-muted)]">{t('landing.mock.staff3')}</p>
    </div>
    <div className="lp-glass lp-float lp-float-late pointer-events-none absolute -left-8 -bottom-6 hidden w-72 p-3.5 xl:block" aria-hidden="true">
      <p className="flex items-center gap-2 text-[11px] font-medium text-[var(--workspace-muted)]"><LuSparkles className="h-4 w-4 text-[var(--workspace-accent)]" />{t('landing.features.assistant_title')}</p>
      <p className="lp-bubble-me mt-2 ml-auto w-fit max-w-full px-3 py-2 text-[12.5px] leading-snug">{t('landing.ai.chat_q2')}</p>
      <p className="mt-2 flex items-center gap-2 text-[12.5px] font-medium"><LuCircleCheck className="h-4 w-4 shrink-0 text-[var(--lp-green-ink)]" />{t('landing.ai.plan_step')}</p>
    </div>
  </div>
}
