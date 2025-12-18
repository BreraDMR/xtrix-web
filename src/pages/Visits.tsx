import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import api from '../api/client'
import VisitForm from '../components/VisitForm'
import SearchBar from '../components/SearchBar'
import LoadingSpinner from '../components/LoadingSpinner'

interface Visit {
  id: number
  date_start: string
  service_name?: string
  status: string
  price?: number
  client_name?: string
}

export default function Visits() {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const queryClient = useQueryClient()

  const { data: visits, isLoading, refetch } = useQuery<Visit[]>({
    queryKey: ['visits'],
    queryFn: async () => {
      const { data } = await api.get('/visits')
      // Backend returns PaginatedResponse with items array
      return Array.isArray(data) ? data : (data?.items || [])
    },
  })

  const filteredVisits = useMemo(() => {
    if (!visits || !Array.isArray(visits)) return []
    
    return visits.filter((visit) => {
      const matchesSearch =
        searchQuery === '' ||
        visit.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visit.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === null || visit.status === statusFilter
      
      let matchesDate = true
      if (dateFrom) {
        const fromDate = startOfDay(new Date(dateFrom))
        const visitDate = new Date(visit.date_start)
        matchesDate = matchesDate && !isBefore(visitDate, fromDate)
      }
      if (dateTo) {
        const toDate = endOfDay(new Date(dateTo))
        const visitDate = new Date(visit.date_start)
        matchesDate = matchesDate && !isAfter(visitDate, toDate)
      }
      
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [visits, searchQuery, statusFilter, dateFrom, dateTo])

  const handleSuccess = async () => {
    setShowForm(false)
    setEditingId(undefined)
    // Invalidate and refetch to get the updated list
    await queryClient.invalidateQueries({ queryKey: ['visits'] })
    await refetch()
  }

  const handleEdit = (id: number) => {
    setEditingId(id)
    setShowForm(true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Visits</h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            New Visit
          </button>
        )}
      </div>

      {!showForm && (
        <div className="mb-6 space-y-4">
          <SearchBar
            placeholder="Search by service or client name..."
            onSearch={setSearchQuery}
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From date"
              className="px-4 py-2 border rounded-md"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To date"
              className="px-4 py-2 border rounded-md"
            />
            {(searchQuery || statusFilter || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter(null)
                  setDateFrom('')
                  setDateTo('')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border rounded-md"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <VisitForm
            visitId={editingId}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingId(undefined)
            }}
          />
        </div>
      ) : (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery || statusFilter || dateFrom || dateTo
                    ? 'No visits match your filters'
                    : 'No visits found'}
                </td>
              </tr>
            ) : (
              filteredVisits.map((visit) => (
              <tr key={visit.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(visit.date_start), 'PPp')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {visit.service_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {visit.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {visit.price ? `$${visit.price.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => handleEdit(visit.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      )}
    </div>
  )
}

