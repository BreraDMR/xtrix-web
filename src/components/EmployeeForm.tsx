import { useState, useEffect } from 'react'
import api from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'

interface EmployeeFormProps {
  employeeId?: number
  onSuccess: () => void
  onCancel: () => void
}

interface EmployeeData {
  employee_user_id: number
  position?: string
  commission_percentage?: number
  base_salary?: number
  permissions?: {
    can_create_visits?: boolean
    can_edit_clients?: boolean
    can_view_financials?: boolean
    can_manage_services?: boolean
    assigned_client_ids?: number[] | null
  }
}

interface User {
  id: number
  full_name: string
  email: string
  role: string
}

export default function EmployeeForm({ employeeId, onSuccess, onCancel }: EmployeeFormProps) {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [formData, setFormData] = useState<EmployeeData>({
    employee_user_id: 0,
    position: '',
    commission_percentage: undefined,
    base_salary: undefined,
    permissions: {
      can_create_visits: true,
      can_edit_clients: true,
      can_view_financials: false,
      can_manage_services: false,
      assigned_client_ids: null,
    },
  })

  useEffect(() => {
    loadAvailableUsers()
    if (employeeId) {
      loadEmployee()
    }
  }, [employeeId])

  const loadAvailableUsers = async () => {
    setLoadingUsers(true)
    try {
      // Получаем список всех пользователей с ролями specialist или employee
      // которые еще не являются сотрудниками
      const { data } = await api.get('/users/', { params: { role: 'specialist' } })
      const users = Array.isArray(data) ? data : (data?.items || data?.data || [])
      // Фильтруем: исключаем текущего пользователя и пользователей, которые уже являются сотрудниками
      setAvailableUsers(users.filter((u: User) => u.id !== currentUser?.id))
    } catch (error) {
      console.error('Failed to load users:', error)
      // Fallback: если endpoint не работает, оставляем пустой список
      setAvailableUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadEmployee = async () => {
    if (!employeeId) return
    try {
      const { data } = await api.get(`/employees/${employeeId}`)
      setFormData({
        employee_user_id: data.employee_user_id,
        position: data.position || '',
        commission_percentage: data.commission_percentage,
        base_salary: data.base_salary,
        permissions: data.permissions || {
          can_create_visits: true,
          can_edit_clients: true,
          can_view_financials: false,
          can_manage_services: false,
          assigned_client_ids: null,
        },
      })
    } catch (error) {
      console.error('Failed to load employee:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.employee_user_id === 0) {
      alert(t('employees.select_user_required'))
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        // Убираем undefined значения
        commission_percentage: formData.commission_percentage || null,
        base_salary: formData.base_salary || null,
      }

      if (employeeId) {
        await api.put(`/employees/${employeeId}`, payload)
      } else {
        // Для создания отправляем business_owner_id в теле запроса
        // Для business_owner и admin используем их ID (бэкенд обработает это правильно)
        const createPayload = {
          ...payload,
          // Отправляем ID пользователя для business_owner и admin
          // Бэкенд автоматически использует правильный business_owner_id
          business_owner_id: (currentUser?.role === 'business_owner' || currentUser?.role === 'admin') 
            ? currentUser.id 
            : undefined,
        }
        await api.post('/employees/', createPayload)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save employee:', error)
      alert(error.response?.data?.detail || error.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const updatePermission = (key: keyof NonNullable<EmployeeData['permissions']>, value: any) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: value,
      } as EmployeeData['permissions'],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('employees.select_user')} *
        </label>
        {loadingUsers ? (
          <div className="text-sm text-gray-500">{t('common.loading')}...</div>
        ) : (
          <select
            value={formData.employee_user_id}
            onChange={(e) =>
              setFormData({ ...formData, employee_user_id: parseInt(e.target.value) })
            }
            required
            disabled={!!employeeId} // Нельзя менять пользователя при редактировании
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          >
            <option value={0}>{t('employees.select_user_placeholder')}</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.email})
              </option>
            ))}
          </select>
        )}
        {availableUsers.length === 0 && !loadingUsers && (
          <p className="text-sm text-gray-500 mt-1">
            {t('employees.no_available_users')}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('employees.position')}</label>
        <input
          type="text"
          value={formData.position || ''}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder={t('employees.position_placeholder')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('employees.commission')} (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.commission_percentage || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                commission_percentage: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border rounded-md"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('employees.base_salary')} ({t('common.currency')})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.base_salary || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                base_salary: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border rounded-md"
            placeholder="0"
          />
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
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? t('common.loading') + '...' : t('common.save')}
        </button>
      </div>
    </form>
  )
}

