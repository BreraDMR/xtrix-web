import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { apiClientExists, apiFormErrors } from '../api/errors'
import { useTranslation } from '../hooks/useTranslation'
import LoadingSpinner from './LoadingSpinner'
import FormField from './FormField'
import FormError from './FormError'
import { validateEmail, validatePhone, validateRequired } from '../utils/validation'
import { withoutBlanks } from '../utils/payload'
import type { ClientLanguage } from '../api/types'
import type { TranslationKey } from '../i18n/translations'
import Button from '../ui/Button'
import ContactsEditor from './clients/ContactsEditor'
import { contactErrors, contactsFromClient, contactsPayload, type ContactRow } from './clients/contacts'

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
  location_lat?: number
  location_lon?: number
  owner_id?: number
  language: ClientLanguage
}

const CLIENT_FIELDS = ['full_name', 'birth_date', 'gender', 'language']

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
  const [existing, setExisting] = useState<{ id: number; message: string; shared: boolean } | null>(null)
  const [contacts, setContacts] = useState<ContactRow[]>(() => contactsFromClient({}))
  const [contactErrorsByRow, setContactErrorsByRow] = useState<Record<string, string>>({})
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
      setContacts(contactsFromClient(data))
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
    
    const byRow = contactErrors(
      contacts,
      (row) => {
        if (row.kind === 'email') return validateEmail(row.value.trim()) ? t('clientForm.invalidEmail') : undefined
        return validatePhone(row.value.trim()) ? t('clientForm.invalidPhone') : undefined
      },
      t('contacts.duplicate'),
    )

    setErrors(newErrors)
    setContactErrorsByRow(byRow)
    return Object.keys(newErrors).length === 0 && Object.keys(byRow).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, allowShared = false) => {
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
      const contactList = contactsPayload(contacts)
      const clientData = withoutBlanks({
        full_name: formData.full_name,
        birth_date: formData.birth_date || undefined,
        gender: formData.gender || undefined,
        location_lat: formData.location_lat || undefined,
        location_lon: formData.location_lon || undefined,
        language: formData.language,
        // the whole list; an edit with every field emptied clears them. The API fills
        // contact_phone / contact_email from the primary ones
        contacts: clientId || contactList.length ? contactList : undefined,
        allow_shared_contact: allowShared || undefined,
      })

      if (clientId) {
        await api.put(`/clients/${clientId}`, clientData)
      } else {
        await api.post('/clients/', clientData)
      }
      
      
      onSuccess()
    } catch (error) {
      const duplicate = apiClientExists(error)
      if (duplicate) {
        setExisting({
          id: duplicate.existingClientId,
          message: t(EXISTS_MESSAGE[duplicate.matchedBy ?? ''] ?? 'clientForm.exists'),
          // a family can share a phone or an email; the same name + birthday is the same person
          shared: !clientId && (duplicate.matchedBy === 'contact_phone' || duplicate.matchedBy === 'contact_email'),
        })
        return
      }
      const { fields, general } = apiFormErrors(error, CLIENT_FIELDS, t('clientForm.saveError'))
      setErrors(general ? { ...fields, _general: general } : fields)
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
              className="px-3 py-1.5 bg-white border border-yellow-300 rounded-md font-medium hover:bg-yellow-100 dark:bg-gray-800"
            >
              {t('clientForm.openExisting')}
            </button>
          )}
          {existing.shared && (
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="px-3 py-1.5 bg-white border border-yellow-300 rounded-md font-medium hover:bg-yellow-100 dark:bg-gray-800"
            >
              {t('clientForm.createShared')}
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

      <ContactsEditor
        rows={contacts}
        onChange={(rows) => {
          setContacts(rows)
          setContactErrorsByRow({})
        }}
        errors={contactErrorsByRow}
      />

      <FormField
        label={t('clientForm.messageLanguage')}
        error={errors.language}
        hint={t('clientForm.messageLanguageHint')}
      >
        <select
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value as ClientLanguage })}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border-gray-300 dark:border-gray-600"
        >
          {CLIENT_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </FormField>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-all dark:border-gray-600 dark:hover:bg-gray-900 dark:text-gray-300"
        >
          {t('common.cancel')}
        </button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>{t('common.saving')}</span>
            </>
          ) : (
            clientId ? t('clientForm.update') : t('clientForm.create')
          )}
        </Button>
      </div>
    </form>
  )
}

