import { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import { format } from 'date-fns'
import 'react-calendar/dist/Calendar.css'
import VisitForm from './VisitForm'
import { useLocaleStore } from '../store/localeStore'
import { t } from '../i18n/translations'
import { formatDate, dateFormats } from '../utils/dateFormat'

interface SimpleCalendarProps {
  visits: any[]
  onRefresh: () => void
}

export default function SimpleCalendar({ visits, onRefresh }: SimpleCalendarProps) {
  const { locale } = useLocaleStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [editingVisitId, setEditingVisitId] = useState<number | undefined>()
  const [showForm, setShowForm] = useState(false)

  const visitsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    if (!visits || !Array.isArray(visits)) return grouped
    
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

    const visitText = dayVisits.length === 1 
      ? t('visits', locale).slice(0, -1) // Remove 's' from plural if needed
      : t('visits', locale)
    return (
      <div className="mt-1">
        <div className="text-xs text-blue-600 font-semibold">
          {dayVisits.length} {visitText}
        </div>
      </div>
    )
  }

  const dayVisits = visitsByDate[format(selectedDate, 'yyyy-MM-dd')] || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Calendar
          onChange={(value) => setSelectedDate(value as Date)}
          value={selectedDate}
          onClickDay={handleDateClick}
          tileContent={tileContent}
          className="w-full"
          locale={locale === 'cz' ? 'cs' : locale}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          {t('visitsFor', locale)} {formatDate(selectedDate, dateFormats.calendar(locale), locale)}
        </h3>
        {showForm ? (
          <div className="bg-white p-4 rounded-lg shadow">
            <button
              onClick={handleFormCancel}
              className="mb-4 text-sm text-gray-600 hover:text-gray-800"
            >
              ← {t('cancel', locale)}
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
              <p className="text-gray-500">{t('noVisits', locale)}</p>
            ) : (
              dayVisits.map((visit) => (
                <div
                  key={visit.id}
                  onClick={() => handleVisitClick(visit)}
                  className="p-3 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {visit.service_name || 'Visit'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(visit.date_start, dateFormats.time(locale), locale)}
                        {visit.date_end && ` - ${formatDate(visit.date_end, dateFormats.time(locale), locale)}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        visit.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : visit.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : visit.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {visit.status}
                    </span>
                  </div>
                  {visit.price && (
                    <p className="text-sm text-gray-500 mt-1">{visit.price.toFixed(2)}</p>
                  )}
                </div>
              ))
            )}
            <button
              onClick={() => {
                const start = new Date(selectedDate)
                start.setHours(9, 0, 0, 0)
                const end = new Date(start)
                end.setHours(10, 0, 0, 0)
                setSelectedSlot({ start, end })
                setEditingVisitId(undefined)
                setShowForm(true)
              }}
              className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('addVisit', locale)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}











