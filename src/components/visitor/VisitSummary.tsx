import { Link } from 'react-router-dom'
import { LuChevronRight, LuClock, LuMapPin, LuUser } from 'react-icons/lu'
import type { Schema } from '../../api/types'
import type { TranslationKey } from '../../i18n/translations'
import { useTranslation } from '../../hooks/useTranslation'
import { avatarBackground } from '../../utils/avatar'
import { browserTimeZone, formatClock, formatMoney, formatVisitTime, safeTimeZone, visitServices } from './format'

export type VisitorVisit = Schema<'VisitorHistoryVisit'>
type Money = Schema<'VisitorHistoryMoney'> | null

const STATUS: Record<string, { key: TranslationKey; tone: string }> = {
  planned: { key: 'bookingManage.status.planned', tone: 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]' },
  scheduled: { key: 'bookingManage.status.planned', tone: 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]' },
  in_progress: { key: 'bookingManage.status.in_progress', tone: 'bg-[var(--tint-amber)] text-[var(--tint-amber-ink)]' },
  completed: { key: 'bookingManage.status.completed', tone: 'bg-[var(--tint-green)] text-[var(--tint-green-ink)]' },
  cancelled: { key: 'bookingManage.status.cancelled', tone: 'bg-[var(--tint-red)] text-[var(--tint-red-ink)]' },
}

export function StatusPill({ status }: { status: string | null }) {
  const { t } = useTranslation()
  if (!status) return null
  const known = STATUS[status]
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${known?.tone ?? 'bg-[var(--workspace-fill)] text-[var(--workspace-muted)]'}`}>
    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{known ? t(known.key) : status}
  </span>
}

// price: null means the salon has no price with a known currency - never show 0 for it
export function Price({ price, className = '' }: { price: Money; className?: string }) {
  const { t, locale } = useTranslation()
  return price
    ? <span className={`tabular-nums ${className}`}>{formatMoney(price.amount, price.currency, locale)}</span>
    : <span className={`text-[var(--workspace-muted)] ${className}`}>{t('visitor.price.onRequest')}</span>
}

// Always name the displayed zone, including the browser fallback for old salon data.
export default function VisitSummary({ visit }: { visit: VisitorVisit }) {
  const { t, locale } = useTranslation()
  const zone = visit.business.timezone
  const salonZone = safeTimeZone(zone)
  const displayedZone = salonZone ?? browserTimeZone()
  const start = new Date(visit.start)
  const day = formatVisitTime(visit.start, zone, locale, { day: 'numeric' })
  const month = formatVisitTime(visit.start, zone, locale, { month: 'short' })
  const year = formatVisitTime(visit.start, zone, locale, { year: 'numeric' })
  const weekday = formatVisitTime(visit.start, zone, locale, { weekday: 'long' })
  const cancelled = visit.status === 'cancelled'
  const staff = visit.staff_name ?? visit.items.find(item => item.staff_name)?.staff_name
  return <Link to={`/visitor/visits/${visit.id}`} aria-label={`${visit.business.name}, ${formatVisitTime(visit.start, zone, locale)}`}
    className="group flex gap-4 rounded-[22px] border border-[var(--workspace-card-border)] bg-[var(--workspace-panel)] p-4 shadow-[var(--workspace-card-shadow)] transition-shadow hover:shadow-[var(--x-shadow-lift)] sm:gap-5 sm:p-5">
    <div className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl py-2 text-center ${cancelled ? 'bg-[var(--workspace-fill)] text-[var(--workspace-muted)]' : 'text-white'}`}
      style={cancelled ? undefined : { background: avatarBackground(visit.business_id) }}>
      <span className="font-display text-[22px] font-semibold leading-none tabular-nums">{Number.isNaN(start.getTime()) ? '—' : day}</span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-wide opacity-90">{month}</span>
      <span className="mt-1 text-[11px] tabular-nums opacity-90">{year}</span>
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <p className={`min-w-0 text-[15px] font-semibold leading-snug [overflow-wrap:anywhere] ${cancelled ? 'line-through decoration-[var(--workspace-muted)]' : ''}`}>{visitServices(visit) || t('visitor.visit.noService')}</p>
        <StatusPill status={visit.status} />
      </div>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-[var(--workspace-muted)]">
        <LuClock className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="capitalize">{weekday}</span>
        <span className="tabular-nums">{formatClock(visit.start, zone, locale)}{visit.end ? `–${formatClock(visit.end, zone, locale)}` : ''}</span>
        <span className="rounded-full bg-[var(--workspace-fill)] px-2 py-0.5 text-[11px] [overflow-wrap:anywhere]">{t(salonZone ? 'visitor.time.salonZone' : 'visitor.time.yourZone').replace('{zone}', displayedZone)}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px]">
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[var(--workspace-muted)]">
          <span className="flex min-w-0 items-center gap-1.5"><LuMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="[overflow-wrap:anywhere]">{visit.business.name}</span></span>
          {staff && <span className="flex items-center gap-1.5"><LuUser className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{staff}</span>}
        </span>
        <span className="flex items-center gap-1 font-semibold"><Price price={visit.price} /><LuChevronRight className="h-4 w-4 text-[var(--workspace-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
      </div>
    </div>
  </Link>
}
