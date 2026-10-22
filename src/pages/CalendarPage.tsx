import { useMemo, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { addDays, startOfWeek } from 'date-fns'
import api from '../api/client'
import { allPages } from '../api/allPages'
import Calendar from '../components/Calendar'
import SimpleCalendar from '../components/SimpleCalendar'
import { zonedDayKey } from '../utils/dates'
import type { CalendarVisit, MovePreview } from '../components/calendar/DayGrid'
import StaffColumns, { type StaffColumn } from '../components/calendar/StaffColumns'
import WeekGrid from '../components/calendar/WeekGrid'
import MoveVisitDialog from '../components/calendar/MoveVisitDialog'
import FormError from '../components/FormError'
import { apiErrorMessage, apiErrorStatus } from '../api/errors'
import type { StaffScheduleData } from '../components/calendar/schedule'
import LoadingSpinner from '../components/LoadingSpinner'
import QueryError from '../components/QueryError'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useTranslation } from '../hooks/useTranslation'
import { useMyBusiness } from '../hooks/useMyBusiness'
import { useAuthStore } from '../store/authStore'
import { zonedWallTimeToIso } from '../utils/dates'
import ContextHint from '../components/onboarding/ContextHint'
import type {
  BlockSlotOut,
  Schema,
  ScheduleExceptionOut,
  VisitOut,
  WorkScheduleOut,
} from '../api/types'

type CalendarView = 'day' | 'week' | 'simple' | 'advanced'

interface EmployeeRow {
  employee_user_id: number
  employee_user?: { full_name?: string; email?: string | null } | null
}

interface DragPreview {
  visit: CalendarVisit
  dayKey: string
  startMin: number
  endMin: number
}

const MINUTES_IN_DAY = 24 * 60

const visitDurationMinutes = (visit: VisitOut): number => {
  const start = new Date(visit.date_start).getTime()
  const end = visit.date_end ? new Date(visit.date_end).getTime() : Number.NaN
  const minutes = (end - start) / 60_000
  // a visit without a usable end is previewed and moved as one hour, like the grid draws it
  return Number.isFinite(minutes) && minutes > 0 ? Math.min(Math.round(minutes), MINUTES_IN_DAY) : 60
}

const formatMinutes = (value: number): string =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`

async function fetchVisits(from?: string, to?: string, signal?: AbortSignal): Promise<VisitOut[]> {
  return allPages<VisitOut>(async page => (await api.get<Schema<'PaginatedResponse_VisitOut_'>>('/visits/', {
    params: { date_from: from, date_to: to, page, per_page: 100 }, signal,
  })).data)
}

// Noon on the salon's calendar date. Date maths below runs in the browser zone, and noon keeps
// the day from slipping when the two zones are hours apart.
function salonToday(timeZone: string): Date {
  const [year, month, date] = zonedDayKey(new Date(), timeZone).split('-').map(Number)
  return new Date(year, month - 1, date, 12)
}

export default function CalendarPage() {
  const { t } = useTranslation()
  const { user, sessionRevision } = useAuthStore()
  const [view, setView] = useState<CalendarView>('day')
  // null = follow the salon's today; it only becomes a fixed date once someone moves through days
  const [pickedDay, setPickedDay] = useState<Date | null>(null)
  const [selectedVisit, setSelectedVisit] = useState<CalendarVisit | null>(null)
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null)
  const [moveError, setMoveError] = useState('')
  const [moveSaving, setMoveSaving] = useState(false)
  const { data: business } = useMyBusiness()
  const timeZone = business?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const today = useMemo(() => salonToday(timeZone), [timeZone])
  const day = pickedDay ?? today
  const dayKey = zonedDayKey(day, timeZone)

  const isRangeView = view === 'day' || view === 'week'
  const weekStart = useMemo(() => startOfWeek(day, { weekStartsOn: 1 }), [day])
  const range = useMemo(() => {
    const startDate = view === 'week' ? weekStart : day
    const endDate = view === 'week' ? addDays(weekStart, 7) : addDays(day, 1)
    const start = zonedWallTimeToIso(zonedDayKey(startDate, timeZone), '00:00', timeZone)
    const end = new Date(
      new Date(zonedWallTimeToIso(zonedDayKey(endDate, timeZone), '00:00', timeZone)).getTime() - 1,
    ).toISOString()
    return { start, end }
  }, [day, weekStart, view, timeZone])

  const legacyQuery = useQuery<VisitOut[]>({
    queryKey: ['visits', 'calendar', 'all', sessionRevision, user?.id, user?.business_id, user?.employer_id],
    queryFn: ({ signal }) => fetchVisits(undefined, undefined, signal),
    enabled: !isRangeView,
  })
  const { data: visits, refetch } = legacyQuery

  const rangeQuery = useQuery<VisitOut[]>({
    queryKey: ['visits', 'calendar', 'range', sessionRevision, user?.id, user?.business_id, user?.employer_id, range.start, range.end],
    queryFn: ({ signal }) => fetchVisits(range.start, range.end, signal),
    enabled: isRangeView,
  })

  const managesStaff = user?.role === 'admin' || user?.role === 'business_owner'
  const { data: employees } = useQuery<EmployeeRow[]>({
    queryKey: ['employees', true],
    queryFn: async () => {
      const { data } = await api.get('/employees/', { params: { is_active: true } })
      return Array.isArray(data) ? data : []
    },
    enabled: view === 'day' && managesStaff,
  })

  const staff = useMemo<StaffColumn[]>(() => {
    if (!user) return []
    const rows: StaffColumn[] = [{ id: user.id, name: user.full_name }]
    if (managesStaff) {
      for (const employee of employees ?? []) {
        if (rows.some((row) => row.id === employee.employee_user_id)) continue
        rows.push({
          id: employee.employee_user_id,
          name: employee.employee_user?.full_name
            || employee.employee_user?.email
            || `#${employee.employee_user_id}`,
        })
      }
    }
    return rows
  }, [user, employees, managesStaff])

  const clientNames = useMemo(() => {
    const names = new Map<number, string>()
    for (const visit of rangeQuery.data ?? []) {
      if (visit.client_name) names.set(visit.client_id, visit.client_name)
    }
    return names
  }, [rangeQuery.data])

  const selectedVisitName = selectedVisit
    ? clientNames.get(selectedVisit.client_id)
      || selectedVisit.client_name
      || selectedVisit.service_name
      || `#${selectedVisit.id}`
    : ''

  const dragPreviewName = dragPreview
    ? clientNames.get(dragPreview.visit.client_id)
      || dragPreview.visit.client_name
      || dragPreview.visit.service_name
      || `#${dragPreview.visit.id}`
    : ''

  const handleDropVisit = (visitId: number, targetDayKey: string, rawStartMin: number) => {
    const visit = (rangeQuery.data ?? []).find((item) => item.id === visitId)
    if (!visit) return
    const duration = visitDurationMinutes(visit)
    const snapped = Math.round(rawStartMin / 5) * 5
    const startMin = Math.max(0, Math.min(MINUTES_IN_DAY - duration, snapped))
    setMoveError('')
    setDragPreview({ visit, dayKey: targetDayKey, startMin, endMin: startMin + duration })
  }

  const cancelDragPreview = () => {
    if (moveSaving) return
    setDragPreview(null)
    setMoveError('')
  }

  const confirmDragMove = async () => {
    if (!dragPreview || moveSaving) return
    const startIso = zonedWallTimeToIso(
      dragPreview.dayKey,
      formatMinutes(dragPreview.startMin),
      timeZone,
    )
    const payload: { date_start: string; date_end?: string } = { date_start: startIso }
    if (dragPreview.visit.date_end) {
      const duration = dragPreview.endMin - dragPreview.startMin
      payload.date_end = new Date(new Date(startIso).getTime() + duration * 60_000).toISOString()
    }

    setMoveSaving(true)
    setMoveError('')
    try {
      await api.put(`/visits/${dragPreview.visit.id}`, payload)
      // only a confirmed, accepted move removes the old block
      setDragPreview(null)
      rangeQuery.refetch()
    } catch (error) {
      setDragPreview(null)
      setMoveError(
        apiErrorStatus(error) === 409
          ? t('calendar.moveConflict')
          : apiErrorMessage(error, t('calendar.moveError')),
      )
    } finally {
      setMoveSaving(false)
    }
  }

  const movePreview: MovePreview | undefined = dragPreview
    ? {
        dayKey: dragPreview.dayKey,
        startMin: dragPreview.startMin,
        endMin: dragPreview.endMin,
        label: `${t('calendar.moveSubmit')} ${formatMinutes(dragPreview.startMin)}–${formatMinutes(dragPreview.endMin)}`,
      }
    : undefined

  const scheduleQueries = useQueries({
    queries: view === 'day'
      ? staff.map((member) => ({
          queryKey: ['schedules', 'calendar', member.id, dayKey],
          queryFn: async (): Promise<StaffScheduleData> => {
            const params = { specialist_id: member.id }
            // each source is read on its own: a forbidden endpoint must not fake a closed day
            const [work, blocks, exceptions] = await Promise.all([
              api.get('/schedules/work', { params })
                .then((response) => response.data as WorkScheduleOut[])
                .catch(() => null),
              api.get('/schedules/blocks', { params })
                .then((response) => response.data as BlockSlotOut[])
                .catch(() => null),
              api.get('/schedules/exceptions', { params: { ...params, date_from: dayKey, date_to: dayKey } })
                .then((response) => response.data as ScheduleExceptionOut[])
                .catch(() => null),
            ])
            return {
              work: work ?? [],
              blocks: blocks ?? [],
              exceptions: exceptions ?? [],
              complete: work !== null && blocks !== null && exceptions !== null,
            }
          },
          staleTime: 60_000,
        }))
      : [],
  })

  const schedules = useMemo(() => {
    const byStaff = new Map<number, StaffScheduleData>()
    staff.forEach((member, index) => {
      const data = scheduleQueries[index]?.data
      if (data) byStaff.set(member.id, data)
    })
    return byStaff
  }, [staff, scheduleQueries])

  const description = view === 'day'
    ? t('calendar.dayViewDescription')
    : view === 'week'
      ? t('calendar.weekViewDescription')
      : view === 'simple'
        ? t('calendar.simpleViewDescription')
        : t('calendar.advancedViewDescription')

  const showHint = isRangeView
    ? !rangeQuery.isLoading && !rangeQuery.isError && (rangeQuery.data?.length ?? 0) === 0
    : !legacyQuery.isLoading && !legacyQuery.isError && Array.isArray(visits) && visits.length === 0

  const goToToday = () => setPickedDay(null)

  return (
    <div>
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">{t('calendar.title')}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
        <label className="flex w-full items-center gap-3 text-xs text-[var(--workspace-muted)] sm:w-auto">
          <span className="shrink-0">{t('calendar.view')}</span>
          <Select aria-label={t('calendar.view')} value={view} className="sm:w-48"
            onChange={event => setView(event.target.value as CalendarView)}>
            <option value="day">{t('calendar.dayView')}</option>
            <option value="week">{t('calendar.weekView')}</option>
            <option value="simple">{t('calendar.simpleView')}</option>
            <option value="advanced">{t('calendar.advancedView')}</option>
          </Select>
        </label>
      </div>

      {isRangeView && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setPickedDay(addDays(day, view === 'week' ? -7 : -1))}
          >
            {t('calendar.previous')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPickedDay(addDays(day, view === 'week' ? 7 : 1))}
          >
            {t('calendar.next')}
          </Button>
          <Button variant="quiet" onClick={goToToday}>
            {t('calendar.today')}
          </Button>
        </div>
      )}

      {showHint && <ContextHint hint="calendar" to="/app/visits" />}

      {moveError && (
        <div role="alert" className="mb-4">
          <FormError message={moveError} />
        </div>
      )}

      <div className="ui-card min-w-0 p-3 sm:p-4">
        {isRangeView && (
          rangeQuery.isError ? (
            <QueryError retry={() => rangeQuery.refetch()} />
          ) : rangeQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : view === 'day' ? (
            <StaffColumns
              day={day}
              visits={rangeQuery.data ?? []}
              staff={staff}
              schedules={schedules}
              timeZone={timeZone}
              clientNames={clientNames}
              onSelectVisit={setSelectedVisit}
              preview={movePreview}
              onDropVisit={handleDropVisit}
            />
          ) : (
            <WeekGrid
              weekStart={weekStart}
              visits={rangeQuery.data ?? []}
              timeZone={timeZone}
              clientNames={clientNames}
              onSelectVisit={setSelectedVisit}
              preview={movePreview}
              onDropVisit={handleDropVisit}
            />
          )
        )}
        {!isRangeView && (legacyQuery.isError ? (
          <QueryError retry={() => refetch()} />
        ) : legacyQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
        ) : view === 'simple' ? (
          <SimpleCalendar visits={visits || []} onRefresh={() => refetch()} />
        ) : (
          <Calendar visits={visits || []} onRefresh={() => refetch()} />
        ))}
      </div>

      {dragPreview && (
        <div
          role="region"
          aria-live="polite"
          aria-label={t('calendar.moveTitle')}
          className="fixed inset-x-4 bottom-20 z-40 lg:bottom-4 mx-auto max-w-xl rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-panel)] p-4 shadow-xl"
        >
          <p className="text-sm font-medium text-[var(--workspace-ink)]">
            {t('calendar.moveTitle')}: {dragPreviewName}
          </p>
          <p className="mt-1 text-xs text-[var(--workspace-muted)]">
            {dragPreview.dayKey} · {formatMinutes(dragPreview.startMin)}–{formatMinutes(dragPreview.endMin)}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={cancelDragPreview} disabled={moveSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmDragMove} disabled={moveSaving}>
              {moveSaving ? t('calendar.moving') : t('calendar.moveSubmit')}
            </Button>
          </div>
        </div>
      )}

      {selectedVisit && (
        <MoveVisitDialog
          visit={selectedVisit}
          name={selectedVisitName}
          timeZone={timeZone}
          onClose={() => setSelectedVisit(null)}
          onMoved={() => {
            setSelectedVisit(null)
            rangeQuery.refetch()
          }}
        />
      )}
    </div>
  )
}
