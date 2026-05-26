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

  const tileContent = ({ date }: { date: Date }) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const dayVisits = visitsByDate[dateKey] || []
    if (dayVisits.length === 0) return null

    return (
      <div className="mt-1 flex items-center justify-center gap-1">
        <div className="w-2 h-2 rounded-full bg-purple-600"></div>
        {dayVisits.length > 1 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
            {dayVisits.length}
          </span>
        )}
      </div>
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium">
            {t('calendar.monthView')}
          </button>
          <span className="text-sm text-gray-500">
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
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('calendar.selectedDay')}</h3>
          <p className="text-lg font-bold text-gray-900 mb-2">
            {format(selectedDate, 'EEEE, MMMM d', { locale: dateLocale })}
          </p>
          {showForm ? (
            <div>
              <button
                onClick={handleFormCancel}
                className="mb-4 text-sm text-gray-600 hover:text-gray-800"
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
                <p className="text-sm text-gray-500">{t('calendar.noVisits')}</p>
              ) : (
                dayVisits.map((visit) => (
                  <div
                    key={visit.id}
                    onClick={() => handleVisitClick(visit)}
                    className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {visit.service_name || t('visits.title')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(visit.date_start), 'HH:mm', { locale: dateLocale })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('calendar.insights')}</h3>
          <p className="text-xs text-gray-500 mb-3">{t('calendar.insightsTitle')}</p>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-bold text-purple-600">
                {visits.filter((v) => v.status === 'completed' || v.status === 'in_progress').length}
              </p>
              <p className="text-xs text-gray-600">Meetings</p>
              <p className="text-xs text-gray-500">sync/planning</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600">
                {visits.filter((v) => v.status === 'planned').length}
              </p>
              <p className="text-xs text-gray-600">Calls</p>
              <p className="text-xs text-gray-500">clients</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600">
                {visits.filter((v) => v.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-600">Finance</p>
              <p className="text-xs text-gray-500">Invoices</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600">
                {visits.filter((v) => v.status === 'cancelled').length}
              </p>
              <p className="text-xs text-gray-600">Releases</p>
              <p className="text-xs text-gray-500">Deploy windows</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


