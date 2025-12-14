import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import Calendar from '../components/Calendar'
import SimpleCalendar from '../components/SimpleCalendar'

export default function CalendarPage() {
  const [view, setView] = useState<'simple' | 'advanced'>('simple')
  
  const { data: visits, refetch } = useQuery({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data } = await api.get('/visits')
      return data
    },
  })

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-gray-600 mt-2">
            {view === 'simple' 
              ? 'Click on a date to create a visit, or click on an existing visit to edit it.'
              : 'Click on a time slot to create a visit, or click on an existing visit to edit it.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('simple')}
            className={`px-4 py-2 rounded-md ${
              view === 'simple'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Simple View
          </button>
          <button
            onClick={() => setView('advanced')}
            className={`px-4 py-2 rounded-md ${
              view === 'advanced'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Advanced View
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        {view === 'simple' ? (
          <SimpleCalendar visits={visits || []} onRefresh={() => refetch()} />
        ) : (
          <Calendar visits={visits || []} onRefresh={() => refetch()} />
        )}
      </div>
    </div>
  )
}

