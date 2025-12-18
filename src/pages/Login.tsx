import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { logger } from '../utils/logger'
import { useTranslation } from '../hooks/useTranslation'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const { setAuth } = useAuthStore()
  
  // Если уже залогинен, перенаправляем на главную
  useEffect(() => {
    // Проверяем только localStorage, так как store может не успеть обновиться
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (localToken) {
      logger.log('[Login] Already authenticated, redirecting to home')
      // Используем window.location для надежности
      window.location.href = '/'
    }
  }, []) // Убираем зависимость от token, чтобы избежать лишних редиректов

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showForgotPassword) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showForgotPassword])

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
      
      // Сохраняем токен в localStorage СНАЧАЛА
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.access_token)
        logger.log('[Login] Token saved to localStorage')
      }
      
      // Сохраняем токен в store
      setAuth(data.access_token, { id: 0, full_name: '', role: '' })
      logger.log('[Login] Token saved to store')
      
      // Небольшая задержка, чтобы токен успел сохраниться и обновиться в состоянии
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Fetch user info с новым токеном
      try {
        const userRes = await api.get('/users/me')
        console.log('[Login] User info fetched:', userRes.data)
        // Обновляем с полной информацией о пользователе
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(userRes.data))
        }
        setAuth(data.access_token, userRes.data)
      } catch (err: any) {
        console.warn('[Login] Could not fetch user info:', err)
        // Fallback: используем email как имя
        const fallbackUser = { id: 0, full_name: email, role: 'admin' }
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_user', JSON.stringify(fallbackUser))
        }
        setAuth(data.access_token, fallbackUser)
      }
      
      // Успешный логин - сразу редиректим
      logger.log('[Login] Login successful, redirecting to home...')
      
      // Используем небольшую задержку, чтобы дать время на сохранение в localStorage
      // Затем делаем полную перезагрузку страницы для гарантии
      setTimeout(() => {
        window.location.href = '/'
      }, 100)
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err.response?.data?.error?.message || 
                          err.response?.data?.detail || 
                          err.message || 
                          'Login failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-8 p-6 sm:p-8 bg-white rounded-xl shadow-2xl animate-fade-in">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Xtrix</h2>
          <p className="text-gray-600">{t('login')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('forgotPassword')}
            </button>
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
                <span>Logging in...</span>
              </>
            ) : (
              t('login')
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">{t('resetPassword')}</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false)
                  setForgotPasswordEmail('')
                  setForgotPasswordPhone('')
                  setForgotPasswordMessage('')
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Enter your email or phone number to receive a password reset link.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                
                if (!forgotPasswordEmail && !forgotPasswordPhone) {
                  setForgotPasswordMessage('Please enter email or phone number')
                  return
                }
                
                setForgotPasswordLoading(true)
                setForgotPasswordMessage('')
                
                try {
                  const response = await api.post('/users/forgot-password', {
                    email: forgotPasswordEmail || undefined,
                    phone: forgotPasswordPhone || undefined,
                  })
                  
                  // Show success message
                  let message = response.data.message || 'Password reset code has been sent.'
                  
                  // If code is returned (for development/testing), show it
                  if (response.data.code) {
                    message = `Password reset code has been generated.\n\nYour reset code: ${response.data.code}\n\nPlease enter this code below to reset your password.`
                  } else {
                    message = 'Password reset code has been sent. Please check your email or phone for the reset code, then enter it below to reset your password.'
                  }
                  
                  setForgotPasswordMessage(message)
                  setShowResetForm(true)
                } catch (err: any) {
                  setForgotPasswordMessage(
                    err.response?.data?.detail || 'An error occurred. Please try again.'
                  )
                } finally {
                  setForgotPasswordLoading(false)
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div className="text-center text-gray-500 text-sm">OR</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={forgotPasswordPhone}
                  onChange={(e) => setForgotPasswordPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+1234567890"
                />
              </div>
              {forgotPasswordMessage && (
                <div
                  className={`p-3 rounded-lg text-sm whitespace-pre-line ${
                    forgotPasswordMessage.includes('error') || forgotPasswordMessage.includes('Error') || forgotPasswordMessage.includes('occurred')
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : 'bg-blue-50 border border-blue-200 text-blue-700'
                  }`}
                >
                  {forgotPasswordMessage}
                </div>
              )}
              {!showResetForm ? (
                <button
                  type="submit"
                  disabled={forgotPasswordLoading || (!forgotPasswordEmail && !forgotPasswordPhone)}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {forgotPasswordLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              ) : (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reset Code
                    </label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter new password"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum 8 characters, include uppercase, lowercase, number, and special character
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!resetCode || resetCode.length !== 6) {
                        setForgotPasswordMessage('Please enter a valid 6-digit code')
                        return
                      }
                      if (!newPassword || newPassword.length < 8) {
                        setForgotPasswordMessage('Password must be at least 8 characters')
                        return
                      }
                      if (newPassword !== confirmPassword) {
                        setForgotPasswordMessage('Passwords do not match')
                        return
                      }
                      
                      setResetLoading(true)
                      setForgotPasswordMessage('')
                      
                      try {
                        const response = await api.post('/users/reset-password', {
                          code: resetCode,
                          new_password: newPassword,
                        })
                        
                        setForgotPasswordMessage(response.data.message || 'Password has been reset successfully!')
                        
                        // Close modal and redirect to login after 2 seconds
                        setTimeout(() => {
                          setShowForgotPassword(false)
                          setShowResetForm(false)
                          setForgotPasswordEmail('')
                          setForgotPasswordPhone('')
                          setResetCode('')
                          setNewPassword('')
                          setConfirmPassword('')
                        }, 2000)
                      } catch (err: any) {
                        setForgotPasswordMessage(
                          err.response?.data?.detail || 'An error occurred. Please try again.'
                        )
                      } finally {
                        setResetLoading(false)
                      }
                    }}
                    disabled={resetLoading || !resetCode || !newPassword || !confirmPassword}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Resetting...</span>
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

