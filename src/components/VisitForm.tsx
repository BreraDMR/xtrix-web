import { useState, useEffect } from 'react'
import api from '../api/client'
import LoadingSpinner from './LoadingSpinner'
import { useAuthStore } from '../store/authStore'

interface VisitFormProps {
  visitId?: number
  onSuccess: () => void
  onCancel: () => void
  initialDateStart?: Date
  initialDateEnd?: Date
}

interface VisitData {
  client_id: number
  specialist_id: number
  service_id?: number
  date_start: string
  date_end?: string
  service_name?: string
  note?: string
  price?: number
  status: string
}

export default function VisitForm({ visitId, onSuccess, onCancel, initialDateStart, initialDateEnd }: VisitFormProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  
  const getInitialDate = (date?: Date) => {
    if (date) return date.toISOString().slice(0, 16)
    return new Date().toISOString().slice(0, 16)
  }
  
  const [formData, setFormData] = useState<VisitData>({
    client_id: 0,
    specialist_id: user?.id || 0,
    date_start: getInitialDate(initialDateStart),
    date_end: initialDateEnd ? getInitialDate(initialDateEnd) : undefined,
    status: 'planned',
  })

  useEffect(() => {
    loadClients()
    loadServices()
    if (visitId) {
      loadVisit()
    }
  }, [visitId])

  const loadClients = async () => {
    try {
      const { data } = await api.get('/clients')
      // Backend returns PaginatedResponse with items array
      setClients(Array.isArray(data) ? data : (data?.items || []))
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const loadServices = async () => {
    try {
      const { data } = await api.get('/services')
      // Backend returns PaginatedResponse with items array
      setServices(Array.isArray(data) ? data : (data?.items || []))
    } catch (error) {
      console.error('Failed to load services:', error)
    }
  }

  const loadVisit = async () => {
    try {
      const { data } = await api.get(`/visits/${visitId}`)
      setFormData({
        ...data,
        date_start: data.date_start ? new Date(data.date_start).toISOString().slice(0, 16) : '',
        date_end: data.date_end ? new Date(data.date_end).toISOString().slice(0, 16) : '',
      })
    } catch (error) {
      console.error('Failed to load visit:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        date_start: new Date(formData.date_start).toISOString(),
        date_end: formData.date_end ? new Date(formData.date_end).toISOString() : undefined,
      }

      if (visitId) {
        await api.put(`/visits/${visitId}`, submitData)
      } else {
        await api.post('/visits', submitData)
      }
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save visit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Client *</label>
        <select
          value={formData.client_id}
          onChange={(e) => setFormData({ ...formData, client_id: parseInt(e.target.value) })}
          required
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value={0}>Select client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Service</label>
        <select
          value={formData.service_id || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              service_id: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select service...</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.duration_minutes} min)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Service Name (if custom)</label>
        <input
          type="text"
          value={formData.service_name || ''}
          onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date & Time *</label>
          <input
            type="datetime-local"
            value={formData.date_start}
            onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date & Time</label>
          <input
            type="datetime-local"
            value={formData.date_end || ''}
            onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.price || ''}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={formData.note || ''}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </>
          ) : (
            visitId ? 'Update Visit' : 'Create Visit'
          )}
        </button>
      </div>
    </form>
  )
}

