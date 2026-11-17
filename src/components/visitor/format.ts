import { INTL_LOCALE } from '../booking/intl'
import type { Locale } from '../../store/localeStore'
import type { Schema } from '../../api/types'

export function browserTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' }
}

// A salon with a broken or missing time zone must not take the whole list down:
// fall back to the browser's zone and say so through zoneLabel().
export function safeTimeZone(zone: string | null | undefined): string | null {
  if (!zone) return null
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone })
    return zone
  } catch {
    return null
  }
}

export function formatVisitTime(iso: string, zone: string | null | undefined, locale: Locale, options: Intl.DateTimeFormatOptions = { dateStyle: 'full', timeStyle: 'short' }): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const timeZone = safeTimeZone(zone) ?? undefined
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { ...options, timeZone }).format(date)
}

export function formatClock(iso: string | null | undefined, zone: string | null | undefined, locale: Locale): string {
  if (!iso) return ''
  return formatVisitTime(iso, zone, locale, { hour: '2-digit', minute: '2-digit' })
}

// Shown next to times when the salon's zone differs from the visitor's own.
export function zoneLabel(zone: string | null | undefined): string | null {
  const salon = safeTimeZone(zone)
  return salon && salon !== browserTimeZone() ? salon : null
}

// Money comes as a string with exact cents and is shown as is: no float math, no sums
// across currencies. Intl formats the decimal string directly, without converting it.
export function formatMoney(amount: string, currency: string, locale: Locale): string {
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale], { style: 'currency', currency })
      .format(amount as unknown as number)
  } catch {
    return `${amount} ${currency}`
  }
}

export function visitServices(visit: Schema<'VisitorHistoryVisit'>): string {
  const names = visit.items.length ? visit.items.map(item => item.service_name) : [visit.service_name]
  return names.filter(Boolean).join(' · ')
}
