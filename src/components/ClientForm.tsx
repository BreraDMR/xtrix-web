import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'
import LoadingSpinner from './LoadingSpinner'

interface ClientFormProps {
  clientId?: number
  onSuccess: () => void
  onCancel: () => void
}

interface ClientData {
  full_name: string
  date_of_birth?: string
  gender?: string
  allergies?: string
  chronic_diseases?: string
  pregnancy?: boolean
  contact_phone?: string
  contact_email?: string
  personal_notes?: string
  location_lat?: number
  location_lon?: number
  owner_id: number
}

export default function ClientForm({ clientId, onSuccess, onCancel }: ClientFormProps) {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClientData>({
    full_name: '',
    owner_id: 1, // Will be set from auth
  })

  // Get specialist profile to check if healthcare specialist
  const { data: specialistProfile } = useQuery({
    queryKey: ['specialist-profile'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/specialist-profiles/me')
        return data
      } catch (error) {
        return null
      }
    },
    enabled: user?.role === 'specialist',
  })

  const isHealthcareSpecialist = specialistProfile?.specialist_category === 'healthcare'

  useEffect(() => {
    if (clientId) {
      loadClient()
    }
  }, [clientId])

  const loadClient = async () => {
    try {
      const { data } = await api.get(`/clients/${clientId}`)
      setFormData({
        ...data,
        date_of_birth: data.date_of_birth?.split('T')[0] || '',
        pregnancy: data.pregnancy || false,
      })
    } catch (error) {
      console.error('Failed to load client:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate healthcare requirements
    if (isHealthcareSpecialist && !clientId) {
      if (!formData.allergies || !formData.allergies.trim()) {
        alert(t('clientForm.healthcareRequiredDescription'))
        return
      }
      if (!formData.chronic_diseases || !formData.chronic_diseases.trim()) {
        alert(t('clientForm.healthcareRequiredDescription'))
        return
      }
    }
    
    setLoading(true)

    try {
      if (clientId) {
        await api.put(`/clients/${clientId}`, formData)
      } else {
        await api.post('/clients', formData)
      }
      onSuccess()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name *</label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gender</label>
          <select
            value={formData.gender || ''}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          value={formData.contact_phone || ''}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.contact_email || ''}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {isHealthcareSpecialist && !clientId && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium mb-1">
            {t('clientForm.healthcareRequired')}
          </p>
          <p className="text-yellow-700 text-xs">
            {t('clientForm.healthcareRequiredDescription')}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('clientForm.allergies')} {isHealthcareSpecialist && !clientId && '*'}
        </label>
        <textarea
          value={formData.allergies || ''}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          rows={2}
          required={isHealthcareSpecialist && !clientId}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={isHealthcareSpecialist ? t('clientForm.allergies') : ''}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {t('clientForm.chronicDiseases')} {isHealthcareSpecialist && !clientId && '*'}
        </label>
        <textarea
          value={formData.chronic_diseases || ''}
          onChange={(e) => setFormData({ ...formData, chronic_diseases: e.target.value })}
          rows={2}
          required={isHealthcareSpecialist && !clientId}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={isHealthcareSpecialist ? t('clientForm.chronicDiseases') : ''}
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.pregnancy || false}
            onChange={(e) => setFormData({ ...formData, pregnancy: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm font-medium">Pregnancy</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Personal Notes</label>
        <textarea
          value={formData.personal_notes || ''}
          onChange={(e) => setFormData({ ...formData, personal_notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., doesn't like loud sounds, prefers silence"
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
            clientId ? 'Update Client' : 'Create Client'
          )}
        </button>
      </div>
    </form>
  )
}

