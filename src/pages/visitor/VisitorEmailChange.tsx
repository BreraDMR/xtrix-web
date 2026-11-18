import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import visitorApi from '../../api/visitorClient'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import AuthShell from '../../components/auth/AuthShell'
import { Notice } from '../../components/visitor/VisitorUi'
import { forgetFragmentToken, fragmentTokenReader, loginPath, takeResume } from '../../components/visitor/links'
import { useReauth } from '../../components/visitor/useReauth'
import { useLinkToken } from '../../hooks/useLinkToken'
import { useTranslation } from '../../hooks/useTranslation'
import { useVisitorSession } from '../../store/visitorSession'

const STORAGE_KEY = 'visitor_email_change_token'
const readToken = fragmentTokenReader('token', STORAGE_KEY)

// /visitor/email-change#token=... from the new mailbox. Confirming needs the visitor's own
// session, signed in within the last 5 minutes; the token waits in the tab meanwhile.
export default function VisitorEmailChange() {
  const { t } = useTranslation()
  const reauth = useReauth()
  const token = useLinkToken(readToken)
  const session = useVisitorSession(state => state.session)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'invalid'>('idle')
  const [error, setError] = useState('')
  const resumed = useRef(false)

  const confirm = async () => {
    if (!token) return
    const authenticatedToken = useVisitorSession.getState().session?.token
    setState('busy'); setError('')
    try {
      await visitorApi.post('/visitor/auth/email/change/confirm', { token })
      forgetFragmentToken(STORAGE_KEY)
      // Confirmation revokes every visitor session, including the one used here.
      if (useVisitorSession.getState().session?.token === authenticatedToken) useVisitorSession.getState().end()
      setState('done')
    } catch (failure) {
      const status = apiErrorStatus(failure)
      if (status === 403) { reauth({ action: 'email-confirm' }, '/visitor/email-change'); return }
      if (status === 400) { forgetFragmentToken(STORAGE_KEY); setState('invalid'); return }
      setError(apiErrorMessage(failure, t('visitor.request.failed')))
      setState('idle')
    }
  }

  // back from signing in again: confirm right away
  useEffect(() => {
    if (resumed.current || !session || !token) return
    resumed.current = true
    if (takeResume('email-confirm')) void confirm()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once the session and token are there
  }, [session, token])

  if (!token || state === 'invalid') return <AuthShell title={t('visitor.link.invalidTitle')}>
    <Notice tone="warning">{t('visitor.email.invalid')}</Notice>
    <Link to="/visitor/profile" className="ui-button ui-button-primary w-full">{t('visitor.nav.profile')}</Link>
  </AuthShell>

  if (state === 'done') return <AuthShell title={t('visitor.email.doneTitle')}>
    <Notice tone="success">{t('visitor.email.doneText')}</Notice>
    <Link to="/visitor/login" className="ui-button ui-button-primary w-full">{t('visitor.backToLogin')}</Link>
  </AuthShell>

  // The store can publish revocation before React applies the successful response.
  if (!session && state !== 'busy') return <Navigate to={loginPath('/visitor/email-change')} replace />

  return <AuthShell title={t('visitor.email.confirmTitle')} description={t('visitor.email.confirmText')}>
    {error && <Notice tone="error">{error}</Notice>}
    <button type="button" className="ui-button ui-button-primary w-full" disabled={state === 'busy'} onClick={() => void confirm()}>
      {t(state === 'busy' ? 'common.loading' : 'visitor.email.confirm')}
    </button>
  </AuthShell>
}
