import { useTranslation } from '../hooks/useTranslation'
import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { allPages } from '../api/allPages'
import QueryError from './QueryError'
import FormError from './FormError'
import { apiFormErrors } from '../api/errors'
import LoadingSpinner from './LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import type { EmployeeOut, ServiceCreate, ServiceOut, UserOut, UserPage } from '../api/types'

interface ServiceFormProps {
  serviceId?: number
  onSuccess: () => void
  onCancel: () => void
  draftKey?: string
}

interface ServiceData {
  name: string
  duration_minutes: number
  price: number
  description?: string
  is_active: boolean
  specialist_id: number
  specialist_ids?: number[]
  buffer_before_minutes: number
  buffer_after_minutes: number
}

interface Specialist {
  id: number
  full_name: string
  email: string
  phone?: string
}

const SERVICE_FIELDS = ['name', 'duration_minutes', 'price', 'specialist_id', 'description']

function readServiceDraft(key?: string): Partial<ServiceData> | null {
  if (!key) return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ServiceData>
    if (!parsed || typeof parsed !== 'object') return null
    const draft: Partial<ServiceData> = {}
    if (typeof parsed.name === 'string') draft.name = parsed.name
    if (typeof parsed.duration_minutes === 'number' && Number.isFinite(parsed.duration_minutes)) {
      draft.duration_minutes = parsed.duration_minutes
    }
    if (typeof parsed.price === 'number' && Number.isFinite(parsed.price)) draft.price = parsed.price
    if (typeof parsed.description === 'string') draft.description = parsed.description
    if (typeof parsed.is_active === 'boolean') draft.is_active = parsed.is_active
    if (typeof parsed.specialist_id === 'number') draft.specialist_id = parsed.specialist_id
    return Object.keys(draft).length > 0 ? draft : null
  } catch {
    return null
  }
}

export default function ServiceForm({ serviceId, onSuccess, onCancel, draftKey }: ServiceFormProps) {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const submitting = useRef(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [availableSpecialists, setAvailableSpecialists] = useState<Specialist[]>([])
  const [loadingSpecialists, setLoadingSpecialists] = useState(false)
  const [specialistsFailed, setSpecialistsFailed] = useState(false)
  const [formData, setFormData] = useState<ServiceData>(() => {
    const draft = serviceId ? null : readServiceDraft(draftKey)
    return {
      name: '',
      duration_minutes: 60,
      price: 0,
      is_active: true,
      specialist_id: currentUser?.id || 1,
      specialist_ids: currentUser?.id ? [currentUser.id] : [],
      buffer_before_minutes: 0,
      buffer_after_minutes: 0,
      ...draft,
    }
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

  useEffect(() => {
    if (serviceId || !draftKey) return
    // private windows may reject storage, the form still works without a draft
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(formData))
    } catch {
      // ignore
    }
  }, [draftKey, formData, serviceId])

  const loadAvailableSpecialists = async () => {
    setLoadingSpecialists(true)
    setSpecialistsFailed(false)
    const self: Specialist[] = currentUser ? [{ id: currentUser.id, full_name: currentUser.full_name, email: '' }] : []
    try {
      const { data: employeesData } = await api.get<EmployeeOut[]>('/employees/', { params: { is_active: true } })
      const employees = Array.isArray(employeesData) ? employeesData : []
      
      const allUsers = await allPages<UserOut>(async page => (await api.get<UserPage>('/users/', {
        params: { role: 'specialist', page, per_page: 100 },
      })).data)

      const employeeUserIds = new Set(employees.map((emp) => emp.employee_user_id))
      const allSpecialists = allUsers.filter((u) => 
        u.role === 'specialist' || employeeUserIds.has(u.id)
      )
      
      setAvailableSpecialists([...self, ...allSpecialists.filter((u) => u.id !== currentUser?.id).map((u) => ({
        id: u.id,
        full_name: u.full_name || '',
        email: u.email || '',
        phone: u.phone ?? undefined,
      }))])
    } catch (error) {
      console.error('Failed to load specialists:', error)
      setSpecialistsFailed(true)
      setAvailableSpecialists(self)
    } finally {
      setLoadingSpecialists(false)
    }
  }

  const loadService = async () => {
    try {
      const { data } = await api.get<ServiceOut>(`/services/${serviceId}`)
      // the API allows a null price/duration, the form doesn't - a null shows up empty and the form asks for it on save
      setFormData({
        name: data.name,
        duration_minutes: data.duration_minutes as number,
        price: data.price as number,
        description: data.description ?? '',
        is_active: data.is_active ?? true,
        specialist_id: data.specialist_id,
        specialist_ids: data.specialist_ids || [data.specialist_id],
        buffer_before_minutes: data.buffer_before_minutes ?? 0,
        buffer_after_minutes: data.buffer_after_minutes ?? 0,
      })
    } catch (error) {
      console.error('Failed to load service:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    setFormError('')
    setFieldErrors({})
    if (!Number.isFinite(formData.price) || formData.price < 0) {
      setFormError(t('validation.price'))
      return
    }
    submitting.current = true
    setLoading(true)

    try {
      const payload: ServiceCreate = {
        name: formData.name,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        // a cleared description goes as null, otherwise the old one stays
        description: formData.description?.trim() ? formData.description : null,
        is_active: formData.is_active,
        specialist_id: formData.specialist_id,
        specialist_ids: (formData.specialist_ids || []).filter(id => id !== formData.specialist_id),
        buffer_before_minutes: formData.buffer_before_minutes,
        buffer_after_minutes: formData.buffer_after_minutes,
      }
      
      if (serviceId) {
        await api.put(`/services/${serviceId}`, payload)
      } else {
        await api.post('/services/', payload)
        if (draftKey) {
          try {
            sessionStorage.removeItem(draftKey)
          } catch {
            // ignore
          }
        }
      }
      onSuccess()
    } catch (error) {
      const { fields, general } = apiFormErrors(error, SERVICE_FIELDS, t('serviceForm.saveError'))
      setFieldErrors(fields)
      setFormError(general)
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <div role="alert"><FormError message={formError} /></div>}
      {specialistsFailed && (currentUser?.role === 'business_owner' || currentUser?.role === 'admin') && <QueryError retry={loadAvailableSpecialists} />}
      <div>
        <label className="block text-sm font-medium mb-1">{t('serviceForm.name')} *</label>
        <input
          aria-invalid={fieldErrors.name ? true : undefined}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('serviceForm.placeholder')}
        />
        {fieldErrors.name && <FormError message={fieldErrors.name} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('serviceForm.duration')} *</label>
          <input
            aria-invalid={fieldErrors.duration_minutes ? true : undefined}
            type="number"
            min="1"
            value={formData.duration_minutes}
            onChange={(e) =>
              setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })
            }
            required
            className="w-full px-3 py-2 border rounded-md"
          />
          {fieldErrors.duration_minutes && <FormError message={fieldErrors.duration_minutes} />}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('services.price')} *</label>
          <input
            aria-invalid={fieldErrors.price ? true : undefined}
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
          {fieldErrors.price && <FormError message={fieldErrors.price} />}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('serviceForm.primary')} *</label>
        {loadingSpecialists ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('serviceForm.loading')}</div>
        ) : (
          <select
            aria-invalid={fieldErrors.specialist_id ? true : undefined}
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
        {fieldErrors.specialist_id && <FormError message={fieldErrors.specialist_id} />}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('serviceForm.additional')}</label>
        <p className="text-xs text-gray-500 mb-2 dark:text-gray-400">{t('serviceForm.hint')}</p>
        {loadingSpecialists ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('serviceForm.loading')}</div>
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
                    {isPrimary && <span className="text-xs text-gray-500 ml-1 dark:text-gray-400">{t('serviceForm.primaryBadge')}</span>}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="service-description" className="block text-sm font-medium mb-1">{t('business.description')}</label>
        <textarea
          id="service-description"
          aria-invalid={fieldErrors.description ? true : undefined}
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
        {fieldErrors.description && <FormError message={fieldErrors.description} />}
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm font-medium">{t('services.active')}</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-all dark:border-gray-600 dark:hover:bg-gray-900 dark:text-gray-300"
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
            serviceId ? t('serviceForm.update') : t('serviceForm.create')
          )}
        </button>
      </div>
    </form>
  )
}

