import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import visitorApi, { visitorKey } from '../../api/visitorClient'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import AuthShell from '../../components/auth/AuthShell'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Notice } from '../../components/visitor/VisitorUi'
import { clearPendingClaim, loginPath, pendingClaim, savePendingClaim, type PendingClaim } from '../../components/visitor/links'
import { useLinkToken } from '../../hooks/useLinkToken'
import { useTranslation } from '../../hooks/useTranslation'
import { useVisitorSession } from '../../store/visitorSession'

const CLAIM_KEY = 'visitor_claim_link'

// #token=<manage token> from a booking, or #invite=<token> from a salon's invitation.
// Read once, kept for the tab and as the pending claim so signing in or up can come back.
function readClaim(): string | null {
  const hadFragment = window.location.hash.length > 1
  try {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const manage = params.get('token')?.trim()
    const invite = params.get('invite')?.trim()
    const claim: PendingClaim | null = manage ? { kind: 'manage', token: manage } : invite ? { kind: 'invite', token: invite } : null
    if (claim) {
      const value = JSON.stringify(claim)
      try { sessionStorage.setItem(CLAIM_KEY, value) } catch { /* memory only */ }
      savePendingClaim(claim)
      try { window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`) } catch { /* ignore */ }
      return value
    }
  } catch { /* fall through */ }
  if (hadFragment) return null
  try {
    const stored = sessionStorage.getItem(CLAIM_KEY)
    if (stored) return stored
  } catch { /* ignore */ }
  const pending = pendingClaim()
  return pending ? JSON.stringify(pending) : null
}

function parse(value: string | null): PendingClaim | null {
  try { return value ? JSON.parse(value) as PendingClaim : null } catch { return null }
}

function forget() {
  clearPendingClaim()
  try { sessionStorage.removeItem(CLAIM_KEY) } catch { /* ignore */ }
}

type Outcome = { tone: 'error' | 'warning'; text: string } | null

export default function VisitorClaim() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const client = useQueryClient()
  const raw = useLinkToken(readClaim)
  const claim = useMemo(() => parse(raw), [raw])
  const [round, setRound] = useState(0)
  const session = useVisitorSession(state => state.session)
  const [outcome, setOutcome] = useState<Outcome>(null)
  const sent = useRef<string | null>(null)

  useEffect(() => {
    if (!claim || !session) return
    // one attempt per link and session (StrictMode runs effects twice)
    const attempt = `${claim.kind}:${claim.token}:${session.token}:${round}`
    if (sent.current === attempt) return
    sent.current = attempt
    const endpoint = claim.kind === 'manage' ? '/visitor/claims/manage' : '/visitor/claims/client-invite'
    const post = async (retried = false): Promise<void> => {
      try {
        // only the token: no salon or client ids from the URL or a form
        await visitorApi.post(endpoint, { token: claim.token })
        forget()
        void client.invalidateQueries({ queryKey: visitorKey('visits') })
        navigate('/visitor/visits', { replace: true, state: { notice: t(claim.kind === 'manage' ? 'visitor.claim.savedBooking' : 'visitor.claim.savedInvite') } })
      } catch (failure) {
        const status = apiErrorStatus(failure)
        if (status === 401) return // the session ended; the page now asks to sign in, the link waits
        if (status === 409 && claim.kind === 'invite' && !retried) return post(true)
        const text = apiErrorMessage(failure, t('visitor.claim.failed'))
        if (status === 400) { forget(); setOutcome({ tone: 'warning', text: t('visitor.claim.invalid') }) }
        else if (status === 409) { forget(); navigate('/visitor/visits', { replace: true, state: { notice: text, tone: 'info' } }) }
        else if (status === 403) { forget(); setOutcome({ tone: 'warning', text }) }
        else setOutcome({ tone: 'error', text })
      }
    }
    void post()
  }, [claim, session, round, client, navigate, t])

  if (!claim) return <AuthShell title={t('visitor.claim.noLinkTitle')} description={t('visitor.claim.noLinkText')}>
    <Link to="/visitor/visits" className="ui-button ui-button-primary w-full">{t('visitor.claim.toFeed')}</Link>
  </AuthShell>

  const title = t(claim.kind === 'manage' ? 'visitor.claim.bookingTitle' : 'visitor.claim.inviteTitle')

  if (!session) return <AuthShell title={title} description={t(claim.kind === 'manage' ? 'visitor.claim.bookingText' : 'visitor.claim.inviteText')}>
    <Notice>{t('visitor.claim.signInFirst')}</Notice>
    <div className="grid gap-2 sm:grid-cols-2">
      <Link to={loginPath('/visitor/claim')} className="ui-button ui-button-primary">{t('visitor.login.submit')}</Link>
      <Link to="/visitor/signup" className="ui-button ui-button-secondary">{t('visitor.login.createAccount')}</Link>
    </div>
    <p className="text-xs leading-relaxed text-[var(--workspace-muted)]">{t('visitor.claim.waits')}</p>
  </AuthShell>

  if (outcome) return <AuthShell title={title}>
    <Notice tone={outcome.tone}>{outcome.text}</Notice>
    {outcome.tone === 'warning'
      ? <Link to="/visitor/visits" className="ui-button ui-button-primary w-full">{t('visitor.claim.toFeed')}</Link>
      : <button type="button" className="ui-button ui-button-primary w-full" onClick={() => { setOutcome(null); setRound(value => value + 1) }}>{t('common.retry')}</button>}
  </AuthShell>

  return <AuthShell title={title}>
    <div className="flex items-center gap-3 text-sm text-[var(--workspace-muted)]"><LoadingSpinner size="sm" />{t('visitor.claim.saving')}</div>
  </AuthShell>
}
