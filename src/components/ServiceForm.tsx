import { useTranslation } from '../hooks/useTranslation'
import { useState, useEffect, useId, useRef } from 'react'
import api from '../api/client'
import { allPages } from '../api/allPages'
import QueryError from './QueryError'
import FormError from './FormError'
import { apiFormErrors } from '../api/errors'
import LoadingSpinner from './LoadingSpinner'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
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
  const formId = useId()
  const { user: currentUser } = useAuthStore()
  const submitting = useRef(false)
  const [loading, setLoading] = useState(false)
  const [loadingService, setLoadingService] = useState(!!serviceId)
  const [serviceFailed, setServiceFailed] = useState(false)
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
    setLoadingService(true)
    setServiceFailed(false)
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
    } catch {
      setServiceFailed(true)
    } finally {
      setLoadingService(false)
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

  if (loadingService) return <div role="status" className="flex items-center justify-center gap-3 py-12 text-sm text-[var(--workspace-muted)]"><LoadingSpinner size="sm" />{t('common.loading')}</div>
  if (serviceFailed) return <div className="space-y-4"><QueryError retry={loadService} /><Button variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button></div>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && <div role="alert"><FormError message={formError} /></div>}
      {specialistsFailed && (currentUser?.role === 'business_owner' || currentUser?.role === 'admin') && <QueryError retry={loadAvailableSpecialists} />}
      <fieldset className="min-w-0 space-y-4">
        <legend className="mb-4 text-sm font-semibold">{t('serviceForm.details')}</legend>
        <div>
          <label htmlFor={`${formId}-name`} className="mb-1.5 block text-xs font-medium">{t('serviceForm.name')} *</label>
          <Input id={`${formId}-name`} aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
            type="text" value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })}
            required placeholder={t('serviceForm.placeholder')} />
          {fieldErrors.name && <div id={`${formId}-name-error`}><FormError message={fieldErrors.name} /></div>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label htmlFor={`${formId}-duration`} className="mb-1.5 block text-xs font-medium">{t('serviceForm.duration')} *</label>
            <Input id={`${formId}-duration`} aria-invalid={fieldErrors.duration_minutes ? true : undefined}
              aria-describedby={fieldErrors.duration_minutes ? `${formId}-duration-error` : undefined}
              type="number" min="1" value={formData.duration_minutes ?? ''}
              onChange={event => setFormData({ ...formData, duration_minutes: parseInt(event.target.value) || 0 })} required />
            {fieldErrors.duration_minutes && <div id={`${formId}-duration-error`}><FormError message={fieldErrors.duration_minutes} /></div>}
          </div>
          <div className="min-w-0">
            <label htmlFor={`${formId}-price`} className="mb-1.5 block text-xs font-medium">{t('services.price')} *</label>
            <Input id={`${formId}-price`} aria-invalid={fieldErrors.price ? true : undefined}
              aria-describedby={fieldErrors.price ? `${formId}-price-error` : undefined}
              type="number" step="0.01" min="0" value={formData.price ?? ''}
              onChange={event => setFormData({ ...formData, price: parseFloat(event.target.value) || 0 })} required />
            {fieldErrors.price && <div id={`${formId}-price-error`}><FormError message={fieldErrors.price} /></div>}
          </div>
        </div>
        <div>
          <label htmlFor={`${formId}-description`} className="mb-1.5 block text-xs font-medium">{t('business.description')}</label>
          <textarea id={`${formId}-description`} aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={fieldErrors.description ? `${formId}-description-error` : undefined}
            value={formData.description || ''} onChange={event => setFormData({ ...formData, description: event.target.value })}
            rows={3} className="ui-input resize-y" />
          {fieldErrors.description && <div id={`${formId}-description-error`}><FormError message={fieldErrors.description} /></div>}
        </div>
        <label className="inline-flex min-h-8 items-center gap-2 text-sm">
          <input type="checkbox" checked={formData.is_active} onChange={event => setFormData({ ...formData, is_active: event.target.checked })} className="h-4 w-4 accent-[var(--workspace-accent)]" />
          {t('services.active')}
        </label>
      </fieldset>

      <fieldset className="min-w-0 space-y-4 border-t border-[var(--workspace-line)] pt-5">
        <legend className="px-1 text-sm font-semibold">{t('serviceForm.team')}</legend>
        <div>
          <label htmlFor={`${formId}-primary`} className="mb-1.5 block text-xs font-medium">{t('serviceForm.primary')} *</label>
          {loadingSpecialists ? <p role="status" className="text-xs text-[var(--workspace-muted)]">{t('serviceForm.loading')}</p> :
            <Select id={`${formId}-primary`} aria-invalid={fieldErrors.specialist_id ? true : undefined}
              aria-describedby={fieldErrors.specialist_id ? `${formId}-primary-error` : undefined}
              value={formData.specialist_id} required
              onChange={event => {
                const newId = parseInt(event.target.value)
                const specialistIds = formData.specialist_ids || []
                setFormData({ ...formData, specialist_id: newId,
                  specialist_ids: specialistIds.includes(newId) ? specialistIds : [...specialistIds, newId] })
              }}>
              {availableSpecialists.map(spec => <option key={spec.id} value={spec.id}>{spec.full_name} ({spec.email})</option>)}
            </Select>}
          {fieldErrors.specialist_id && <div id={`${formId}-primary-error`}><FormError message={fieldErrors.specialist_id} /></div>}
        </div>
        <details className="rounded-md border border-[var(--workspace-line)]">
          <summary className="cursor-pointer px-3 py-3 text-xs font-medium">{t('serviceForm.additional')}</summary>
          <div className="px-3 pb-3">
            <p className="mb-3 text-xs leading-relaxed text-[var(--workspace-muted)]">{t('serviceForm.hint')}</p>
            {loadingSpecialists ? <p role="status" className="text-xs text-[var(--workspace-muted)]">{t('serviceForm.loading')}</p> :
              <div className="max-h-44 space-y-1 overflow-y-auto">
                {availableSpecialists.map(spec => {
                  const isSelected = (formData.specialist_ids || []).includes(spec.id)
                  const isPrimary = spec.id === formData.specialist_id
                  return <label key={spec.id} className="flex min-h-9 cursor-pointer items-start gap-2 rounded px-1 py-1.5 text-xs hover:bg-[var(--workspace-bg)]">
                    <input type="checkbox" checked={isSelected || isPrimary} disabled={isPrimary}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--workspace-accent)]"
                      onChange={event => {
                        const currentIds = formData.specialist_ids || []
                        if (event.target.checked) {
                          if (!currentIds.includes(spec.id)) setFormData({ ...formData, specialist_ids: [...currentIds, spec.id] })
                        } else if (!isPrimary) setFormData({ ...formData, specialist_ids: currentIds.filter(id => id !== spec.id) })
                      }} />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{spec.full_name} ({spec.email})
                      {isPrimary && <span className="ml-1 text-[var(--workspace-muted)]">{t('serviceForm.primaryBadge')}</span>}
                    </span>
                  </label>
                })}
              </div>}
          </div>
        </details>
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-[var(--workspace-line)] pt-4">
        <Button variant="secondary" onClick={onCancel} className="flex-1 sm:flex-none">{t('common.cancel')}</Button>
        <Button type="submit" disabled={loading} className="flex-1 sm:flex-none">
          {loading ? <><LoadingSpinner size="sm" /><span>{t('common.saving')}</span></> : serviceId ? t('serviceForm.update') : t('serviceForm.create')}
        </Button>
      </div>
    </form>
  )
}
