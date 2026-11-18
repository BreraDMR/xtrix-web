import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import visitorApi from '../../api/visitorClient'
import { apiErrorMessage, apiErrorStatus, apiFormErrors } from '../../api/errors'
import type { Schema } from '../../api/types'
import AuthShell from '../../components/auth/AuthShell'
import FormError from '../../components/FormError'
import Input from '../../ui/Input'
import VisitorGoogle from '../../components/visitor/VisitorGoogle'
import { Notice } from '../../components/visitor/VisitorUi'
import { afterSignIn, forgetFragmentToken, fragmentTokenReader, safeNext } from '../../components/visitor/links'
import { useLinkToken } from '../../hooks/useLinkToken'
import { useTranslation } from '../../hooks/useTranslation'
import { useVisitorSession } from '../../store/visitorSession'

const linkClass = 'font-medium text-[var(--workspace-accent)] hover:underline'
const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--workspace-muted)]'

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <div>
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
    {error && <FormError message={error} />}
  </div>
}

// A new session replaces the old one; the old token is revoked quietly in the background.
function useStartSession() {
  const start = useVisitorSession(state => state.start)
  return (data: Schema<'VisitorLoginOut'>) => {
    const previous = useVisitorSession.getState().session?.token
    start(data.session_token, data.expires_at)
    if (previous && previous !== data.session_token) {
      visitorApi.post('/visitor/auth/logout', null, { headers: { 'X-Visitor-Token': previous } }).catch(() => {})
    }
  }
}

export function VisitorLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const reauth = params.get('reauth') === '1'
  const session = useVisitorSession(state => state.session)
  const startSession = useStartSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // a fresh sign-in may replace the session this page started with
  const [signedIn, setSignedIn] = useState(false)

  if (session && !reauth && !signedIn) return <Navigate to={afterSignIn(next)} replace />

  const signedInWith = (data: Schema<'VisitorLoginOut'>) => {
    setSignedIn(true)
    startSession(data)
    // re-authenticating returns to the action it was for, before any waiting booking link
    navigate(reauth ? safeNext(next) ?? '/visitor/profile' : afterSignIn(next), { replace: true })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const { data } = await visitorApi.post<Schema<'VisitorLoginOut'>>('/visitor/auth/login', { email: email.trim(), password })
      setPassword('')
      signedInWith(data)
    } catch (failure) {
      setError(apiErrorMessage(failure, t('visitor.login.failed')))
    } finally {
      setBusy(false)
    }
  }

  return <AuthShell title={t(reauth ? 'visitor.login.reauthTitle' : 'visitor.login.title')} description={t(reauth ? 'visitor.login.reauthText' : 'visitor.login.subtitle')}>
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label={t('field.email')}><Input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></Field>
      <Field label={t('field.password')}><Input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} /></Field>
      <button type="submit" disabled={busy || !email || !password} className="ui-button ui-button-primary w-full">{t(busy ? 'common.loading' : 'visitor.login.submit')}</button>
    </form>
    <VisitorGoogle mode="login" onSignedIn={signedInWith} />
    <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--workspace-line)] pt-5 text-sm">
      <Link to="/visitor/signup" className={linkClass}>{t('visitor.login.createAccount')}</Link>
      <Link to="/visitor/forgot-password" className={linkClass}>{t('visitor.login.forgot')}</Link>
    </div>
    <p className="text-xs leading-relaxed text-[var(--workspace-muted)]">{t('visitor.login.notCrm')} <Link to="/login" className={linkClass}>{t('visitor.login.crmLink')}</Link></p>
  </AuthShell>
}

// register/request and password/reset/request answer the same whether the address has an
// account or not, so the page only ever says "check your inbox".
function EmailRequest({ endpoint, title, subtitle, submitLabel, children }: { endpoint: string; title: string; subtitle: string; submitLabel: string; children?: ReactNode }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setFieldError('')
    const address = email.trim()
    try {
      await visitorApi.post(endpoint, { email: address })
      setSentTo(address)
    } catch (failure) {
      const parsed = apiFormErrors(failure, ['email'], t('visitor.request.failed'))
      setFieldError(parsed.fields.email ?? '')
      setError(parsed.general)
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) return <AuthShell title={t('visitor.request.sentTitle')}>
    <Notice tone="success">{t('visitor.request.sentText').replace('{email}', sentTo)}</Notice>
    <p className="text-sm text-[var(--workspace-muted)]">{t('visitor.request.sentHint')}</p>
    <div className="flex flex-wrap justify-between gap-3 text-sm">
      <button type="button" onClick={() => setSentTo('')} className={linkClass}>{t('visitor.request.again')}</button>
      <Link to="/visitor/login" className={linkClass}>{t('visitor.backToLogin')}</Link>
    </div>
  </AuthShell>

  return <AuthShell title={title} description={subtitle}>
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label={t('field.email')} error={fieldError}><Input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></Field>
      <button type="submit" disabled={busy || !email.trim()} className="ui-button ui-button-primary w-full">{busy ? t('common.loading') : submitLabel}</button>
    </form>
    {children}
    <p className="text-center text-sm"><Link to="/visitor/login" className={linkClass}>{t('visitor.backToLogin')}</Link></p>
  </AuthShell>
}

export function VisitorSignup() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startSession = useStartSession()
  return <EmailRequest endpoint="/visitor/auth/register/request" title={t('visitor.signup.title')} subtitle={t('visitor.signup.subtitle')} submitLabel={t('visitor.signup.submit')}>
    <VisitorGoogle mode="login" onSignedIn={data => {
      startSession(data)
      navigate(afterSignIn(null), { replace: true })
    }} />
    <p className="text-xs leading-relaxed text-[var(--workspace-muted)]">{t('visitor.login.notCrm')} <Link to="/login" className={linkClass}>{t('visitor.login.crmLink')}</Link></p>
  </EmailRequest>
}

export function VisitorForgotPassword() {
  const { t } = useTranslation()
  return <EmailRequest endpoint="/visitor/auth/password/reset/request" title={t('visitor.forgot.title')} subtitle={t('visitor.forgot.subtitle')} submitLabel={t('visitor.forgot.submit')} />
}

const readRegisterToken = fragmentTokenReader('token', 'visitor_register_token')
const readResetToken = fragmentTokenReader('token', 'visitor_reset_token')

// Shared by "finish sign-up" and "new password": both post the link token with a password.
function PasswordLink({ kind }: { kind: 'register' | 'reset' }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const startSession = useStartSession()
  const storageKey = kind === 'register' ? 'visitor_register_token' : 'visitor_reset_token'
  const token = useLinkToken(kind === 'register' ? readRegisterToken : readResetToken)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState('')
  const [invalid, setInvalid] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const requestPath = kind === 'register' ? '/visitor/signup' : '/visitor/forgot-password'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || !token) return
    setError(''); setFieldError('')
    if (password !== confirmation) { setFieldError(t('register.passwordMismatch')); return }
    setBusy(true)
    try {
      if (kind === 'register') {
        const { data } = await visitorApi.post<Schema<'VisitorLoginOut'>>('/visitor/auth/register/complete', { token, new_password: password })
        forgetFragmentToken(storageKey)
        startSession(data)
        navigate(afterSignIn(null), { replace: true })
      } else {
        await visitorApi.post('/visitor/auth/password/reset/confirm', { token, new_password: password })
        forgetFragmentToken(storageKey)
        setDone(true)
      }
      setPassword(''); setConfirmation('')
    } catch (failure) {
      const status = apiErrorStatus(failure)
      if (status === 400) { forgetFragmentToken(storageKey); setInvalid(true) }
      else if (status === 409) setConflict(apiErrorMessage(failure, t('visitor.register.conflict')))
      else {
        const parsed = apiFormErrors(failure, ['new_password'], t('visitor.request.failed'))
        if (status === 422 && !parsed.fields.new_password && parsed.general) setFieldError(parsed.general)
        else { setFieldError(parsed.fields.new_password ?? ''); setError(parsed.general) }
      }
    } finally {
      setBusy(false)
    }
  }

  if (!token || invalid) return <AuthShell title={t('visitor.link.invalidTitle')}>
    <Notice tone="warning">{t('visitor.link.invalidText')}</Notice>
    <Link to={requestPath} className="ui-button ui-button-primary w-full">{t('visitor.link.requestNew')}</Link>
    <p className="text-center text-sm"><Link to="/visitor/login" className={linkClass}>{t('visitor.backToLogin')}</Link></p>
  </AuthShell>

  if (conflict) return <AuthShell title={t('visitor.register.conflictTitle')}>
    <Notice tone="warning">{conflict}</Notice>
    <Link to="/visitor/login" className="ui-button ui-button-primary w-full">{t('visitor.login.submit')}</Link>
  </AuthShell>

  if (done) return <AuthShell title={t('visitor.reset.doneTitle')}>
    <Notice tone="success">{t('visitor.reset.doneText')}</Notice>
    <Link to="/visitor/login" className="ui-button ui-button-primary w-full">{t('visitor.login.submit')}</Link>
  </AuthShell>

  return <AuthShell title={t(kind === 'register' ? 'visitor.register.title' : 'visitor.reset.title')} description={t(kind === 'register' ? 'visitor.register.subtitle' : 'visitor.reset.subtitle')}>
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label={t('visitor.password.new')} error={fieldError}>
        <Input type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} aria-invalid={!!fieldError} />
      </Field>
      <Field label={t('visitor.password.repeat')}>
        <Input type="password" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
      </Field>
      <button type="submit" disabled={busy || !password || !confirmation} className="ui-button ui-button-primary w-full">
        {t(busy ? 'common.loading' : kind === 'register' ? 'visitor.register.submit' : 'visitor.reset.submit')}
      </button>
    </form>
  </AuthShell>
}

export function VisitorRegister() {
  return <PasswordLink kind="register" />
}

export function VisitorResetPassword() {
  return <PasswordLink kind="reset" />
}
