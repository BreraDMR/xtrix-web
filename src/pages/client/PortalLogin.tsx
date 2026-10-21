import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import ClientShell from '../../components/client/ClientShell'
import FormError from '../../components/FormError'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useTranslation } from '../../hooks/useTranslation'
import type { ClientPortalSessionOut } from '../../api/types'
import { readPortalToken, savePortalToken } from '../../utils/portalSession'

function linkTokenFromHash(): string {
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const token = params.get('token') ?? ''
    if (!token && window.location.hash.length > 1 && !window.location.hash.includes('=')) {
      return window.location.hash.slice(1).trim()
    }
    return token.trim()
  } catch {
    return ''
  }
}

function stripHash(): void {
  if (!window.location.hash) return
  try {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  } catch {
    // the link still works, the address bar keeps the hash
  }
}

export default function PortalLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [linkToken] = useState(linkTokenFromHash)
  const [status, setStatus] = useState<'idle' | 'verifying' | 'invalid'>(() =>
    linkToken || readPortalToken() ? 'verifying' : 'idle',
  )
  const [salon, setSalon] = useState(() => (searchParams.get('salon') ?? '').trim().toLowerCase())
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (!linkToken) {
      if (readPortalToken()) navigate('/client', { replace: true })
      return
    }
    if (started.current) return
    started.current = true
    stripHash()
    api
      .post<ClientPortalSessionOut>('/public/client-portal/verify', { token: linkToken })
      .then(({ data }) => {
        savePortalToken(data.session_token)
        navigate('/client', { replace: true })
      })
      .catch(() => setStatus('invalid'))
  }, [linkToken, navigate])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const code = salon.trim()
    if (!code || !email.trim()) return
    setError('')
    setSending(true)
    try {
      await api.post(`/public/client-portal/${encodeURIComponent(code)}/request`, {
        email: email.trim(),
      })
      setSent(true)
    } catch (err) {
      setError(apiErrorMessage(err, t('portal.login.failed')))
    } finally {
      setSending(false)
    }
  }

  if (status === 'verifying') {
    return (
      <ClientShell title={t('portal.title')}>
        <div className="flex flex-col items-center gap-4 py-24 text-sm text-slate-500 dark:text-gray-400">
          <LoadingSpinner size="lg" />
          <p role="status">{t('portal.login.verifying')}</p>
        </div>
      </ClientShell>
    )
  }

  return (
    <ClientShell title={t('portal.title')}>
      <section className="ui-card space-y-6 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('portal.login.title')}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">{t('portal.login.subtitle')}</p>
        </div>

        {status === 'invalid' && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          >
            {t('portal.login.invalidLink')}
          </div>
        )}

        {sent ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold">{t('portal.login.sentTitle')}</h2>
              <p role="status" className="mt-2 text-sm text-slate-600 dark:text-gray-300">
                {t('portal.login.sent')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSent(false)
                setEmail('')
              }}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {t('portal.login.another')}
            </button>
          </div>
        ) : (
          <>
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-gray-900 dark:text-gray-300">
              {t('portal.login.needSalon')}
            </p>
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div>
                <label htmlFor="portal-salon" className="mb-2 block text-sm font-medium">
                  {t('portal.login.salon')}
                </label>
                <input
                  id="portal-salon"
                  name="salon"
                  value={salon}
                  onChange={(event) => setSalon(event.target.value)}
                  required
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{t('portal.login.salonHint')}</p>
              </div>
              <div>
                <label htmlFor="portal-email" className="mb-2 block text-sm font-medium">
                  {t('portal.login.email')}
                </label>
                <input
                  id="portal-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="your@email.com"
                />
              </div>
              {error && <FormError message={error} />}
              <button
                type="submit"
                disabled={sending || !salon.trim() || !email.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white shadow-md transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>{t('portal.login.sending')}</span>
                  </>
                ) : (
                  t('portal.login.submit')
                )}
              </button>
            </form>
          </>
        )}
      </section>
    </ClientShell>
  )
}
