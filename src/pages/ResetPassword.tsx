import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../api/client'
import { apiErrorStatus, apiFormErrors } from '../api/errors'
import FormError from '../components/FormError'
import LanguageSwitcher from '../components/LanguageSwitcher'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'

// The token arrives in the fragment, which never reaches the server or the referrer.
// This stays pure: StrictMode calls the initializer twice, so stripping the hash here
// would make the second call lose the token. The hash is removed in the effect below.
function readToken(): string {
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    let token = params.get('token') ?? ''
    if (!token && window.location.hash.length > 1 && !window.location.hash.includes('=')) {
      token = window.location.hash.slice(1)
    }
    return token.trim()
  } catch {
    return ''
  }
}

export default function ResetPassword() {
  const { t } = useTranslation()
  const [token] = useState(readToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [invalid, setInvalid] = useState(!token)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!window.location.hash) return
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    } catch {
      // the token already lives in component state
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    if (newPassword !== confirmation) {
      setError(t('register.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/password-reset/confirm', { token, new_password: newPassword })
      setNewPassword('')
      setConfirmation('')
      setDone(true)
    } catch (err) {
      if (apiErrorStatus(err) === 400) {
        setInvalid(true)
      } else {
        const parsed = apiFormErrors(err, ['new_password'], t('reset.failed'))
        setFieldErrors(parsed.fields)
        setError(parsed.general)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5 py-16 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="ui-card max-w-md w-full space-y-8 p-8 sm:p-10">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-[-1.5px] text-gray-900 dark:text-white mb-3">Xtrix</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {invalid ? t('reset.invalidTitle') : done ? t('reset.successTitle') : t('reset.subtitle')}
          </p>
        </div>

        {invalid ? (
          <div className="space-y-6">
            <p role="alert" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {t('reset.invalid')}
            </p>
            <Link
              to="/forgot-password"
              className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center font-medium text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg"
            >
              {t('reset.requestNew')}
            </Link>
            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {t('reset.backToLogin')}
              </Link>
            </div>
          </div>
        ) : done ? (
          <div className="space-y-6">
            <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              {t('reset.success')}
            </p>
            <Link
              to="/login"
              className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center font-medium text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg"
            >
              {t('reset.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reset.newPassword')}
              </label>
              <input
                aria-invalid={fieldErrors.new_password ? true : undefined}
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              {fieldErrors.new_password && <FormError message={fieldErrors.new_password} />}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('register.passwordHint')}</p>
            </div>
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reset.confirmPassword')}
              </label>
              <input
                id="confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
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
                  <span>{t('reset.saving')}</span>
                </>
              ) : (
                t('reset.submit')
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
