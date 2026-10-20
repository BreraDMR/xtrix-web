import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { addDays, format, parseISO } from 'date-fns'
import api from '../api/client'
import Calendar from '../components/Calendar'
import SimpleCalendar from '../components/SimpleCalendar'
import DayGrid, { zonedDayKey } from '../components/calendar/DayGrid'
import LoadingSpinner from '../components/LoadingSpinner'
import QueryError from '../components/QueryError'
import Button from '../ui/Button'
import { useTranslation } from '../hooks/useTranslation'
import { useMyBusiness } from '../hooks/useMyBusiness'
import { zonedWallTimeToIso } from '../utils/dates'
import ContextHint from '../components/onboarding/ContextHint'
import type { ClientOut, VisitOut } from '../api/types'

type CalendarView = 'day' | 'simple' | 'advanced'

async function fetchVisitsInRange(from: string, to: string): Promise<VisitOut[]> {
  const items: VisitOut[] = []
  let page = 1
  // a calendar day must be complete even when it has more visits than one page
  for (;;) {
    const { data } = await api.get('/visits/', {
      params: { date_from: from, date_to: to, page, per_page: 100 },
    })
    const batch: VisitOut[] = Array.isArray(data) ? data : (data?.items ?? [])
    items.push(...batch)
    const total = Array.isArray(data) ? batch.length : Number(data?.total ?? batch.length)
    if (batch.length === 0 || items.length >= total || page >= 100) break
    page += 1
  }
  return items
}

export default function CalendarPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<CalendarView>('day')
  const [day, setDay] = useState<Date>(() => {
    const value = new Date()
    value.setHours(12, 0, 0, 0)
    return value
  })
  const { data: business } = useMyBusiness()
  const timeZone = business?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  const dayKey = zonedDayKey(day, timeZone)
  const range = useMemo(() => {
    const nextKey = format(addDays(parseISO(dayKey), 1), 'yyyy-MM-dd')
    const start = zonedWallTimeToIso(dayKey, '00:00', timeZone)
    const end = new Date(
      new Date(zonedWallTimeToIso(nextKey, '00:00', timeZone)).getTime() - 1,
    ).toISOString()
    return { start, end }
  }, [dayKey, timeZone])

  const { data: visits, refetch } = useQuery<VisitOut[]>({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data } = await api.get('/visits/')
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    },
    enabled: view !== 'day',
  })

  const dayQuery = useQuery<VisitOut[]>({
    queryKey: ['visits', 'day', range.start, range.end],
    queryFn: () => fetchVisitsInRange(range.start, range.end),
    enabled: view === 'day',
  })

  const { data: clients } = useQuery<ClientOut[]>({
    queryKey: ['clients', 'calendar'],
    queryFn: async () => {
      const { data } = await api.get('/clients/', { params: { per_page: 100 } })
      return Array.isArray(data) ? data : (data?.items || [])
    },
    enabled: view === 'day',
  })

  const clientNames = useMemo(
    () => new Map((clients ?? []).map((client) => [client.id, client.full_name])),
    [clients],
  )

  const viewButtonClass = (active: boolean) => `px-4 py-2 rounded-md ${
    active
      ? 'bg-primary-600 text-white'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
  }`

  const description = view === 'day'
    ? t('calendar.dayViewDescription')
    : view === 'simple'
      ? t('calendar.simpleViewDescription')
      : t('calendar.advancedViewDescription')

  const showHint = view === 'day'
    ? !dayQuery.isLoading && !dayQuery.isError && (dayQuery.data?.length ?? 0) === 0
    : Array.isArray(visits) && visits.length === 0

  const goToToday = () => {
    const value = new Date()
    value.setHours(12, 0, 0, 0)
    setDay(value)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('calendar.title')}</h1>
          <p className="text-gray-600 mt-2 dark:text-gray-400">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setView('day')} className={viewButtonClass(view === 'day')}>
            {t('calendar.dayView')}
          </button>
          <button onClick={() => setView('simple')} className={viewButtonClass(view === 'simple')}>
            {t('calendar.simpleView')}
          </button>
          <button onClick={() => setView('advanced')} className={viewButtonClass(view === 'advanced')}>
            {t('calendar.advancedView')}
          </button>
        </div>
      </div>

      {view === 'day' && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setDay((value) => addDays(value, -1))}>
            {t('calendar.previous')}
          </Button>
          <Button variant="secondary" onClick={() => setDay((value) => addDays(value, 1))}>
            {t('calendar.next')}
          </Button>
          <Button variant="quiet" onClick={goToToday}>
            {t('calendar.today')}
          </Button>
        </div>
      )}

      {showHint && <ContextHint hint="calendar" to="/app/visits" />}

      <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
        {view === 'day' && (
          dayQuery.isError ? (
            <QueryError retry={() => dayQuery.refetch()} />
          ) : dayQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <DayGrid
              day={day}
              visits={dayQuery.data ?? []}
              timeZone={timeZone}
              clientNames={clientNames}
            />
          )
        )}
        {view === 'simple' && (
          <SimpleCalendar visits={visits || []} onRefresh={() => refetch()} />
        )}
        {view === 'advanced' && (
          <Calendar visits={visits || []} onRefresh={() => refetch()} />
        )}
      </div>
    </div>
  )
}
