import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'
import LoadingSpinner from './LoadingSpinner'
import FormField from './FormField'
import FormError from './FormError'
import { validateEmail, validatePhone, validateRequired, extractApiErrors } from '../utils/validation'
import type { ClientLanguage } from '../api/types'

// native names on purpose - this is the client's language, not ours
const CLIENT_LANGUAGES: { code: ClientLanguage; label: string }[] = [
  { code: 'cz', label: 'Čeština' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
]

interface ClientFormProps {
  clientId?: number
  onSuccess: () => void
  onCancel: () => void
}

interface ClientData {
  full_name: string
  birth_date?: string
  gender?: string
  allergies?: string
  chronic_diseases?: string
  pregnancy?: boolean
  contact_phone?: string
  contact_email?: string
  personal_notes?: string
  location_lat?: number
  location_lon?: number
  owner_id?: number
  language: ClientLanguage
}

export default function ClientForm({ clientId, onSuccess, onCancel }: ClientFormProps) {
  const { t, locale } = useTranslation()
  const { user } = useAuthStore()
  const submitting = useRef(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<ClientData>({
    full_name: '',
    // a new client most likely speaks what the salon's staff use
    language: locale,
  })

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders are plain functions, rerun only on these
  }, [clientId])

  const loadClient = async () => {
    try {
      const { data } = await api.get(`/clients/${clientId}`)
      setFormData({
        ...data,
        birth_date: data.birth_date?.split('T')[0] || '',
        pregnancy: data.pregnancy || false,
      })
    } catch (error) {
      console.error('Failed to load client:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    const fullNameError = validateRequired(formData.full_name, 'Full Name')
    if (fullNameError) {
      newErrors.full_name = fullNameError
    }
    
    if (formData.contact_email) {
      const emailError = validateEmail(formData.contact_email)
      if (emailError) {
        newErrors.contact_email = emailError
      }
    }
    
    if (formData.contact_phone) {
      const phoneError = validatePhone(formData.contact_phone)
      if (phoneError) {
        newErrors.contact_phone = phoneError
      }
    }
    
    if (isHealthcareSpecialist && !clientId) {
      if (!formData.allergies || !formData.allergies.trim()) {
        newErrors.allergies = t('clientForm.healthcareRequiredDescription')
      }
      if (!formData.chronic_diseases || !formData.chronic_diseases.trim()) {
        newErrors.chronic_diseases = t('clientForm.healthcareRequiredDescription')
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    
    if (!validateForm()) {
      return
    }
    
    submitting.current = true
    setLoading(true)
    setErrors({})

    try {
      const clientData: any = {
        full_name: formData.full_name,
        birth_date: formData.birth_date || undefined,
        gender: formData.gender || undefined,
        contact_phone: formData.contact_phone || undefined,
        contact_email: formData.contact_email || undefined,
        location_lat: formData.location_lat || undefined,
        location_lon: formData.location_lon || undefined,
        language: formData.language,
      }
      
      Object.keys(clientData).forEach(key => {
        if (clientData[key] === undefined || clientData[key] === '') {
          delete clientData[key]
        }
      })
      
      if (clientId) {
        await api.put(`/clients/${clientId}`, clientData)
      } else {
        await api.post('/clients/', clientData)
      }
      
      
      onSuccess()
    } catch (error: any) {
      console.error('Error saving client:', error)
      const apiErrors = extractApiErrors(error)
      
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors)
      } else {
        const errorMessage = apiErrorMessage(error, 'Failed to save client')
        setErrors({ _general: errorMessage })
      }
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors._general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <FormError message={errors._general} />
        </div>
      )}
      
      <FormField
        label="Full Name"
        required
        error={errors.full_name}
      >
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => {
            setFormData({ ...formData, full_name: e.target.value })
            if (errors.full_name) {
              setErrors({ ...errors, full_name: '' })
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            errors.full_name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Date of Birth" error={errors.birth_date}>
          <input
            type="date"
            value={formData.birth_date || ''}
            onChange={(e) => {
              setFormData({ ...formData, birth_date: e.target.value })
              if (errors.birth_date) {
                setErrors({ ...errors, birth_date: '' })
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.birth_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </FormField>
        <FormField label="Gender" error={errors.gender}>
          <select
            value={formData.gender || ''}
            onChange={(e) => {
              setFormData({ ...formData, gender: e.target.value })
              if (errors.gender) {
                setErrors({ ...errors, gender: '' })
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.gender ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </FormField>
      </div>

      <FormField
        label="Phone"
        error={errors.contact_phone}
        hint="Enter phone number in international format (e.g., +420 123 456 789)"
      >
        <input
          type="tel"
          value={formData.contact_phone || ''}
          onChange={(e) => {
            setFormData({ ...formData, contact_phone: e.target.value })
            if (errors.contact_phone) {
              setErrors({ ...errors, contact_phone: '' })
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            errors.contact_phone ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      </FormField>

      <FormField
        label="Email"
        error={errors.contact_email}
        hint="Enter a valid email address"
      >
        <input
          type="email"
          value={formData.contact_email || ''}
          onChange={(e) => {
            setFormData({ ...formData, contact_email: e.target.value })
            if (errors.contact_email) {
              setErrors({ ...errors, contact_email: '' })
            }
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            errors.contact_email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      </FormField>

      <FormField
        label={t('clientForm.messageLanguage')}
        error={errors.language}
        hint={t('clientForm.messageLanguageHint')}
      >
        <select
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value as ClientLanguage })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border-gray-300"
        >
          {CLIENT_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </FormField>

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

      <FormField
        label={t('clientForm.allergies')}
        required={isHealthcareSpecialist && !clientId}
        error={errors.allergies}
      >
        <textarea
          value={formData.allergies || ''}
          onChange={(e) => {
            setFormData({ ...formData, allergies: e.target.value })
            if (errors.allergies) {
              setErrors({ ...errors, allergies: '' })
            }
          }}
          rows={2}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            errors.allergies ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={isHealthcareSpecialist ? t('clientForm.allergies') : ''}
        />
      </FormField>

      <FormField
        label={t('clientForm.chronicDiseases')}
        required={isHealthcareSpecialist && !clientId}
        error={errors.chronic_diseases}
      >
        <textarea
          value={formData.chronic_diseases || ''}
          onChange={(e) => {
            setFormData({ ...formData, chronic_diseases: e.target.value })
            if (errors.chronic_diseases) {
              setErrors({ ...errors, chronic_diseases: '' })
            }
          }}
          rows={2}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            errors.chronic_diseases ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={isHealthcareSpecialist ? t('clientForm.chronicDiseases') : ''}
        />
      </FormField>

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
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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

