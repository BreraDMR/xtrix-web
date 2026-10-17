import { useState, useEffect } from 'react'
import api from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { HiSearch, HiX } from 'react-icons/hi'

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
  email?: string
  phone?: string
  role: string
}

interface NewUserData {
  full_name: string
  phone: string
  email: string
  specialist_type?: string
}

export default function EmployeeForm({ employeeId, onSuccess, onCancel }: EmployeeFormProps) {
  const { t } = useTranslation()
  const { user: currentUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [createNewUser, setCreateNewUser] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [newUserData, setNewUserData] = useState<NewUserData>({
    full_name: '',
    phone: '',
    email: '',
    specialist_type: '',
  })

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders are plain functions, rerun only on these
  }, [employeeId])

  const loadAvailableUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data: usersData } = await api.get('/users/', { params: { role: 'specialist' } })
      const allUsers = Array.isArray(usersData) 
        ? usersData 
        : (usersData?.items || usersData?.data || [])
      
      const { data: employeesData } = await api.get('/employees/', { params: { is_active: true } })
      const activeEmployees = Array.isArray(employeesData) 
        ? employeesData 
        : (employeesData?.items || employeesData?.data || [])
      const employedUserIds = new Set(activeEmployees.map((emp: any) => emp.employee_user_id))
      
      const available = allUsers.filter((u: User) => 
        u.id !== currentUser?.id && !employedUserIds.has(u.id)
      )
      setAvailableUsers(available)
      setFilteredUsers(available)
    } catch (error) {
      console.error('Failed to load users:', error)
      setAvailableUsers([])
      setFilteredUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setFilteredUsers(availableUsers)
      return
    }

    const query = userSearchQuery.toLowerCase().trim()
    const filtered = availableUsers.filter((u) => {
      const name = (u.full_name || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const phone = (u.phone || '').toLowerCase()
      return name.includes(query) || email.includes(query) || phone.includes(query)
    })
    setFilteredUsers(filtered)
  }, [userSearchQuery, availableUsers])

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
    
    if (createNewUser && !employeeId) {
      if (!newUserData.full_name.trim()) {
        alert('Full name is required')
        return
      }
      if (!newUserData.email && !newUserData.phone) {
        alert('Email or phone number is required')
        return
      }

      setLoading(true)
      try {
        const payload = {
          full_name: newUserData.full_name,
          phone: newUserData.phone || undefined,
          email: newUserData.email || undefined,
          role: 'specialist',
          specialist_type: newUserData.specialist_type 
            ? newUserData.specialist_type 
            : undefined,
          
          position: formData.position || undefined,
          commission_percentage: formData.commission_percentage || undefined,
          base_salary: formData.base_salary || undefined,
          permissions: formData.permissions,
          notes: undefined,
        }

        const response = await api.post('/employees/create-with-user', payload)
        
        setGeneratedPassword(response.data.generated_password)
        
      } catch (error: any) {
        console.error('Failed to create employee with user:', error)
        const errorMessage = error.response?.data?.detail || error.message || t('common.error')
        alert(errorMessage)
      } finally {
        setLoading(false)
      }
      return
    }

    if (formData.employee_user_id === 0) {
      alert(t('employees.select_user_required'))
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        commission_percentage: formData.commission_percentage || null,
        base_salary: formData.base_salary || null,
      }

      if (employeeId) {
        await api.put(`/employees/${employeeId}`, payload)
      } else {
        const createPayload = {
          ...payload,
          business_owner_id: (currentUser?.role === 'business_owner' || currentUser?.role === 'admin') 
            ? currentUser.id 
            : undefined,
        }
        await api.post('/employees/', createPayload)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save employee:', error)
      let errorMessage = error.response?.data?.detail || error.message || t('common.error')
      
      if (errorMessage.includes('already employed')) {
        errorMessage = 'This user is already employed by another business. Please select a different user or contact support to transfer the employee.'
      }
      
      alert(errorMessage)
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
      {!employeeId && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={createNewUser}
              onChange={(e) => {
                setCreateNewUser(e.target.checked)
                if (!e.target.checked) {
                  setNewUserData({
                    full_name: '',
                    phone: '',
                    email: '',
                    specialist_type: '',
                  })
                  setGeneratedPassword(null)
                  setPasswordCopied(false)
                }
              }}
              className="mr-2"
            />
            <span className="font-medium">Create new employee account</span>
          </label>
          <p className="text-sm text-gray-600 mt-1 ml-6">
            A password will be automatically generated and shown after creation
          </p>
        </div>
      )}

      {createNewUser && !employeeId ? (
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">New Employee Information</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={newUserData.full_name}
              onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-md"
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="+1234567890"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">At least one of Email or Phone is required</p>

          <div>
            <label className="block text-sm font-medium mb-1">
              Specialist Type
            </label>
            <select
              value={newUserData.specialist_type}
              onChange={(e) => setNewUserData({ ...newUserData, specialist_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select type...</option>
              <option value="beauty">Beauty</option>
              <option value="wellness">Wellness</option>
              <option value="healthcare">Healthcare</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {t('employees.select_user')} *
          </label>
          
          {}
          <div className="mb-2 relative">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder={t('employees.search_user') || 'Поиск по имени, email или телефону...'}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              {userSearchQuery && (
                <button
                  type="button"
                  onClick={() => setUserSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Очистить"
                >
                  <HiX className="w-5 h-5" />
                </button>
              )}
            </div>
            {userSearchQuery && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {filteredUsers.length === 0 
                  ? t('employees.no_users_found') || 'Специалисты не найдены'
                  : `${filteredUsers.length} ${filteredUsers.length === 1 ? 'специалист найден' : 'специалистов найдено'}`
                }
              </div>
            )}
          </div>

          {loadingUsers ? (
            <div className="text-sm text-gray-500">{t('common.loading')}...</div>
          ) : (
            <>
              <select
                value={formData.employee_user_id}
                onChange={(e) =>
                  setFormData({ ...formData, employee_user_id: parseInt(e.target.value) })
                }
                required
                disabled={!!employeeId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value={0}>{t('employees.select_user_placeholder')}</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} {u.email ? `(${u.email})` : ''} {u.phone ? `- ${u.phone}` : ''}
                  </option>
                ))}
              </select>
            </>
          )}
          {availableUsers.length === 0 && !loadingUsers && !userSearchQuery && (
            <p className="text-sm text-gray-500 mt-1">
              {t('employees.no_available_users')}
            </p>
          )}
        </div>
      )}

      {generatedPassword && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Employee Created Successfully!</h4>
          <p className="text-sm text-green-700 mb-2">Generated Password:</p>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              readOnly
              value={generatedPassword}
              className="flex-1 bg-white p-3 rounded border border-green-300 font-mono text-lg font-bold text-center select-all cursor-text"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(generatedPassword)
                  setPasswordCopied(true)
                  setTimeout(() => setPasswordCopied(false), 2000)
                } catch (err) {
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
              {passwordCopied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-green-600 mt-2">
            Please save this password and provide it to the employee. They can log in using their email or phone number.
          </p>
          <button
            type="button"
            onClick={() => {
              setGeneratedPassword(null)
              setPasswordCopied(false)
              onSuccess()
            }}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
          >
            Close
          </button>
        </div>
      )}

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
            {t('employees.base_salary')}
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
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? t('common.loading') + '...' : t('common.save')}
        </button>
      </div>
    </form>
  )
}

