import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import SpecialistTypeSelector from '../components/SpecialistTypeSelector'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'
import { logger } from '../utils/logger'

export default function Register() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'specialist' as 'admin' | 'specialist',
    specialist_type: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (localToken) {
      logger.log('[Register] Already authenticated, redirecting to home')
      window.location.href = '/'
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!formData.email && !formData.phone) {
      setError('Please provide either email or phone number')
      setLoading(false)
      return
    }

    try {
      logger.log('[Register] Attempting registration', { email: formData.email, phone: formData.phone })
      
      if (formData.role === 'specialist' && !formData.specialist_type) {
        setError(t('register.specialistTypeRequired'))
        setLoading(false)
        return
      }

      const userDataPayload: any = {
        full_name: formData.full_name,
        password: formData.password,
        role: formData.role,
      }
      
      if (formData.email && formData.email.trim()) {
        userDataPayload.email = formData.email.trim()
      }
      
      if (formData.phone && formData.phone.trim()) {
        userDataPayload.phone = formData.phone.trim()
      }
      
      if (formData.role === 'specialist' && formData.specialist_type) {
        userDataPayload.specialist_type = formData.specialist_type
      }

      const { data: userData } = await api.post('/users/', userDataPayload)

      logger.log('[Register] User created successfully')

      const { data: loginData } = await api.post('/users/login', {
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
      })

      if (!loginData.access_token) {
        throw new Error('No access token received')
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', loginData.access_token)
        logger.log('[Register] Token saved to localStorage')
      }

      setAuth(loginData.access_token, { id: 0, full_name: formData.full_name, role: formData.role })
      logger.log('[Register] Token saved to store')

      try {
        const userRes = await api.get('/users/me')
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(userRes.data))
        }
        setAuth(loginData.access_token, userRes.data)
      } catch (err: any) {
        console.warn('[Register] Could not fetch user info:', err)
        const fallbackUser = { id: userData.id || 0, full_name: formData.full_name, role: formData.role }
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(fallbackUser))
        }
        setAuth(loginData.access_token, fallbackUser)
      }

      logger.log('[Register] Registration successful, redirecting to home...')

      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } catch (err: any) {
      console.error('Registration error:', err)
      
      let errorMessage = 'Registration failed'
      
      if (err.response?.data) {
        const data = err.response.data
        
        if (data.error?.detail?.validation_errors && Array.isArray(data.error.detail.validation_errors) && data.error.detail.validation_errors.length > 0) {
          const firstError = data.error.detail.validation_errors[0]
          errorMessage = `${firstError.field}: ${firstError.message}`
          if (firstError.hint) {
            errorMessage += ` (${firstError.hint})`
          }
        }
        else if (data.detail && Array.isArray(data.detail) && data.detail.length > 0) {
          const firstError = data.detail[0]
          const field = Array.isArray(firstError.loc) ? firstError.loc[firstError.loc.length - 1] : 'field'
          errorMessage = `${field}: ${firstError.msg || 'Validation error'}`
        }
        else if (data.error?.message) {
          errorMessage = data.error.message
        }
        else if (typeof data.detail === 'string') {
          errorMessage = data.detail
        }
      }
      else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-2xl animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Xtrix</h2>
          <p className="text-gray-600 dark:text-gray-300">{t('register.title')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('register.fullName')} *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.email')} {!formData.phone && '*'}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required={!formData.phone}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.phone')} {!formData.email && '*'}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required={!formData.email}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.password')} *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Minimum 8 characters, include uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.confirmPassword')} *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              {t('register.role')} *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as 'admin' | 'specialist'
                setFormData({ 
                  ...formData, 
                  role: newRole,
                  specialist_type: newRole !== 'specialist' ? '' : formData.specialist_type,
                })
              }}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="specialist">Specialist</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === 'specialist' && (
            <div>
              <label htmlFor="specialist_type" className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.specialistType')} *
              </label>
              <SpecialistTypeSelector
                value={formData.specialist_type}
                onChange={(value) => setFormData({ ...formData, specialist_type: value })}
                required
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm animate-slide-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Creating account...</span>
              </>
            ) : (
              t('register.createAccount')
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


