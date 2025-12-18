import { useState, useEffect } from 'react'
import api from '../api/client'
import LoadingSpinner from './LoadingSpinner'
import { useAuthStore } from '../store/authStore'

interface ServiceFormProps {
  serviceId?: number
  onSuccess: () => void
  onCancel: () => void
}

interface ServiceData {
  name: string
  duration_minutes: number
  price: number
  features?: string
  is_active: boolean
  specialist_id: number
}

export default function ServiceForm({ serviceId, onSuccess, onCancel }: ServiceFormProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ServiceData>({
    name: '',
    duration_minutes: 60,
    price: 0,
    is_active: true,
    specialist_id: user?.id || 0,
  })

  // Update specialist_id when user loads
  useEffect(() => {
    if (user?.id && !serviceId) {
      setFormData(prev => ({ ...prev, specialist_id: user.id }))
    }
  }, [user?.id, serviceId])

  useEffect(() => {
    if (serviceId) {
      loadService()
    }
  }, [serviceId])

  const loadService = async () => {
    try {
      const { data } = await api.get(`/services/${serviceId}`)
      setFormData(data)
    } catch (error) {
      console.error('Failed to load service:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that specialist_id is set
    if (!formData.specialist_id || formData.specialist_id === 0) {
      alert('Error: User not loaded. Please try again.')
      return
    }
    
    setLoading(true)

    try {
      // Prepare data for API - remove any undefined fields
      const submitData: any = {
        name: formData.name,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        is_active: formData.is_active,
        specialist_id: formData.specialist_id,
      }
      
      // Only include features if it has a value
      if (formData.features) {
        submitData.features = formData.features
      }
      
      if (serviceId) {
        await api.put(`/services/${serviceId}`, submitData)
      } else {
        await api.post('/services', submitData)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Service save error:', error)
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error?.message ||
                          error.message || 
                          'Failed to save service'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Service Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., Facial Treatment"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
          <input
            type="number"
            min="1"
            value={formData.duration_minutes}
            onChange={(e) =>
              setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })
            }
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
            }
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Features / Description</label>
        <textarea
          value={formData.features || ''}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Service features and description"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm font-medium">Active</span>
        </label>
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
            serviceId ? 'Update Service' : 'Create Service'
          )}
        </button>
      </div>
    </form>
  )
}

