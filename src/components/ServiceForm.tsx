import { useState, useEffect } from 'react'
import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
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
  description?: string
  is_active: boolean
  specialist_id: number
  specialist_ids?: number[]
}

interface Specialist {
  id: number
  full_name: string
  email: string
  phone?: string
}

export default function ServiceForm({ serviceId, onSuccess, onCancel }: ServiceFormProps) {
  const { user: currentUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [availableSpecialists, setAvailableSpecialists] = useState<Specialist[]>([])
  const [loadingSpecialists, setLoadingSpecialists] = useState(false)
  const [formData, setFormData] = useState<ServiceData>({
    name: '',
    duration_minutes: 60,
    price: 0,
    is_active: true,
    specialist_id: currentUser?.id || 1,
    specialist_ids: [],
  })

  useEffect(() => {
    loadAvailableSpecialists()
    if (serviceId) {
      loadService()
    } else if (currentUser?.id) {
      setFormData(prev => ({ ...prev, specialist_id: currentUser.id, specialist_ids: [currentUser.id] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders are plain functions, rerun only on these
  }, [serviceId, currentUser])

  const loadAvailableSpecialists = async () => {
    setLoadingSpecialists(true)
    try {
      const { data: employeesData } = await api.get('/employees/', { params: { is_active: true } })
      const employees = Array.isArray(employeesData) ? employeesData : []
      
      const { data: usersData } = await api.get('/users/', { params: { role: 'specialist' } })
      const allUsers = Array.isArray(usersData) 
        ? usersData 
        : (usersData?.items || usersData?.data || [])
      
      const employeeUserIds = new Set(employees.map((emp: any) => emp.employee_user_id))
      const allSpecialists = allUsers.filter((u: any) => 
        u.role === 'specialist' || employeeUserIds.has(u.id)
      )
      
      setAvailableSpecialists(allSpecialists.map((u: any) => ({
        id: u.id,
        full_name: u.full_name || u.employee_user?.full_name || '',
        email: u.email || u.employee_user?.email || '',
        phone: u.phone || u.employee_user?.phone,
      })))
    } catch (error) {
      console.error('Failed to load specialists:', error)
      setAvailableSpecialists([])
    } finally {
      setLoadingSpecialists(false)
    }
  }

  const loadService = async () => {
    try {
      const { data } = await api.get(`/services/${serviceId}`)
      setFormData({
        ...data,
        specialist_ids: data.specialist_ids || [data.specialist_id],
      })
    } catch (error) {
      console.error('Failed to load service:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        ...formData,
        specialist_ids: (formData.specialist_ids || []).filter(id => id !== formData.specialist_id),
      }
      
      if (serviceId) {
        await api.put(`/services/${serviceId}`, payload)
      } else {
        await api.post('/services/', payload)
      }
      onSuccess()
    } catch (error: any) {
      alert(apiErrorMessage(error, 'Failed to save service'))
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
        <label className="block text-sm font-medium mb-1">Primary Specialist *</label>
        {loadingSpecialists ? (
          <div className="text-sm text-gray-500">Loading specialists...</div>
        ) : (
          <select
            value={formData.specialist_id}
            onChange={(e) => {
              const newId = parseInt(e.target.value)
              const specialistIds = formData.specialist_ids || []
              setFormData({
                ...formData,
                specialist_id: newId,
                specialist_ids: specialistIds.includes(newId) ? specialistIds : [...specialistIds, newId],
              })
            }}
            required
            className="w-full px-3 py-2 border rounded-md"
          >
            {availableSpecialists.map((spec) => (
              <option key={spec.id} value={spec.id}>
                {spec.full_name} ({spec.email})
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Additional Specialists (Optional)</label>
        <p className="text-xs text-gray-500 mb-2">Select all specialists who can provide this service</p>
        {loadingSpecialists ? (
          <div className="text-sm text-gray-500">Loading specialists...</div>
        ) : (
          <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
            {availableSpecialists.map((spec) => {
              const isSelected = (formData.specialist_ids || []).includes(spec.id)
              const isPrimary = spec.id === formData.specialist_id
              return (
                <label key={spec.id} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected || isPrimary}
                    disabled={isPrimary}
                    onChange={(e) => {
                      const currentIds = formData.specialist_ids || []
                      if (e.target.checked) {
                        if (!currentIds.includes(spec.id)) {
                          setFormData({
                            ...formData,
                            specialist_ids: [...currentIds, spec.id],
                          })
                        }
                      } else {
                        if (!isPrimary) {
                          setFormData({
                            ...formData,
                            specialist_ids: currentIds.filter(id => id !== spec.id),
                          })
                        }
                      }
                    }}
                    className="mr-2"
                  />
                  <span className={isPrimary ? 'font-medium text-gray-700' : 'text-gray-600'}>
                    {spec.full_name} ({spec.email})
                    {isPrimary && <span className="text-xs text-gray-500 ml-1">(Primary)</span>}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
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
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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

