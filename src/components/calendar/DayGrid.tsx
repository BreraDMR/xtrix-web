import { useMemo, type DragEvent } from 'react'
import { format, parseISO } from 'date-fns'
import { cs, enUS, ru } from 'date-fns/locale'
import { useTranslation } from '../../hooks/useTranslation'
import { useLabels } from '../../i18n/labels'
import { useLocaleStore } from '../../store/localeStore'
import { useBusinessCurrency } from '../../hooks/useBusinessCurrency'
import { formatCurrency } from '../../utils/currency'
import { isoToZonedWallTime, zonedDayKey } from '../../utils/dates'
import type { DayOverlay, MinuteInterval } from './schedule'
import type { CalendarEvent } from './chain'

export type { CalendarVisit } from './chain'

export interface MovePreview {
  dayKey: string
  startMin: number
  endMin: number
  label: string
}

interface DayGridProps {
  day: Date
  visits: CalendarEvent[]
  timeZone?: string
  clientNames?: ReadonlyMap<number, string>
  onSelectVisit?: (visit: CalendarEvent) => void
  overlay?: DayOverlay
  preview?: MovePreview
  onDropVisit?: (visitId: number, dayKey: string, startMin: number) => void
  hourHeight?: number
  className?: string
  showHeader?: boolean
  showAxis?: boolean
  contained?: boolean
}

interface DayEvent {
  visit: CalendarEvent
  startMin: number
  endMin: number
  labelStart: string
  labelEnd: string
  lane: number
  lanes: number
}

const HOURS_IN_DAY = 24
const DEFAULT_HOUR_HEIGHT = 64
const FALLBACK_MINUTES = 60
const DRAG_MIME = 'application/x-xtrix-visit'

const hhmmToMinutes = (value: string): number => {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

const minutesToHHMM = (value: number): string => {
  const hour = Math.floor(value / 60)
  const minute = value % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function rangeForDay(visit: CalendarEvent, dayKey: string, timeZone: string) {
  const start = new Date(visit.date_start)
  if (Number.isNaN(start.getTime())) return null
  let end = visit.date_end ? new Date(visit.date_end) : null
  if (!end || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + FALLBACK_MINUTES * 60_000)
  }
  const startWall = isoToZonedWallTime(start.toISOString(), timeZone)
  const endWall = isoToZonedWallTime(end.toISOString(), timeZone)
  const dayIndex = Date.parse(`${dayKey}T00:00:00Z`)
  const startIndex = Date.parse(`${startWall.day}T00:00:00Z`)
  const endIndex = Date.parse(`${endWall.day}T00:00:00Z`)
  // the grid owns the half-open [00:00, 24:00) interval of its own day
  if (startIndex > dayIndex || endIndex < dayIndex) return null
  const startMin = startIndex < dayIndex ? 0 : hhmmToMinutes(startWall.time)
  const endMin = endIndex > dayIndex ? HOURS_IN_DAY * 60 : hhmmToMinutes(endWall.time)
  if (endMin <= startMin) return null
  return {
    startMin,
    endMin,
    labelStart: startWall.time,
    labelEnd: endWall.time,
  }
}

// overlapping events get side-by-side lanes inside a connected cluster
function layoutDay(visits: CalendarEvent[], dayKey: string, timeZone: string): DayEvent[] {
  const ranges: Omit<DayEvent, 'lane' | 'lanes'>[] = []
  for (const visit of visits) {
    const range = rangeForDay(visit, dayKey, timeZone)
    if (range) ranges.push({ visit, ...range })
  }
  ranges.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  const laidOut: DayEvent[] = []
  let cluster: DayEvent[] = []
  let laneEnds: number[] = []
  let clusterEnd = 0

  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((event) => event.lane + 1))
    for (const event of cluster) event.lanes = lanes
    laidOut.push(...cluster)
    cluster = []
    laneEnds = []
    clusterEnd = 0
  }

  for (const range of ranges) {
    if (cluster.length > 0 && range.startMin >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= range.startMin)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(range.endMin)
    } else {
      laneEnds[lane] = range.endMin
    }
    cluster.push({ ...range, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, range.endMin)
  }
  if (cluster.length > 0) flush()
  return laidOut
}

const STATUS_CLASS: Record<string, string> = {
  planned:
    'border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-50 dark:hover:bg-amber-900/70',
  in_progress:
    'border-blue-300 bg-blue-50 text-blue-950 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/70 dark:text-blue-50 dark:hover:bg-blue-900/70',
  completed:
    'border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-50 dark:hover:bg-emerald-900/70',
  cancelled:
    'border-rose-300 bg-rose-50 text-rose-950 line-through hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100 dark:hover:bg-rose-900/60',
}

const statusClass = (status?: string | null): string => STATUS_CLASS[status ?? ''] ?? STATUS_CLASS.planned

const overlayStyle = (interval: MinuteInterval, hourHeight: number) => ({
  top: (interval.start / 60) * hourHeight,
  height: ((interval.end - interval.start) / 60) * hourHeight,
})

export function HourAxis({ hourHeight = DEFAULT_HOUR_HEIGHT }: { hourHeight?: number }) {
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      {Array.from({ length: HOURS_IN_DAY }, (_, hour) => (
        <span
          key={hour}
          className={`absolute right-2 text-[11px] tabular-nums text-[var(--workspace-muted)] ${
            hour === 0 ? '' : '-translate-y-1/2'
          }`}
          style={{ top: hour * hourHeight + (hour === 0 ? 2 : 0) }}
        >
          {minutesToHHMM(hour * 60)}
        </span>
      ))}
    </div>
  )
}

export default function DayGrid({
  day,
  visits,
  timeZone,
  clientNames,
  onSelectVisit,
  overlay,
  preview,
  onDropVisit,
  hourHeight = DEFAULT_HOUR_HEIGHT,
  className = '',
  showHeader = true,
  showAxis = true,
  contained = true,
}: DayGridProps) {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const { visitStatus } = useLabels()
  const currency = useBusinessCurrency()

  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const dayKey = zonedDayKey(day, zone)
  const dateLocale = locale === 'ru' ? ru : locale === 'cz' ? cs : enUS
  const title = format(parseISO(dayKey), locale === 'cz' ? 'EEEE d. MMMM' : 'EEEE, d MMMM', { locale: dateLocale })
  const events = useMemo(() => layoutDay(visits, dayKey, zone), [visits, dayKey, zone])

  const previewStyle = preview && preview.dayKey === dayKey
    ? {
        top: (preview.startMin / 60) * hourHeight,
        height: Math.max(((preview.endMin - preview.startMin) / 60) * hourHeight, 30),
      }
    : null

  const handleDragStart = (visit: CalendarEvent, startMin: number, endMin: number) =>
    (dragEvent: DragEvent<HTMLElement>) => {
      if (!onDropVisit) return
      const rect = dragEvent.currentTarget.getBoundingClientRect()
      const grabOffset = Math.max(
        0,
        Math.min(((dragEvent.clientY - rect.top) / hourHeight) * 60, endMin - startMin),
      )
      dragEvent.dataTransfer.setData(
        DRAG_MIME,
        JSON.stringify({
          id: visit.id,
          grabOffsetMinutes: grabOffset,
          chainOffsetMinutes: visit.segment?.offsetMinutes ?? 0,
        }),
      )
      dragEvent.dataTransfer.effectAllowed = 'move'
    }

  const handleDrop = (dropEvent: DragEvent<HTMLDivElement>) => {
    if (!onDropVisit) return
    const raw = dropEvent.dataTransfer.getData(DRAG_MIME)
    if (!raw) return
    let payload: { id?: unknown; grabOffsetMinutes?: unknown; chainOffsetMinutes?: unknown }
    try {
      payload = JSON.parse(raw)
    } catch {
      return
    }
    if (typeof payload.id !== 'number') return
    dropEvent.preventDefault()
    const grabOffset = typeof payload.grabOffsetMinutes === 'number' ? payload.grabOffsetMinutes : 0
    const chainOffset = typeof payload.chainOffsetMinutes === 'number' ? payload.chainOffsetMinutes : 0
    const rect = dropEvent.currentTarget.getBoundingClientRect()
    const startMin = ((dropEvent.clientY - rect.top) / hourHeight) * 60 - grabOffset - chainOffset
    onDropVisit(payload.id, dayKey, startMin)
  }

  const body = (
    <div className="flex" style={{ height: HOURS_IN_DAY * hourHeight }}>
      {showAxis && (
        <div className="w-14 shrink-0">
          <HourAxis hourHeight={hourHeight} />
        </div>
      )}

      <div
        className={`relative flex-1 ${showAxis ? 'border-l border-[var(--workspace-line)]' : ''}`}
        data-calendar-grid={dayKey}
        onDragOver={(dragEvent) => {
          if (!onDropVisit) return
          dragEvent.preventDefault()
          dragEvent.dataTransfer.dropEffect = 'move'
        }}
        onDrop={handleDrop}
      >
        {Array.from({ length: HOURS_IN_DAY }, (_, hour) => (
          <div
            key={hour}
            aria-hidden="true"
            className="absolute inset-x-0 border-t border-[var(--workspace-line)]"
            style={{ top: hour * hourHeight }}
          />
        ))}

        {overlay && (
          <div className="pointer-events-none absolute inset-0">
            {overlay.nonWorking.map((interval, index) => (
              <div
                key={`off-${index}`}
                aria-hidden="true"
                className="absolute inset-x-0 bg-gray-100/70 dark:bg-gray-900/40"
                style={overlayStyle(interval, hourHeight)}
              />
            ))}
            {overlay.free.map((interval, index) => (
              <div
                key={`free-${index}`}
                aria-hidden="true"
                className="absolute inset-x-1 rounded-md border border-dashed border-emerald-400/60 bg-emerald-50/50 dark:border-emerald-700/70 dark:bg-emerald-950/25"
                style={overlayStyle(interval, hourHeight)}
                title={t('calendar.free')}
              >
                {interval.end - interval.start >= 30 && (
                  <span className="absolute left-1.5 top-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                    {t('calendar.free')}
                  </span>
                )}
              </div>
            ))}
            {overlay.blocks.map((interval, index) => (
              <div
                key={`block-${index}`}
                className="absolute inset-x-1 overflow-hidden rounded-md border border-gray-300 bg-gray-200/80 px-1.5 py-1 text-[10px] text-gray-700 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-200"
                style={overlayStyle(interval, hourHeight)}
                title={interval.label || t('calendar.blocked')}
              >
                <span className="block truncate font-medium">{t('calendar.blocked')}</span>
                {interval.end - interval.start >= 30 && interval.label && (
                  <span className="block truncate opacity-80">{interval.label}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {previewStyle && preview && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-1 z-20 overflow-hidden rounded-lg border-2 border-dashed border-[var(--workspace-accent)] bg-white/80 px-1.5 py-1 text-[10px] font-medium text-[var(--workspace-ink)] dark:bg-gray-800/80"
            style={previewStyle}
          >
            <span className="block truncate">{preview.label}</span>
          </div>
        )}

        {events.map((event) => {
              const { visit } = event
              const segment = visit.segment
              const clientName = clientNames?.get(visit.client_id) || visit.client_name
              const serviceName = segment?.serviceName || visit.service_name
              const name = clientName || serviceName || `#${visit.id}`
              const statusLabel = visitStatus(visit.status)
              const priceLabel = visit.price === null || visit.price === undefined
                ? '—'
                : formatCurrency(visit.price, currency)
              const timeLabel = `${event.labelStart}–${event.labelEnd}`
              const chainPosition = segment?.isChain
                ? segment.position !== null
                  ? t('calendar.chainPosition')
                      .replace('{position}', String(segment.position))
                      .replace('{total}', String(segment.total))
                  : t('calendar.chainServices')
                : null
              const detail = segment?.isChain
                ? [timeLabel, clientName ? serviceName : null].filter(Boolean).join(' · ')
                : `${timeLabel} · ${priceLabel}${statusLabel ? ` · ${statusLabel}` : ''}`
              const title = segment?.isChain
                ? `${name} · ${t('calendar.chain')}: ${serviceName} · ${timeLabel} · ${priceLabel}`
                : `${name} · ${detail}`
              const ariaLabel = [
                t('calendar.visit'),
                name,
                segment?.isChain ? t('calendar.chain') : '',
                chainPosition,
                segment?.isChain ? serviceName : '',
                timeLabel,
                `${t('visits.price')} ${priceLabel}`,
                statusLabel,
              ].filter(Boolean).join(', ')
              const top = (event.startMin / 60) * hourHeight
              const height = Math.max(((event.endMin - event.startMin) / 60) * hourHeight, 30)
              const width = 100 / event.lanes
              const style = {
                top,
                height,
                left: `calc(${event.lane * width}% + 2px)`,
                width: `calc(${width}% - 4px)`,
              }
              const blockClass = `absolute z-10 overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--workspace-accent)] ${statusClass(visit.status)}${segment?.isChain ? ' ring-1 ring-[var(--workspace-accent)]/40' : ''}`
              const content = (
                <>
                  {segment?.isChain && (
                    <span className="absolute right-1 top-1 rounded bg-white/85 px-1 text-[9px] font-semibold leading-4 text-slate-600 dark:bg-gray-900/70 dark:text-gray-200">
                      {segment.position !== null ? `${segment.position}/${segment.total}` : `×${segment.total}`}
                    </span>
                  )}
                  <span
                    className={`block truncate text-[11px] font-semibold leading-tight ${segment?.isChain ? 'pr-6' : ''}`}
                  >
                    {name}
                  </span>
                  <span className="block truncate text-[10px] leading-tight opacity-80">{detail}</span>
                </>
              )

              if (!onSelectVisit) {
                return (
                  <div
                    key={segment?.key ?? visit.id}
                    data-visit-id={visit.id}
                    draggable={Boolean(onDropVisit)}
                    onDragStart={handleDragStart(visit, event.startMin, event.endMin)}
                    className={blockClass}
                    style={style}
                    title={title}
                    aria-label={ariaLabel}
                  >
                    {content}
                  </div>
                )
              }
              return (
                <button
                  key={segment?.key ?? visit.id}
                  type="button"
                  data-visit-id={visit.id}
                  draggable={Boolean(onDropVisit)}
                  onDragStart={handleDragStart(visit, event.startMin, event.endMin)}
                  onClick={() => onSelectVisit(visit)}
                  className={blockClass}
                  style={style}
                  title={title}
                  aria-label={ariaLabel}
                >
                  {content}
                </button>
              )
        })}
      </div>
    </div>
  )

  return (
    <section aria-label={`${t('calendar.daySchedule')} ${title}`} className={className}>
      {showHeader && (
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--workspace-ink)]">{title}</h3>
          <span className="text-xs text-[var(--workspace-muted)]">
            {events.length === 0 ? t('calendar.noVisits') : t('calendar.daySchedule')}
          </span>
        </div>
      )}
      {contained ? (
        <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-panel)]">
          {body}
        </div>
      ) : (
        body
      )}
    </section>
  )
}
