import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cs } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [editingVisitId, setEditingVisitId] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  
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
    setSelectedDay(date)
    const start = new Date(date)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(10, 0, 0, 0)
    setSelectedSlot({ start, end })
    setEditingVisitId(undefined)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setSelectedSlot(null)
    setEditingVisitId(undefined)
    onRefresh()
    // Инвалидируем кеш статистики для Dashboard виджетов
    queryClient.invalidateQueries({ queryKey: ['visits-statistics'] })
    queryClient.invalidateQueries({ queryKey: ['clients-statistics'] })
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
              const isSelected = selectedDay && format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
              
              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(day)}
                  className={`p-2 min-h-[80px] border rounded cursor-pointer transition-colors ${
                    !isCurrentMonth ? 'text-gray-400' : ''
                  } ${isSelected ? 'bg-purple-100 border-purple-300' : isToday ? 'bg-gray-50 border-gray-300' : 'hover:bg-gray-50'}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isSelected ? 'text-purple-700' : ''}`}>
                    {day.getDate()}
                  </div>
                  {dayVisits.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                      {dayVisits.length > 1 && (
                        <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          {dayVisits.length}
                        </span>
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

