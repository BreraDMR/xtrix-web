import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { cs, enUS, ru } from 'date-fns/locale'
import DayGrid, { HourAxis, zonedDayKey, type CalendarVisit } from './DayGrid'
import { useTranslation } from '../../hooks/useTranslation'
import { useLocaleStore } from '../../store/localeStore'

export interface StaffColumn {
  id: number
  name: string
}

interface StaffColumnsProps {
  day: Date
  visits: CalendarVisit[]
  staff: StaffColumn[]
  timeZone?: string
  clientNames?: ReadonlyMap<number, string>
  onSelectVisit?: (visit: CalendarVisit) => void
  hourHeight?: number
}

const HOURS_IN_DAY = 24

export default function StaffColumns({
  day,
  visits,
  staff,
  timeZone,
  clientNames,
  onSelectVisit,
  hourHeight = 64,
}: StaffColumnsProps) {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const dayKey = zonedDayKey(day, zone)
  const dateLocale = locale === 'ru' ? ru : locale === 'cz' ? cs : enUS
  const title = format(parseISO(dayKey), 'EEEE, d MMMM', { locale: dateLocale })

  const columns = useMemo(() => {
    const known = new Set(staff.map((member) => member.id))
    const extras: StaffColumn[] = []
    // a visit of a master who is no longer in the staff list still gets a column
    for (const visit of visits) {
      if (!known.has(visit.specialist_id)) {
        known.add(visit.specialist_id)
        extras.push({ id: visit.specialist_id, name: `#${visit.specialist_id}` })
      }
    }
    return [...staff, ...extras]
  }, [staff, visits])

  const visitsByStaff = useMemo(() => {
    const grouped = new Map<number, CalendarVisit[]>()
    for (const column of columns) grouped.set(column.id, [])
    for (const visit of visits) grouped.get(visit.specialist_id)?.push(visit)
    return grouped
  }, [columns, visits])

  const gridHeight = HOURS_IN_DAY * hourHeight
  const template = `3.5rem repeat(${columns.length}, minmax(12rem, 1fr))`

  return (
    <section aria-label={`${t('calendar.staffColumns')} ${title}`}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--workspace-ink)]">{title}</h3>
        <span className="text-xs text-[var(--workspace-muted)]">
          {visits.length === 0 ? t('calendar.noVisits') : t('calendar.staffColumns')}
        </span>
      </div>

      {columns.length === 0 ? (
        <p className="rounded-xl border border-[var(--workspace-line)] p-6 text-sm text-[var(--workspace-muted)]">
          {t('calendar.noStaff')}
        </p>
      ) : (
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-panel)]">
          <div className="grid" style={{ gridTemplateColumns: template }}>
            <div className="sticky left-0 top-0 z-30 border-b border-[var(--workspace-line)] bg-[var(--workspace-panel)]" />
            {columns.map((column) => (
              <div
                key={column.id}
                className="sticky top-0 z-20 truncate border-b border-l border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-2 py-2 text-xs font-semibold text-[var(--workspace-ink)]"
                title={column.name}
              >
                {column.name}
              </div>
            ))}

            <div className="sticky left-0 z-10 bg-[var(--workspace-panel)]" style={{ height: gridHeight }}>
              <HourAxis hourHeight={hourHeight} />
            </div>
            {columns.map((column) => (
              <div
                key={column.id}
                className="border-l border-[var(--workspace-line)]"
                style={{ height: gridHeight }}
              >
                <DayGrid
                  day={day}
                  visits={visitsByStaff.get(column.id) ?? []}
                  timeZone={zone}
                  clientNames={clientNames}
                  onSelectVisit={onSelectVisit}
                  hourHeight={hourHeight}
                  showHeader={false}
                  showAxis={false}
                  contained={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
