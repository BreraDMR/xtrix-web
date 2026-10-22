import GoogleSignIn from '../components/auth/GoogleSignIn'
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { apiErrorMessage, apiErrorStatus } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import AuthShell from '../components/auth/AuthShell'
import { useTranslation } from '../hooks/useTranslation'
import { sanitizeReturnTo } from '../utils/returnTo'

export default function Login() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const returnTo = sanitizeReturnTo(new URLSearchParams(location.search).get('returnTo'), '/app')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // the server said this account has 2FA on: same form, plus the code from the app
  const [needsCode, setNeedsCode] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, startSession } = useAuthStore()
  
  useEffect(() => {
    if (useAuthStore.getState().token && useAuthStore.getState().user) navigate(returnTo, { replace: true })
  }, [navigate, returnTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let revision = useAuthStore.getState().sessionRevision
    try {
      const { data } = await api.post('/users/login', needsCode ? { email, password, totp_token: code.trim() } : { email, password })
      if (useAuthStore.getState().sessionRevision !== revision) return
      if (data?.requires_2fa && !data.access_token) {
        setNeedsCode(true)
        return
      }
      if (!data.access_token) throw new Error('No access token received')
      startSession(data.access_token, data.refresh_token)
      revision = useAuthStore.getState().sessionRevision
      const { data: user } = await api.get('/users/me')
      if (useAuthStore.getState().sessionRevision !== revision) return
      const token = useAuthStore.getState().token
      if (!token) throw new Error('Session expired')
      setAuth(token, user)
      navigate(returnTo, { replace: true })
    } catch (err) {
      if (useAuthStore.getState().sessionRevision !== revision) return
      useAuthStore.getState().logout()
      // with the code step on, a 401 means the code was off (the password passed a moment ago)
      setError(needsCode && apiErrorStatus(err) === 401 ? t('login.twoFactorWrong') : apiErrorMessage(err, t('login.failed')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title={t('login.subtitle')}>
        {location.state?.accountCreated === true && (
          <p role="status" className="p-3 text-sm text-green-800 bg-green-50 rounded-lg">
            {t('register.accountCreatedSignIn')}
          </p>
        )}
        <GoogleSignIn returnTo={returnTo} />
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
              readOnly={needsCode}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="ui-input"
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
              readOnly={needsCode}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="ui-input"
              placeholder="••••••••"
            />
            {!needsCode && (
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm font-medium text-[var(--workspace-accent)] hover:underline">
                  {t('login.forgotPassword')}
                </Link>
              </div>
            )}
          </div>
          {needsCode && (
            <div>
              <p role="status" className="mb-3 p-3 text-sm text-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)] rounded-lg">
                {t('login.twoFactorPrompt')}
              </p>
              <label htmlFor="totp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('login.twoFactorCode')}
              </label>
              <input
                id="totp"
                name="totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                className="ui-input tracking-widest"
                placeholder="123456"
              />
              <button
                type="button"
                onClick={() => { setNeedsCode(false); setCode(''); setPassword(''); setError('') }}
                className="mt-2 text-sm text-[var(--workspace-accent)] hover:underline"
              >
                {t('login.twoFactorBack')}
              </button>
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
            className="ui-button ui-button-primary w-full"
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
            <Link to="/register" className="text-[var(--workspace-accent)] hover:underline font-medium">
              {t('login.signUp')}
            </Link>
          </p>
        </div>
    </AuthShell>
  )
}

