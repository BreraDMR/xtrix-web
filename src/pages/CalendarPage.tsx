import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Calendar from '../components/Calendar'
import SimpleCalendar from '../components/SimpleCalendar'
import { useTranslation } from '../hooks/useTranslation'

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
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('calendar.title')}</h1>
          <p className="page-subtitle">
            {view === 'simple' 
              ? t('calendar.simpleViewDescription')
              : t('calendar.advancedViewDescription')}
          </p>
        </div>
        <div className="segmented">
          <button
            onClick={() => setView('simple')}
            className={`segmented-item ${view === 'simple' ? 'segmented-item-active' : ''}`}
          >
            {t('calendar.simpleView')}
          </button>
          <button
            onClick={() => setView('advanced')}
            className={`segmented-item ${view === 'advanced' ? 'segmented-item-active' : ''}`}
          >
            {t('calendar.advancedView')}
          </button>
        </div>
      </div>
      {view === 'simple' ? (
        <SimpleCalendar visits={visits || []} onRefresh={() => refetch()} />
      ) : (
        <div className="card p-6">
          <Calendar visits={visits || []} onRefresh={() => refetch()} />
        </div>
      )}
    </div>
  )
}

