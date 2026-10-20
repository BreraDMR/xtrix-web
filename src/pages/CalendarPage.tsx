import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Calendar from '../components/Calendar'
import SimpleCalendar from '../components/SimpleCalendar'
import { useTranslation } from '../hooks/useTranslation'
import ContextHint from '../components/onboarding/ContextHint'

export default function CalendarPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<'simple' | 'advanced'>('simple')
  
  const { data: visits, refetch } = useQuery({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data } = await api.get('/visits/')
      return Array.isArray(data) ? data : (data?.items || data?.data || [])
    },
  })

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('calendar.title')}</h1>
          <p className="text-gray-600 mt-2 dark:text-gray-400">
            {view === 'simple' 
              ? t('calendar.simpleViewDescription')
              : t('calendar.advancedViewDescription')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('simple')}
            className={`px-4 py-2 rounded-md ${
              view === 'simple'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('calendar.simpleView')}
          </button>
          <button
            onClick={() => setView('advanced')}
            className={`px-4 py-2 rounded-md ${
              view === 'advanced'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('calendar.advancedView')}
          </button>
        </div>
      </div>
      {Array.isArray(visits) && visits.length === 0 && (
        <ContextHint hint="calendar" to="/app/visits" />
      )}
      <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
        {view === 'simple' ? (
          <SimpleCalendar visits={visits || []} onRefresh={() => refetch()} />
        ) : (
          <Calendar visits={visits || []} onRefresh={() => refetch()} />
        )}
      </div>
    </div>
  )
}

