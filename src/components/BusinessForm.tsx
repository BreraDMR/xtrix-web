import { useTranslation } from '../hooks/useTranslation'
import { useState, useEffect } from 'react'
import api from '../api/client'
import FormError from './FormError'
import { validateEmail, validatePhone } from '../utils/validation'
import { apiFormErrors } from '../api/errors'
import LoadingSpinner from './LoadingSpinner'
import { useLabels } from '../i18n/labels'
import type { BusinessType, BusinessUpdate } from '../api/types'
import { withoutBlanks } from '../utils/payload'
import { ASSISTANT_GENDERS, DEFAULT_ASSISTANT_GENDER, DEFAULT_ASSISTANT_NAMES, assistantNameProblem, type AssistantGender } from '../i18n/assistant'
import type { TranslationKey } from '../i18n/translations'

// same order as the API enum
const BUSINESS_TYPES: BusinessType[] = ['salon', 'clinic', 'medical', 'dental', 'hospital', 'individual']

interface BusinessFormProps {
  businessId?: number
  onSuccess: () => void
  onCancel: () => void
}

interface BusinessData {
  name: string
  business_type: BusinessType
  address?: string
  phone?: string
  email?: string
  description?: string
  currency?: string
  // the API takes these on update only
  assistant_name: string
  assistant_gender: AssistantGender
}

const BUSINESS_FIELDS = ['name', 'business_type', 'address', 'phone', 'email', 'description', 'currency', 'assistant_name', 'assistant_gender']

const NAME_PROBLEM: Record<'tooLong' | 'invalid', TranslationKey> = {
  tooLong: 'business.assistantNameTooLong',
  invalid: 'business.assistantNameInvalid',
}

export default function BusinessForm({ businessId, onSuccess, onCancel }: BusinessFormProps) {
  const { t, locale } = useTranslation()
  const labels = useLabels()
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<BusinessData>({
    name: '',
    business_type: 'salon',
    currency: 'EUR',
    assistant_name: '',
    assistant_gender: DEFAULT_ASSISTANT_GENDER,
  })
  const nameProblem = assistantNameProblem(formData.assistant_name)

  useEffect(() => {
    if (businessId) {
      loadBusiness()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders are plain functions, rerun only on these
  }, [businessId])

  const loadBusiness = async () => {
    try {
      const { data } = await api.get(`/businesses/${businessId}`)
      setFormData({
        name: data.name || '',
        business_type: data.business_type || 'salon',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        description: data.description || '',
        currency: data.currency || 'EUR',
        assistant_name: data.assistant_name || '',
        assistant_gender: ASSISTANT_GENDERS.includes(data.assistant_gender) ? data.assistant_gender : DEFAULT_ASSISTANT_GENDER,
      })
    } catch (error) {
      console.error('Failed to load business:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})
    if (formData.email && validateEmail(formData.email)) {
      setFormError(t('clientForm.invalidEmail'))
      return
    }
    if (formData.phone && validatePhone(formData.phone)) {
      setFormError(t('clientForm.invalidPhone'))
      return
    }
    // the problem is already shown under the field
    if (businessId && nameProblem) return
    setLoading(true)

    try {
      const { assistant_name, assistant_gender, ...rest } = formData
      const businessData = withoutBlanks(rest)

      if (businessId) {
        const update: BusinessUpdate = {
          ...businessData,
          // null, not "", so a cleared name really goes back to the default
          assistant_name: assistant_name.trim() || null,
          assistant_gender,
        }
        await api.put(`/businesses/${businessId}`, update)
      } else {
        await api.post('/businesses/', businessData)
      }
      onSuccess()
    } catch (error) {
      const { fields, general } = apiFormErrors(error, BUSINESS_FIELDS, t('business.saveError'))
      setFieldErrors(fields)
      setFormError(general)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <div role="alert"><FormError message={formError} /></div>}
      <div>
        <label className="block text-sm font-medium mb-1">{t('business.name')} *</label>
        <input
          aria-invalid={fieldErrors.name ? true : undefined}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('business.namePlaceholder')}
        />
        {fieldErrors.name && <FormError message={fieldErrors.name} />}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('business.type')} *</label>
        <select
          aria-invalid={fieldErrors.business_type ? true : undefined}
          value={formData.business_type}
          onChange={(e) => setFormData({ ...formData, business_type: e.target.value as BusinessType })}
          required
          className="w-full px-3 py-2 border rounded-md"
        >
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>{labels.businessType(type)}</option>
          ))}
        </select>
        {fieldErrors.business_type && <FormError message={fieldErrors.business_type} />}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('business.address')}</label>
        <input
          aria-invalid={fieldErrors.address ? true : undefined}
          type="text"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('business.addressPlaceholder')}
        />
        {fieldErrors.address && <FormError message={fieldErrors.address} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('clients.phone')}</label>
          <input
            aria-invalid={fieldErrors.phone ? true : undefined}
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="+1234567890"
          />
          {fieldErrors.phone && <FormError message={fieldErrors.phone} />}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('clients.email')}</label>
          <input
            aria-invalid={fieldErrors.email ? true : undefined}
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="business@example.com"
          />
          {fieldErrors.email && <FormError message={fieldErrors.email} />}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('business.description')}</label>
        <textarea
          aria-invalid={fieldErrors.description ? true : undefined}
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('business.descriptionPlaceholder')}
        />
        {fieldErrors.description && <FormError message={fieldErrors.description} />}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('business.currency')}</label>
        <select
          aria-invalid={fieldErrors.currency ? true : undefined}
          value={formData.currency || 'EUR'}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="EUR">EUR (€)</option>
          <option value="USD">USD ($)</option>
          <option value="CZK">CZK (Kč)</option>
          <option value="RUB">RUB (₽)</option>
          <option value="UAH">UAH (₴)</option>
        </select>
        {fieldErrors.currency && <FormError message={fieldErrors.currency} />}
      </div>

      {businessId && (
        <fieldset className="space-y-4 pt-4 border-t border-gray-200">
          <legend className="text-base font-semibold">{t('business.assistant')}</legend>
          <p className="text-xs text-gray-500">{t('business.assistantHint')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assistant-name" className="block text-sm font-medium mb-1">{t('business.assistantName')}</label>
              <input
                id="assistant-name"
                aria-invalid={nameProblem || fieldErrors.assistant_name ? true : undefined}
                type="text"
                value={formData.assistant_name}
                onChange={(e) => {
                  setFormData({ ...formData, assistant_name: e.target.value })
                  if (fieldErrors.assistant_name) setFieldErrors({ ...fieldErrors, assistant_name: '' })
                }}
                className="w-full px-3 py-2 border rounded-md"
                placeholder={DEFAULT_ASSISTANT_NAMES[locale]}
                autoComplete="off"
              />
              {nameProblem
                ? <FormError message={t(NAME_PROBLEM[nameProblem])} />
                : fieldErrors.assistant_name && <FormError message={fieldErrors.assistant_name} />}
            </div>
            <div>
              <label htmlFor="assistant-gender" className="block text-sm font-medium mb-1">{t('business.assistantGender')}</label>
              <select
                id="assistant-gender"
                aria-invalid={fieldErrors.assistant_gender ? true : undefined}
                value={formData.assistant_gender}
                onChange={(e) => {
                  setFormData({ ...formData, assistant_gender: e.target.value as AssistantGender })
                  if (fieldErrors.assistant_gender) setFieldErrors({ ...fieldErrors, assistant_gender: '' })
                }}
                className="w-full px-3 py-2 border rounded-md bg-white"
              >
                {ASSISTANT_GENDERS.map((gender) => (
                  <option key={gender} value={gender}>{t(`business.assistantGender.${gender}`)}</option>
                ))}
              </select>
              {fieldErrors.assistant_gender && <FormError message={fieldErrors.assistant_gender} />}
            </div>
          </div>
        </fieldset>
      )}

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
            businessId ? t('business.update') : t('business.create')
          )}
        </button>
      </div>
    </form>
  )
}

