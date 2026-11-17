import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LuKeyRound, LuLogOut, LuMail, LuShieldCheck } from 'react-icons/lu'
import visitorApi, { visitorKey } from '../../api/visitorClient'
import { apiErrorMessage, apiErrorStatus, apiFormErrors } from '../../api/errors'
import type { Schema } from '../../api/types'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Modal from '../../ui/Modal'
import FormError from '../../components/FormError'
import LoadingSpinner from '../../components/LoadingSpinner'
import VisitorGoogle from '../../components/visitor/VisitorGoogle'
import { Notice, VisitorShell } from '../../components/visitor/VisitorUi'
import { formatVisitTime } from '../../components/visitor/format'
import { takeResume } from '../../components/visitor/links'
import { useReauth } from '../../components/visitor/useReauth'
import { useTranslation } from '../../hooks/useTranslation'
import { useVisitorSession } from '../../store/visitorSession'

type Account = Schema<'VisitorAccountOut'>
type Message = { tone: 'success' | 'error' | 'warning'; text: string } | null

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <section className="ui-card p-5 sm:p-7">
    <h2 className="flex items-center gap-3 text-[17px] font-semibold tracking-[-0.02em]"><span className="x-icon" aria-hidden="true">{icon}</span>{title}</h2>
    <div className="mt-4">{children}</div>
  </section>
}

export default function VisitorProfile() {
  const { t, locale } = useTranslation()
  const me = useQuery({
    queryKey: visitorKey('me'),
    retry: false,
    queryFn: async ({ signal }) => (await visitorApi.get<Account>('/visitor/me', { signal })).data,
  })
  const account = me.data

  return <VisitorShell title={t('visitor.profile.title')} subtitle={account?.email}>
    {me.isPending ? <div className="py-12"><LoadingSpinner /></div>
      : me.isError ? <Notice tone="error">
        <p>{apiErrorMessage(me.error, t('common.loadError'))}</p>
        <Button variant="secondary" className="mt-3" onClick={() => void me.refetch()}>{t('common.retry')}</Button>
      </Notice>
        : account && <div className="space-y-5">
          <Section icon={<LuShieldCheck />} title={t('visitor.profile.account')}>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-[var(--workspace-muted)]">{t('field.email')}</dt><dd className="mt-0.5 font-medium [overflow-wrap:anywhere]">{account.email}</dd></div>
              <div><dt className="text-xs text-[var(--workspace-muted)]">{t('visitor.profile.since')}</dt><dd className="mt-0.5 font-medium">{formatVisitTime(account.created_at, null, locale, { dateStyle: 'long' })}</dd></div>
              <div><dt className="text-xs text-[var(--workspace-muted)]">{t('visitor.profile.password')}</dt><dd className="mt-0.5 font-medium">{t(account.has_password ? 'visitor.profile.passwordSet' : 'visitor.profile.passwordNone')}</dd></div>
              <div><dt className="text-xs text-[var(--workspace-muted)]">Google</dt><dd className="mt-0.5 font-medium">{t(account.google_connected ? 'visitor.profile.googleOn' : 'visitor.profile.googleOff')}</dd></div>
            </dl>
          </Section>
          <EmailChange account={account} />
          <SignInMethods account={account} />
        </div>}
    <Sessions />
  </VisitorShell>
}

function EmailChange({ account }: { account: Account }) {
  const { t } = useTranslation()
  const reauth = useReauth()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [message, setMessage] = useState<Message>(null)
  const [busy, setBusy] = useState(false)
  const resumed = useRef(false)

  const request = async (address: string) => {
    setBusy(true); setMessage(null); setFieldError('')
    try {
      await visitorApi.post('/visitor/auth/email/change/request', { email: address })
      setEmail('')
      setMessage({ tone: 'success', text: t('visitor.email.sent').replace('{email}', address) })
    } catch (failure) {
      const status = apiErrorStatus(failure)
      if (status === 403) { reauth({ action: 'email-request', email: address }, '/visitor/profile'); return }
      const parsed = apiFormErrors(failure, ['email'], t('visitor.request.failed'))
      if (status === 422 && !parsed.fields.email) setFieldError(parsed.general)
      else { setFieldError(parsed.fields.email ?? ''); if (!parsed.fields.email) setMessage({ tone: 'error', text: parsed.general }) }
    } finally {
      setBusy(false)
    }
  }

  // back from signing in again: repeat the request the 5-minute rule stopped
  useEffect(() => {
    if (resumed.current) return
    resumed.current = true
    const resume = takeResume('email-request')
    if (resume) { setEmail(resume.email); void request(resume.email) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on arrival, request is a plain function
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const address = email.trim()
    if (!address || busy) return
    if (address.toLowerCase() === account.email.toLowerCase()) { setFieldError(t('visitor.email.same')); return }
    void request(address)
  }

  return <Section icon={<LuMail />} title={t('visitor.email.title')}>
    <p className="text-sm text-[var(--workspace-muted)]">{t('visitor.email.text')}</p>
    {message && <Notice tone={message.tone} className="mt-4">{message.text}</Notice>}
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-start gap-3" noValidate>
      <div className="min-w-0 flex-1 basis-60">
        <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--workspace-muted)]">{t('visitor.email.new')}</span>
          <Input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!fieldError} /></label>
        {fieldError && <FormError message={fieldError} />}
      </div>
      <Button type="submit" className="sm:mt-[22px]" disabled={busy || !email.trim()}>{t(busy ? 'common.loading' : 'visitor.email.submit')}</Button>
    </form>
  </Section>
}

function SignInMethods({ account }: { account: Account }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const reauth = useReauth()
  const [message, setMessage] = useState<Message>(null)
  const [busy, setBusy] = useState(false)
  const [resumed] = useState(() => !!takeResume('google-link'))

  const sendReset = async () => {
    setBusy(true); setMessage(null)
    try {
      await visitorApi.post('/visitor/auth/password/reset/request', { email: account.email })
      setMessage({ tone: 'success', text: t('visitor.request.sentText').replace('{email}', account.email) })
    } catch (failure) {
      setMessage({ tone: 'error', text: apiErrorMessage(failure, t('visitor.request.failed')) })
    } finally {
      setBusy(false)
    }
  }

  return <Section icon={<LuKeyRound />} title={t('visitor.methods.title')}>
    {message && <Notice tone={message.tone} className="mb-4">{message.text}</Notice>}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--workspace-bg)] p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{t('visitor.profile.password')}</p>
        <p className="mt-0.5 text-[13px] text-[var(--workspace-muted)]">{t(account.has_password ? 'visitor.methods.passwordText' : 'visitor.methods.noPasswordText')}</p>
      </div>
      <Button variant="secondary" disabled={busy} onClick={() => void sendReset()}>{t(busy ? 'common.loading' : account.has_password ? 'visitor.methods.changePassword' : 'visitor.methods.setPassword')}</Button>
    </div>
    {!account.google_connected && <div className="mt-3 rounded-2xl bg-[var(--workspace-bg)] p-4">
      <p className="text-sm font-semibold">Google</p>
      <p className="mt-0.5 text-[13px] text-[var(--workspace-muted)]">{t(resumed ? 'visitor.methods.googleAgain' : 'visitor.methods.googleText')}</p>
      <div className="mt-3">
        <VisitorGoogle mode="link"
          onLinked={() => { setMessage({ tone: 'success', text: t('visitor.methods.googleLinked') }); void client.invalidateQueries({ queryKey: visitorKey('me') }) }}
          onReauth={() => reauth({ action: 'google-link' }, '/visitor/profile')} />
      </div>
    </div>}
  </Section>
}

function Sessions() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const end = useVisitorSession(state => state.end)
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // The local session ends right away; the server call only revokes the token there.
  const signOut = () => {
    visitorApi.post('/visitor/auth/logout').catch(() => {})
    end()
    navigate('/visitor/login', { replace: true })
  }

  const signOutEverywhere = async () => {
    setBusy(true); setError('')
    try {
      await visitorApi.post('/visitor/auth/logout-all')
      end()
      navigate('/visitor/login', { replace: true })
    } catch (failure) {
      if (apiErrorStatus(failure) === 401) { navigate('/visitor/login', { replace: true }); return }
      setError(apiErrorMessage(failure, t('visitor.request.failed')))
      setBusy(false)
    }
  }

  return <section className="ui-card mt-5 p-5 sm:p-7">
    <h2 className="flex items-center gap-3 text-[17px] font-semibold tracking-[-0.02em]"><span className="x-icon" aria-hidden="true"><LuLogOut /></span>{t('visitor.sessions.title')}</h2>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button variant="secondary" onClick={signOut}>{t('visitor.sessions.signOut')}</Button>
      <Button variant="danger" onClick={() => { setError(''); setAsking(true) }}>{t('visitor.sessions.everywhere')}</Button>
    </div>
    {asking && <Modal title={t('visitor.sessions.everywhereTitle')} busy={busy} onClose={() => setAsking(false)}>
      <div className="space-y-5 p-6">
        <p className="text-sm leading-relaxed text-[var(--workspace-muted)]">{t('visitor.sessions.everywhereText')}</p>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => setAsking(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" disabled={busy} onClick={() => void signOutEverywhere()}>{t(busy ? 'common.loading' : 'visitor.sessions.everywhere')}</Button>
        </div>
      </div>
    </Modal>}
  </section>
}
