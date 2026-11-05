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

interface SimpleCalendarProps {
  visits: any[]
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
    const grouped: Record<string, any[]> = {}
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

  const handleVisitClick = (visit: any) => {
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
        <span className="x-cal-count">{dayVisits.length}</span>
        <span className="x-cal-dots">
          {dayVisits.slice(0, 3).map((v: any) => (
            <span key={v.id} className="h-1.5 w-1.5 rounded-full bg-primary-600" />
          ))}
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
      <div className="card p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="badge-purple py-1">{t('calendar.monthView')}</span>
          <span className="text-[11px] font-semibold text-[#6b6b76]">
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
          className="x-calendar"
        />
      </div>

      <div className="space-y-6">
        <div className="card p-4">
          <h3 className="text-[13px] font-semibold text-[#8f8f99]">{t('calendar.selectedDay')}</h3>
          <p className="mb-3 text-[15px] font-bold capitalize">
            {format(selectedDate, 'EEEE, MMMM d', { locale: dateLocale })}
          </p>
          {showForm ? (
            <div>
              <button onClick={handleFormCancel} className="btn-ghost mb-3 px-2">
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
                <p className="text-xs font-semibold text-[#8f8f99]">{t('calendar.noVisits')}</p>
              ) : (
                dayVisits.map((visit) => (
                  <button
                    key={visit.id}
                    onClick={() => handleVisitClick(visit)}
                    className="block w-full rounded-md border border-[#c9c9d3] p-2.5 text-left hover:border-brand-purple"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold">{visit.service_name || t('visits.title')}</span>
                      <span className="text-xs font-semibold">{format(new Date(visit.date_start), 'HH:mm', { locale: dateLocale })}</span>
                    </div>
                    {visit.client_name && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#8f8f99]">
                        <span className="badge-purple px-2 py-0 text-[9px]">{visit.status ? t(`visits.${visit.status === 'in_progress' ? 'inProgress' : visit.status}` as any) : ''}</span>
                        · {visit.client_name}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-xs text-[#8f8f99]">{t('calendar.insights')}</span>
            <span className="text-[13px] font-bold">{t('calendar.insightsTitle')}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {insights.map((i) => (
              <div key={i.label} className="rounded-md bg-[#f6f1fd] p-3 dark:bg-white/5">
                <p className="text-[11px] font-bold text-[#8f8f99]">{i.label}</p>
                <p className="mt-1 text-xl font-bold">{i.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
