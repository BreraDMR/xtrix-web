import { useState } from 'react'
import { Link } from 'react-router-dom'

import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
import AuthShell from '../components/auth/AuthShell'
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
    <AuthShell title={sent ? t('forgot.successTitle') : t('login.forgotPassword')} description={sent ? undefined : t('forgot.subtitle')}>

        {sent ? (
          <div className="space-y-6">
            <p role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
              {t('forgot.success')}
            </p>
            <Link
              to="/login"
              className="ui-button ui-button-primary w-full"
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
                className="ui-input"
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
              className="ui-button ui-button-primary w-full"
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
              <Link to="/login" className="text-sm font-medium text-[var(--workspace-accent)] hover:underline">
                {t('forgot.backToLogin')}
              </Link>
            </div>
          </form>
        )}
    </AuthShell>
  )
}
