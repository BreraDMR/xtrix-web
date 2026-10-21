import type { VisitOut } from '../../api/types'

export type CalendarVisit = VisitOut & { client_name?: string | null }

export interface CalendarSegment {
  key: string
  start: string
  end: string
  staffId: number
  serviceName: string | null
  price: number | null
  position: number | null
  total: number
  chainStart: string
  offsetMinutes: number
  isChain: boolean
}

export type CalendarEvent = CalendarVisit & {
  segment?: CalendarSegment
  origin?: CalendarVisit
}

const minutesBetween = (from: string, to: string): number => {
  const delta = (new Date(to).getTime() - new Date(from).getTime()) / 60_000
  return Number.isFinite(delta) ? Math.round(delta) : 0
}

const orderedItems = (visit: CalendarVisit) => [...(visit.items ?? [])].sort((a, b) => a.position - b.position)

export function visitSegments(visit: CalendarVisit): CalendarSegment[] {
  const items = orderedItems(visit)
  if (items.length <= 1) {
    return [
      {
        key: String(visit.id),
        start: visit.date_start,
        end: visit.date_end ?? visit.date_start,
        staffId: visit.specialist_id,
        serviceName: visit.service_name ?? null,
        price: visit.price ?? null,
        position: null,
        total: items.length || 1,
        chainStart: visit.date_start,
        offsetMinutes: 0,
        isChain: false,
      },
    ]
  }
  const chainStart = items[0].date_start
  return items.map((item, index) => ({
    key: `${visit.id}-${index}`,
    start: item.date_start,
    end: item.date_end,
    staffId: item.specialist_id ?? visit.specialist_id,
    serviceName: item.service_name ?? null,
    price: item.price ?? null,
    position: index + 1,
    total: items.length,
    chainStart,
    offsetMinutes: Math.max(0, minutesBetween(chainStart, item.date_start)),
    isChain: true,
  }))
}

export function expandVisit(visit: CalendarVisit): CalendarEvent[] {
  const segments = visitSegments(visit)
  if (!segments[0]?.isChain) return [visit]
  return segments.map((segment) => ({
    ...visit,
    origin: visit,
    items: undefined,
    date_start: segment.start,
    date_end: segment.end,
    specialist_id: segment.staffId,
    price: segment.price,
    segment,
  }))
}

export function chainOverview(visit: CalendarVisit): CalendarEvent {
  const segments = visitSegments(visit)
  const first = segments[0]
  if (!first?.isChain) return visit
  const last = segments[segments.length - 1]
  return {
    ...visit,
    items: undefined,
    segment: {
      ...first,
      key: String(visit.id),
      end: last.end,
      staffId: visit.specialist_id,
      serviceName:
        segments
          .map((segment) => segment.serviceName)
          .filter(Boolean)
          .join(' → ') ||
        visit.service_name ||
        null,
      price: visit.price ?? null,
      position: null,
    },
  }
}
