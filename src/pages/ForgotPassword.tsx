import { useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
import LanguageSwitcher from '../components/LanguageSwitcher'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/password-reset/request', { email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(apiErrorMessage(err, t('forgot.failed')))
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
          <p className="text-gray-600 dark:text-gray-300">{sent ? t('forgot.successTitle') : t('forgot.subtitle')}</p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              {t('forgot.success')}
            </p>
            <Link
              to="/login"
              className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center font-medium text-white shadow-md transition-all hover:bg-primary-700 hover:shadow-lg"
            >
              {t('forgot.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('forgot.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
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
                  <span>{t('forgot.sending')}</span>
                </>
              ) : (
                t('forgot.submit')
              )}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {t('forgot.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
