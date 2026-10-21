import { useMemo } from 'react'
import { addDays, format } from 'date-fns'
import { cs, enUS, ru } from 'date-fns/locale'
import DayGrid, {
  HourAxis,
  type CalendarVisit,
  type MovePreview,
} from './DayGrid'
import { chainOverview } from './chain'
import { zonedDayKey } from '../../utils/dates'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocaleStore } from '../../store/localeStore'

interface WeekGridProps {
  weekStart: Date
  visits: CalendarVisit[]
  timeZone?: string
  clientNames?: ReadonlyMap<number, string>
  onSelectVisit?: (visit: CalendarVisit) => void
  preview?: MovePreview
  onDropVisit?: (visitId: number, dayKey: string, startMin: number) => void
  hourHeight?: number
}

const DAYS_IN_WEEK = 7
const HOURS_IN_DAY = 24

export default function WeekGrid({
  weekStart,
  visits,
  timeZone,
  clientNames,
  onSelectVisit,
  preview,
  onDropVisit,
  hourHeight = 64,
}: WeekGridProps) {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const dateLocale = locale === 'ru' ? ru : locale === 'cz' ? cs : enUS

  const days = useMemo(
    () => Array.from({ length: DAYS_IN_WEEK }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  )
  const events = useMemo(() => visits.map(chainOverview), [visits])
  const todayKey = zonedDayKey(new Date(), zone)
  const title = `${format(weekStart, 'd MMM', { locale: dateLocale })} – ${format(
    addDays(weekStart, DAYS_IN_WEEK - 1),
    'd MMM yyyy',
    { locale: dateLocale },
  )}`
  const gridHeight = HOURS_IN_DAY * hourHeight

  return (
    <section aria-label={`${t('calendar.weekView')} ${title}`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--workspace-ink)]">{title}</h3>
        <span className="text-xs text-[var(--workspace-muted)]">
          {visits.length === 0 ? t('calendar.noVisits') : t('calendar.weekView')}
        </span>
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-panel)]">
        <div
          className="grid"
          style={{ gridTemplateColumns: `3.5rem repeat(${DAYS_IN_WEEK}, minmax(8rem, 1fr))` }}
        >
          <div className="sticky left-0 top-0 z-30 border-b border-[var(--workspace-line)] bg-[var(--workspace-panel)]" />
          {days.map((date) => {
            const isToday = zonedDayKey(date, zone) === todayKey
            return (
              <div
                key={date.toISOString()}
                className={`sticky top-0 z-20 border-b border-l border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-2 py-2 text-xs font-semibold ${
                  isToday ? 'text-[var(--workspace-accent)]' : 'text-[var(--workspace-ink)]'
                }`}
              >
                {format(date, 'EEE d', { locale: dateLocale })}
              </div>
            )
          })}

          <div className="sticky left-0 z-10 bg-[var(--workspace-panel)]" style={{ height: gridHeight }}>
            <HourAxis hourHeight={hourHeight} />
          </div>
          {days.map((date) => (
            <div
              key={date.toISOString()}
              className="border-l border-[var(--workspace-line)]"
              style={{ height: gridHeight }}
            >
              <DayGrid
                day={date}
                visits={events}
                timeZone={zone}
                clientNames={clientNames}
                onSelectVisit={onSelectVisit}
                preview={preview}
                onDropVisit={onDropVisit}
                hourHeight={hourHeight}
                showHeader={false}
                showAxis={false}
                contained={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
