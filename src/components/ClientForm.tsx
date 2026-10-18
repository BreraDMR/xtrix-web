import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { apiClientExists, apiErrorMessage } from '../api/errors'
import { useTranslation } from '../hooks/useTranslation'
import LoadingSpinner from './LoadingSpinner'
import FormField from './FormField'
import FormError from './FormError'
import { validateEmail, validatePhone, validateRequired, extractApiErrors } from '../utils/validation'
import type { ClientLanguage } from '../api/types'
import type { TranslationKey } from '../i18n/translations'

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
  // the API refused a duplicate: let the page switch to the client we already have
  onOpenExisting?: (clientId: number) => void
}

interface ClientData {
  full_name: string
  birth_date?: string
  gender?: string
  contact_phone?: string
  contact_email?: string
  location_lat?: number
  location_lon?: number
  owner_id?: number
  language: ClientLanguage
}

const EXISTS_MESSAGE: Record<string, TranslationKey> = {
  contact_phone: 'clientForm.existsPhone',
  contact_email: 'clientForm.existsEmail',
  'full_name+birth_date': 'clientForm.existsNameBirth',
}

export default function ClientForm({ clientId, onSuccess, onCancel, onOpenExisting }: ClientFormProps) {
  const { t, locale } = useTranslation()
  const submitting = useRef(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [existing, setExisting] = useState<{ id: number; message: string } | null>(null)
  const [formData, setFormData] = useState<ClientData>({
    full_name: '',
    // a new client most likely speaks what the salon's staff use
    language: locale,
  })

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
      })
    } catch (error) {
      console.error('Failed to load client:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    const fullNameError = validateRequired(formData.full_name, 'Full Name')
    if (fullNameError) {
      newErrors.full_name = t('clientForm.nameRequired')
    }
    
    if (formData.contact_email) {
      const emailError = validateEmail(formData.contact_email)
      if (emailError) {
        newErrors.contact_email = t('clientForm.invalidEmail')
      }
    }
    
    if (formData.contact_phone) {
      const phoneError = validatePhone(formData.contact_phone)
      if (phoneError) {
        newErrors.contact_phone = t('clientForm.invalidPhone')
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
    setExisting(null)

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
      const duplicate = apiClientExists(error)
      if (duplicate) {
        setExisting({
          id: duplicate.existingClientId,
          message: t(EXISTS_MESSAGE[duplicate.matchedBy ?? ''] ?? 'clientForm.exists'),
        })
        return
      }
      const apiErrors = extractApiErrors(error)
      
      if (Object.keys(apiErrors).length > 0) {
        setErrors(apiErrors)
      } else {
        const errorMessage = apiErrorMessage(error, t('clientForm.saveError'))
        setErrors({ _general: errorMessage })
      }
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {existing && (
        <div role="alert" className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900 flex flex-wrap items-center gap-3">
          <span className="flex-1">{existing.message}</span>
          {onOpenExisting && (
            <button
              type="button"
              onClick={() => onOpenExisting(existing.id)}
              className="px-3 py-1.5 bg-white border border-yellow-300 rounded-md font-medium hover:bg-yellow-100"
            >
              {t('clientForm.openExisting')}
            </button>
          )}
        </div>
      )}
      {errors._general && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <FormError message={errors._general} />
        </div>
      )}
      
      <FormField
        label={t('clientForm.fullName')}
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
        <FormField label={t('clientForm.birthDate')} error={errors.birth_date}>
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
        <FormField label={t('clientForm.gender')} error={errors.gender}>
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
            <option value="">{t('clientForm.select')}</option>
            <option value="male">{t('clients.male')}</option>
            <option value="female">{t('clients.female')}</option>
            <option value="other">{t('clients.other')}</option>
          </select>
        </FormField>
      </div>

      <FormField
        label={t('clients.phone')}
        error={errors.contact_phone}
        hint={t('clientForm.phoneHint')}
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
        label={t('clients.email')}
        error={errors.contact_email}
        hint={t('clientForm.emailHint')}
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

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-all"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>{t('common.saving')}</span>
            </>
          ) : (
            clientId ? t('clientForm.update') : t('clientForm.create')
          )}
        </button>
      </div>
    </form>
  )
}

