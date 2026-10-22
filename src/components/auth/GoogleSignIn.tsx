import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import { apiErrorCode, apiErrorMessage, apiErrorStatus } from '../../api/errors'
import type { Schema } from '../../api/types'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
import { loadGoogleIdentity } from '../../utils/googleIdentity'
import LoadingSpinner from '../LoadingSpinner'

export default function GoogleSignIn({ role = 'business_owner', returnTo = '/app', registration = false }: { role?: 'business_owner' | 'specialist'; returnTo?: string; registration?: boolean }) {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const config = useQuery({ queryKey: ['google-auth-config'], retry: false,
    queryFn: async () => (await api.get<Schema<'GoogleConfigOut'>>('/auth/google/config')).data })
  const target = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [link, setLink] = useState<{ credential: string; nonce: string; linking: boolean } | null>(null)
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [needsCode, setNeedsCode] = useState(false)
  const [code, setCode] = useState('')
  const mounted = useRef(true)
  const inFlight = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const authenticate = useRef<(credential: string, nonce: string, linking?: boolean) => Promise<void>>(async () => {})
  authenticate.current = async (credential, nonce, linking = false) => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    let issuedToken: string | null = null
    let revision = useAuthStore.getState().sessionRevision
    try {
      const { data } = await api.post<Schema<'LoginResponse'>>('/auth/google/login', {
        credential, nonce, role,
        ...(linking ? { link_existing: true, password } : {}),
        ...(code ? { totp_token: code } : {}),
      })
      if (!mounted.current || useAuthStore.getState().sessionRevision !== revision) return
      if (data.requires_2fa && !data.access_token) {
        setLink({ credential, nonce, linking }); setNeedsCode(true); return
      }
      if (!data.access_token) throw new Error(t('google.failed'))
      issuedToken = data.access_token
      useAuthStore.getState().startSession(data.access_token, data.refresh_token)
      revision = useAuthStore.getState().sessionRevision
      const user = (await api.get('/users/me')).data
      if (!mounted.current || useAuthStore.getState().sessionRevision !== revision) return
      const token = useAuthStore.getState().token
      if (token !== issuedToken) return
      useAuthStore.getState().setAuth(token, user)
      setPassword(''); setCode(''); setLink(null)
      navigate(returnTo, { replace: true })
    } catch (failure) {
      if (!mounted.current || useAuthStore.getState().sessionRevision !== revision) return
      const failureCode = apiErrorCode(failure) ?? apiErrorMessage(failure, '')
      if (apiErrorStatus(failure) === 409 && failureCode !== 'google_identity_already_linked') {
        setLink({ credential, nonce, linking: true }); setConsent(false)
        setError(t('google.linkRequired'))
      } else {
        setError(failureCode === 'pilot_invitation_required' ? t('pilot.invitation') : t('google.failed'))
        if (issuedToken && useAuthStore.getState().token === issuedToken && !useAuthStore.getState().user) useAuthStore.getState().logout()
      }
    } finally {
      inFlight.current = false
      if (mounted.current) setBusy(false)
    }
  }

  const unavailableMessage = t('google.unavailable')
  useEffect(() => {
    if (!config.data?.enabled || !config.data.client_id) return
    let cancelled = false
    const element = target.current
    const clientId = config.data.client_id
    const setup = async () => {
      try {
        const [identity, response] = await Promise.all([
          loadGoogleIdentity(), api.post<Schema<'GoogleNonceOut'>>('/auth/google/nonce'),
        ])
        if (cancelled || !element) return
        identity.initialize({ client_id: clientId, nonce: response.data.nonce, auto_select: false,
          callback: answer => { if (!cancelled) void authenticate.current(answer.credential, response.data.nonce) } })
        element.replaceChildren()
        identity.renderButton(element, { theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with', locale: locale === 'cz' ? 'cs' : locale, width: Math.min(element.clientWidth || 300, 350) })
      } catch {
        if (!cancelled) setError(unavailableMessage)
      }
    }
    void setup()
    return () => { cancelled = true; element?.replaceChildren() }
  }, [config.data, locale, attempt, unavailableMessage])

  if (config.isLoading && registration) return <LoadingSpinner size="sm" />
  if (!config.data?.enabled || !config.data.client_id) return registration ? <p role="status" className="text-sm text-gray-600 dark:text-gray-300">{t('pilot.signupClosed')}</p> : null
  const submitLink = (event: FormEvent) => {
    event.preventDefault()
    if (!link || (link.linking && (!consent || !password)) || (needsCode && code.length !== 6) || busy) return
    void authenticate.current(link.credential, link.nonce, link.linking)
  }
  return <section aria-label={t('google.title')} className="space-y-4">
    <div ref={target} className={busy ? 'pointer-events-none flex min-h-11 justify-center opacity-60' : 'flex min-h-11 justify-center'} />
    {busy && <LoadingSpinner size="sm" />}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
    {link ? <form onSubmit={submitLink} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-300">{t(link.linking ? 'google.linkRequired' : 'login.twoFactorPrompt')}</p>
      {link.linking && <label className="block text-sm font-medium">{t('google.password')}<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required className="mt-2 block w-full rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800" /></label>}
      {needsCode && <label className="block text-sm font-medium">{t('login.twoFactorCode')}<input value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" required className="mt-2 block w-full rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800" /></label>}
      {link.linking && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required className="mt-1" />{t('google.linkConsent')}</label>}
      <button type="submit" disabled={busy || (link.linking && (!consent || !password)) || (needsCode && code.length !== 6)} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{t(link.linking ? 'google.link' : 'login.signIn')}</button>
      <button type="button" onClick={() => { setLink(null); setPassword(''); setCode(''); setNeedsCode(false); setConsent(false); setError(''); setAttempt(value => value + 1) }} className="text-sm underline">{t('common.cancel')}</button>
    </form> : error && <button type="button" onClick={() => { setError(''); setAttempt(value => value + 1) }} className="text-sm underline">{t('common.retry')}</button>}
  </section>
}
