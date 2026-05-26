import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'
import { logger } from '../utils/logger'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  
  useEffect(() => {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (localToken) {
      logger.log('[Login] Already authenticated, redirecting to home')
      window.location.href = '/'
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/users/login', { email, password })
      logger.log('[Login] Login successful, received tokens', { hasToken: !!data.access_token })
      
      if (!data.access_token) {
        throw new Error('No access token received')
      }
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token)
        logger.log('[Login] Token saved to localStorage')
      }
      
      setAuth(data.access_token, { id: 0, full_name: '', role: '' })
      logger.log('[Login] Token saved to store')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      try {
        const userRes = await api.get('/users/me')
        console.log('[Login] User info fetched:', userRes.data)
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(userRes.data))
        }
        setAuth(data.access_token, userRes.data)
      } catch (err: any) {
        console.warn('[Login] Could not fetch user info:', err)
        const fallbackUser = { id: 0, full_name: email, role: 'admin' }
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(fallbackUser))
        }
        setAuth(data.access_token, fallbackUser)
      }
      
      logger.log('[Login] Login successful, redirecting to home...')
      
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.detail || 
                          err.message || 
                          t('login.failed')
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
          <p className="text-gray-600 dark:text-gray-300">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('login.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('login.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
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
                <span>{t('login.loggingIn')}</span>
              </>
            ) : (
              t('login.signIn')
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('login.dontHaveAccount')}{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              {t('login.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

