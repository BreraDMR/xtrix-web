import { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import FormError from './FormError'
import { validateEmail, validatePhone } from '../utils/validation'
import { apiFormErrors } from '../api/errors'
import { useTranslation } from '../hooks/useTranslation'
import SpecialistTypeSelector from './SpecialistTypeSelector'
import type { Schema } from '../api/types'

interface EmployeeFormProps {
  employeeId?: number
  onSuccess: () => void
  onCancel: () => void
}

// the contract types permissions as a plain dict, so the keys are spelled out here
type Permissions = {
  can_create_visits?: boolean
  can_edit_clients?: boolean
  can_view_financials?: boolean
  can_manage_services?: boolean
  assigned_client_ids?: number[] | null
}

interface EmployeeData {
  position?: string
  commission_percentage?: number
  base_salary?: number
  permissions?: Permissions
}

interface NewUserData {
  full_name: string
  phone: string
  email: string
  specialist_type: string
}

const DEFAULT_PERMISSIONS: Permissions = {
  can_create_visits: true,
  can_edit_clients: true,
  can_view_financials: false,
  can_manage_services: false,
  assigned_client_ids: null,
}

// New staff always get a fresh account (POST /employees/create-with-user). Picking an
// existing user from "all specialists" is gone: GET /users/ only returns your own business now.
const EMPLOYEE_FIELDS = ['full_name', 'email', 'phone', 'position', 'commission_percentage', 'base_salary']

export default function EmployeeForm({ employeeId, onSuccess, onCancel }: EmployeeFormProps) {
  const { t } = useTranslation()
  const submitting = useRef(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const showApiError = (error: unknown) => {
    const { fields, general } = apiFormErrors(error, EMPLOYEE_FIELDS, t('common.error'))
    setFieldErrors(fields)
    setFormError(general)
  }
  const [employeeName, setEmployeeName] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [newUserData, setNewUserData] = useState<NewUserData>({
    full_name: '',
    phone: '',
    email: '',
    specialist_type: '',
  })

  const [formData, setFormData] = useState<EmployeeData>({
    position: '',
    commission_percentage: undefined,
    base_salary: undefined,
    permissions: DEFAULT_PERMISSIONS,
  })

  useEffect(() => {
    if (employeeId) {
      loadEmployee()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders are plain functions, rerun only on these
  }, [employeeId])

  const loadEmployee = async () => {
    if (!employeeId) return
    try {
      const { data } = await api.get<Schema<'EmployeeOut'>>(`/employees/${employeeId}`)
      setEmployeeName(String(data.employee_user?.full_name ?? ''))
      setFormData({
        position: data.position || '',
        commission_percentage: data.commission_percentage ?? undefined,
        base_salary: data.base_salary ?? undefined,
        permissions: (data.permissions as Permissions | null) || DEFAULT_PERMISSIONS,
      })
    } catch (error) {
      console.error('Failed to load employee:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    if (generatedPassword) return

    setFormError('')
    setFieldErrors({})
    if (formData.base_salary !== undefined && (!Number.isFinite(formData.base_salary) || formData.base_salary < 0 || formData.base_salary > 1e8)) {
      setFormError(t('validation.salary'))
      return
    }
    if (formData.commission_percentage !== undefined && (!Number.isFinite(formData.commission_percentage) || formData.commission_percentage < 0 || formData.commission_percentage > 100)) {
      setFormError(t('validation.commission'))
      return
    }
    if (!employeeId) {
      if (newUserData.email && validateEmail(newUserData.email)) {
        setFormError(t('clientForm.invalidEmail'))
        return
      }
      if (newUserData.phone && validatePhone(newUserData.phone)) {
        setFormError(t('clientForm.invalidPhone'))
        return
      }
      if (!newUserData.full_name.trim()) {
        setFormError(t('clientForm.nameRequired'))
        return
      }
      if (!newUserData.email && !newUserData.phone) {
        setFormError(t('register.contactRequired'))
        return
      }

      submitting.current = true
      setLoading(true)
      try {
        const payload: Schema<'EmployeeCreateWithUser'> = {
          full_name: newUserData.full_name.trim(),
          phone: newUserData.phone.trim() || undefined,
          email: newUserData.email.trim() || undefined,
          specialist_type: newUserData.specialist_type || undefined,
          position: formData.position || undefined,
          commission_percentage: formData.commission_percentage ?? null,
          base_salary: formData.base_salary ?? null,
          permissions: formData.permissions,
        }
        const { data } = await api.post<Schema<'EmployeeCreateResponse'>>('/employees/create-with-user', payload)
        setGeneratedPassword(data.generated_password)
      } catch (error) {
        showApiError(error)
      } finally {
        submitting.current = false
        setLoading(false)
      }
      return
    }

    submitting.current = true
    setLoading(true)
    try {
      const payload: Schema<'EmployeeUpdate'> = {
        position: formData.position,
        permissions: formData.permissions,
        commission_percentage: formData.commission_percentage ?? null,
        base_salary: formData.base_salary ?? null,
      }
      await api.put(`/employees/${employeeId}`, payload)
      onSuccess()
    } catch (error) {
      showApiError(error)
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  const updatePermission = (key: keyof Permissions, value: boolean) => {
    setFormData({
      ...formData,
      permissions: { ...formData.permissions, [key]: value },
    })
  }

  if (generatedPassword) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-800 mb-2">{t('employeeForm.created')}</h4>
        <p className="text-sm text-green-700 mb-2">{t('employeeForm.password')}</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            readOnly
            value={generatedPassword}
            className="flex-1 bg-white p-3 rounded border border-green-300 font-mono text-lg font-bold text-center select-all cursor-text dark:bg-gray-800"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(generatedPassword)
                setPasswordCopied(true)
                setTimeout(() => setPasswordCopied(false), 2000)
              } catch {
                const input = document.createElement('input')
                input.value = generatedPassword
                document.body.appendChild(input)
                input.select()
                document.execCommand('copy')
                document.body.removeChild(input)
                setPasswordCopied(true)
                setTimeout(() => setPasswordCopied(false), 2000)
              }
            }}
            className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium whitespace-nowrap"
          >
            {passwordCopied ? t('employeeForm.copied') : t('employeeForm.copy')}
          </button>
        </div>
        <p className="text-xs text-green-600 mt-2">
          {t('employeeForm.passwordHint')}
        </p>
        <button
          type="button"
          onClick={onSuccess}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
        >
          {t('common.close')}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <div role="alert"><FormError message={formError} /></div>}
      {!employeeId ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('employeeForm.passwordInfo')}
          </p>

          <div>
            <label htmlFor="employee_full_name" className="block text-sm font-medium mb-1">
              {t('register.fullName')} *
            </label>
            <input
              aria-invalid={fieldErrors.full_name ? true : undefined}
              id="employee_full_name"
              type="text"
              value={newUserData.full_name}
              onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder={t('register.namePlaceholder')}
            />
            {fieldErrors.full_name && <FormError message={fieldErrors.full_name} />}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="employee_email" className="block text-sm font-medium mb-1">
                {t('register.email')}
              </label>
              <input
                aria-invalid={fieldErrors.email ? true : undefined}
                id="employee_email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="john@example.com"
              />
              {fieldErrors.email && <FormError message={fieldErrors.email} />}
            </div>
            <div>
              <label htmlFor="employee_phone" className="block text-sm font-medium mb-1">
                {t('register.phone')}
              </label>
              <input
                aria-invalid={fieldErrors.phone ? true : undefined}
                id="employee_phone"
                type="tel"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="+1234567890"
              />
              {fieldErrors.phone && <FormError message={fieldErrors.phone} />}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('register.contactRequired')}</p>

          <div>
            <label className="block text-sm font-medium mb-1">{t('register.specialistType')}</label>
            <SpecialistTypeSelector
              value={newUserData.specialist_type}
              onChange={(value) => setNewUserData({ ...newUserData, specialist_type: value })}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {t('employees.employee')}
          </label>
          <p className="px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            {employeeName || t('employees.unknown')}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">{t('employees.position')}</label>
        <input
          aria-invalid={fieldErrors.position ? true : undefined}
          type="text"
          value={formData.position || ''}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('employees.position_placeholder')}
        />
        {fieldErrors.position && <FormError message={fieldErrors.position} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('employees.commission')} (%)
          </label>
          <input
            aria-invalid={fieldErrors.commission_percentage ? true : undefined}
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.commission_percentage ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                commission_percentage: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border rounded-md"
            placeholder="0"
          />
          {fieldErrors.commission_percentage && <FormError message={fieldErrors.commission_percentage} />}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('employees.base_salary')}
          </label>
          <input
            aria-invalid={fieldErrors.base_salary ? true : undefined}
            type="number"
            min="0"
            max="100000000"
            step="0.01"
            value={formData.base_salary ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                base_salary: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border rounded-md"
            placeholder="0"
          />
          {fieldErrors.base_salary && <FormError message={fieldErrors.base_salary} />}
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-3">{t('employees.permissions')}</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.permissions?.can_create_visits ?? true}
              onChange={(e) => updatePermission('can_create_visits', e.target.checked)}
              className="mr-2"
            />
            <span>{t('employees.permission_create_visits')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.permissions?.can_edit_clients ?? true}
              onChange={(e) => updatePermission('can_edit_clients', e.target.checked)}
              className="mr-2"
            />
            <span>{t('employees.permission_edit_clients')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.permissions?.can_view_financials ?? false}
              onChange={(e) => updatePermission('can_view_financials', e.target.checked)}
              className="mr-2"
            />
            <span>{t('employees.permission_view_financials')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.permissions?.can_manage_services ?? false}
              onChange={(e) => updatePermission('can_manage_services', e.target.checked)}
              className="mr-2"
            />
            <span>{t('employees.permission_manage_services')}</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-900"
          disabled={loading}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? t('common.loading') + '...' : t('common.save')}
        </button>
      </div>
    </form>
  )
}

