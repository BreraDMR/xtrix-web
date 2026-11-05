import { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cs } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
import 'react-calendar/dist/Calendar.css'
import VisitForm from './VisitForm'
import { useTranslation } from '../hooks/useTranslation'
import { useLocaleStore } from '../store/localeStore'
import type { VisitOut } from '../api/types'

interface SimpleCalendarProps {
  visits: VisitOut[]
  onRefresh: () => void
}

export default function SimpleCalendar({ visits, onRefresh }: SimpleCalendarProps) {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [editingVisitId, setEditingVisitId] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  
  const dateLocale = locale === 'ru' ? ru : locale === 'cz' ? cs : enUS

  const visitsByDate = useMemo(() => {
    const grouped: Record<string, VisitOut[]> = {}
    visits.forEach((visit) => {
      const dateKey = format(new Date(visit.date_start), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(visit)
    })
    return grouped
  }, [visits])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const start = new Date(date)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(10, 0, 0, 0)
    setSelectedSlot({ start, end })
    setEditingVisitId(undefined)
    setShowForm(true)
  }

  const handleVisitClick = (visit: VisitOut) => {
    setEditingVisitId(visit.id)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedSlot(null)
    setEditingVisitId(undefined)
    onRefresh()
    queryClient.invalidateQueries({ queryKey: ['visits-statistics'] })
    queryClient.invalidateQueries({ queryKey: ['clients-statistics'] })
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedSlot(null)
    setEditingVisitId(undefined)
  }

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    const dateKey = format(date, 'yyyy-MM-dd')
    const dayVisits = visitsByDate[dateKey] || []
    if (dayVisits.length === 0) return null

    return (
      <>
        <span className="absolute right-2 top-2 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#7c3aed] px-1 text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(124,58,237,0.35)]">
          {dayVisits.length}
        </span>
        <span className="mt-auto flex gap-1">
          {dayVisits.slice(0, 3).map((visit) => <span key={visit.id} className="h-1.5 w-1.5 rounded-full bg-primary-600" />)}
        </span>
      </>
    )
  }

  const totalEventsThisMonth = useMemo(() => {
    const currentMonth = selectedDate.getMonth()
    const currentYear = selectedDate.getFullYear()
    return visits.filter((visit) => {
      const visitDate = new Date(visit.date_start)
      return visitDate.getMonth() === currentMonth && visitDate.getFullYear() === currentYear
    }).length
  }, [visits, selectedDate])

  const dayVisits = visitsByDate[format(selectedDate, 'yyyy-MM-dd')] || []

  const insights = [
    { label: t('visits.completed'), value: visits.filter((v) => v.status === 'completed').length },
    { label: t('visits.planned'), value: visits.filter((v) => v.status === 'planned').length },
    { label: t('visits.inProgress'), value: visits.filter((v) => v.status === 'in_progress').length },
    { label: t('visits.cancelled'), value: visits.filter((v) => v.status === 'cancelled').length },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <div className="ui-card p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#d9c5f8] bg-[#e9dcfb] px-3 py-1 text-[11px] font-bold text-[#7c3aed]">
            {t('calendar.monthView')}
          </span>
          <span className="text-[11px] font-semibold text-[var(--workspace-muted)]">
            {totalEventsThisMonth} {t('calendar.eventsThisMonth')}
          </span>
        </div>
        <Calendar
          onChange={(value) => {
            if (value instanceof Date) {
              setSelectedDate(value)
            } else if (Array.isArray(value) && value[0] instanceof Date) {
              setSelectedDate(value[0])
            }
          }}
          value={selectedDate}
          onClickDay={handleDateClick}
          tileContent={tileContent}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        {}
        <div className="ui-card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 dark:text-gray-300">{t('calendar.selectedDay')}</h3>
          <p className="text-lg font-bold text-gray-900 mb-2 dark:text-gray-100">
            {format(selectedDate, 'EEEE, MMMM d', { locale: dateLocale })}
          </p>
          {showForm ? (
            <div>
              <button
                onClick={handleFormCancel}
                className="mb-4 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← {t('common.cancel')}
              </button>
              <VisitForm
                visitId={editingVisitId}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                initialDateStart={selectedSlot?.start}
                initialDateEnd={selectedSlot?.end}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {dayVisits.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('calendar.noVisits')}</p>
              ) : (
                dayVisits.map((visit) => (
                  <div
                    key={visit.id}
                    onClick={() => handleVisitClick(visit)}
                    className="cursor-pointer rounded-md border border-[var(--workspace-control)] p-2.5 transition-colors hover:border-[#9f5aef]"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {visit.service_name || t('visits.title')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(visit.date_start), 'HH:mm', { locale: dateLocale })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {}
        <div className="ui-card p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 dark:text-gray-300">{t('calendar.insights')}</h3>
          <p className="text-xs text-gray-500 mb-3 dark:text-gray-400">{t('calendar.insightsTitle')}</p>
          <div className="grid grid-cols-2 gap-3">
            {insights.map((item) => (
              <div key={item.label} className="rounded-md bg-[#f6f1fd] p-3 dark:bg-white/5">
                <p className="text-[11px] font-bold text-[var(--workspace-muted)]">{item.label}</p>
                <p className="mt-1 text-xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


