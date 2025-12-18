import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { logger } from '../utils/logger'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Register() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client' as 'admin' | 'specialist' | 'client',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  // Если уже залогинен, перенаправляем на главную
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

    // Валидация
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
      
      // Создаем пользователя
      const { data: userData } = await api.post('/users/', {
        full_name: formData.full_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role,
      })

      logger.log('[Register] User created successfully')

      // После успешной регистрации сразу логиним пользователя
      const { data: loginData } = await api.post('/users/login', {
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
      })

      if (!loginData.access_token) {
        throw new Error('No access token received')
      }

      // Сохраняем токен
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', loginData.access_token)
        logger.log('[Register] Token saved to localStorage')
      }

      setAuth(loginData.access_token, { id: 0, full_name: formData.full_name, role: formData.role })
      logger.log('[Register] Token saved to store')

      // Получаем информацию о пользователе
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

      // Редиректим на главную
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } catch (err: any) {
      console.error('Registration error:', err)
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error?.message ||
                          err.message || 
                          'Registration failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 py-8">
      <div className="max-w-md w-full space-y-8 p-6 sm:p-8 bg-white rounded-xl shadow-2xl animate-fade-in">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Xtrix</h2>
          <p className="text-gray-600">{t('createAccount')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              {t('fullName')} *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')} {!formData.phone && '*'}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required={!formData.phone}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              {t('phone')} {!formData.email && '*'}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required={!formData.email}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700 font-medium">
                ⚠️ Password requirements:
              </p>
              <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                <li>Minimum 8 characters</li>
                <li>At least one uppercase letter (A-Z)</li>
                <li>At least one lowercase letter (a-z)</li>
                <li>At least one number (0-9)</li>
                <li>At least one special character (!@#$%^&*)</li>
              </ul>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              {t('confirmPassword')} *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'specialist' | 'client' })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="client">Client</option>
              <option value="specialist">Specialist</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-slide-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Creating account...</span>
              </>
            ) : (
              t('createAccount')
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}





