import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cs } from 'date-fns/locale'
import VisitForm from './VisitForm'
import { useTranslation } from '../hooks/useTranslation'
import { useLocaleStore } from '../store/localeStore'

interface CalendarProps {
  visits: any[]
  onRefresh: () => void
}

export default function Calendar({ visits, onRefresh }: CalendarProps) {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [editingVisitId, setEditingVisitId] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const dateLocale = locale === 'ru' ? ru : locale === 'cz' ? cs : undefined

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
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedSlot(null)
    setEditingVisitId(undefined)
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []
    
    // Add days from previous month to fill first week
    const startDay = firstDay.getDay()
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(firstDay)
      date.setDate(date.getDate() - i - 1)
      days.push(date)
    }
    
    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    // Add days from next month to fill last week
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(lastDay)
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    
    return days
  }

  const days = getDaysInMonth()
  
  // Week days based on locale
  const weekDays = useMemo(() => {
    if (!dateLocale) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(2024, 0, i + 1) // January 2024, days 1-7
      days.push(format(date, 'EEE', { locale: dateLocale }))
    }
    return days
  }, [dateLocale])

  return (
    <div>
      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={handleFormCancel}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← {t('calendar.backToCalendar')}
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
        <div>
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                const prev = new Date(currentMonth)
                prev.setMonth(prev.getMonth() - 1)
                setCurrentMonth(prev)
              }}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              ← {t('calendar.previous')}
            </button>
            <h2 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}
            </h2>
            <button
              onClick={() => {
                const next = new Date(currentMonth)
                next.setMonth(next.getMonth() + 1)
                setCurrentMonth(next)
              }}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              {t('calendar.next')} →
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center font-semibold text-gray-700">
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayVisits = visitsByDate[dateKey] || []
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              
              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  className={`p-2 min-h-[80px] border rounded cursor-pointer hover:bg-blue-50 transition-colors ${
                    !isCurrentMonth ? 'text-gray-400' : ''
                  } ${isToday ? 'bg-blue-100 border-blue-300' : ''}`}
                >
                  <div className="text-sm font-medium mb-1">{day.getDate()}</div>
                  {dayVisits.length > 0 && (
                    <div className="space-y-1">
                      {dayVisits.slice(0, 2).map((visit) => (
                        <div
                          key={visit.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVisitClick(visit)
                          }}
                          className={`text-xs p-1 rounded truncate ${
                            visit.status === 'completed'
                              ? 'bg-green-200 text-green-800'
                              : visit.status === 'cancelled'
                              ? 'bg-red-200 text-red-800'
                              : visit.status === 'in_progress'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}
                          title={visit.service_name || 'Visit'}
                        >
                          {format(new Date(visit.date_start), 'HH:mm', { locale: dateLocale })} {visit.service_name || t('visits.title')}
                        </div>
                      ))}
                      {dayVisits.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayVisits.length - 2} {t('calendar.more')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

