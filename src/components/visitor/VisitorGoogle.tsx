import { useEffect, useRef, useState } from 'react'
import visitorApi from '../../api/visitorClient'
import { useVisitorGoogleConfig } from './googleConfig'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import type { Schema } from '../../api/types'
import { useTranslation } from '../../hooks/useTranslation'
import { loadGoogleIdentity } from '../../utils/googleIdentity'
import LoadingSpinner from '../LoadingSpinner'
import { Notice } from './VisitorUi'

type Props =
  | { mode: 'login'; onSignedIn: (session: Schema<'VisitorLoginOut'>) => void }
  | { mode: 'link'; onLinked: () => void; onReauth: () => void }

// Google for the visitor cabinet. Hidden whenever Google isn't available (config off, 503,
// a failed config request): password sign-in and the rest of the page keep working.
export default function VisitorGoogle(props: Props) {
  const { t, locale } = useTranslation()
  const { clientId: configClientId } = useVisitorGoogleConfig()
  const target = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')
  const [busy, setBusy] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const latest = useRef(props)
  latest.current = props

  const enabled = !!configClientId && !unavailable
  const linking = props.mode === 'link'

  useEffect(() => {
    if (!enabled || !configClientId) return
    let cancelled = false
    const element = target.current
    const clientId = configClientId
    const finish = async (credential: string, nonce: string) => {
      setBusy(true); setError(''); setHint('')
      try {
        const current = latest.current
        if (current.mode === 'login') {
          const { data } = await visitorApi.post<Schema<'VisitorLoginOut'>>('/visitor/auth/google/login', { credential, nonce })
          if (!cancelled) current.onSignedIn(data)
        } else {
          await visitorApi.post('/visitor/auth/google/link', { credential, nonce })
          if (!cancelled) current.onLinked()
        }
      } catch (failure) {
        if (cancelled) return
        const status = apiErrorStatus(failure)
        const current = latest.current
        if (status === 503) setUnavailable(true)
        else if (status === 403 && current.mode === 'link') current.onReauth()
        else if (status === 409) {
          setError(apiErrorMessage(failure, t('visitor.google.failed')))
          if (current.mode === 'login') setHint(t('visitor.google.linkHint'))
        } else setError(t('visitor.google.failed'))
        setAttempt(value => value + 1)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    const setup = async () => {
      try {
        const [identity, response] = await Promise.all([
          loadGoogleIdentity(),
          visitorApi.post<Schema<'GoogleNonceOut'>>(linking ? '/visitor/auth/google/link/nonce' : '/visitor/auth/google/nonce', {}),
        ])
        if (cancelled || !element) return
        identity.initialize({ client_id: clientId, nonce: response.data.nonce, auto_select: false,
          callback: answer => { if (!cancelled) void finish(answer.credential, response.data.nonce) } })
        element.replaceChildren()
        identity.renderButton(element, { theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with',
          locale: locale === 'cz' ? 'cs' : locale, width: Math.min(element.clientWidth || 300, 350) })
      } catch (failure) {
        if (cancelled) return
        const status = apiErrorStatus(failure)
        if (status === 403 && latest.current.mode === 'link') latest.current.onReauth()
        else setUnavailable(true)
      }
    }
    void setup()
    return () => { cancelled = true; element?.replaceChildren() }
  }, [enabled, configClientId, locale, attempt, linking, t])

  if (!enabled) return null
  return <section aria-label={t(linking ? 'visitor.google.link' : 'visitor.google.title')} className="space-y-3">
    <div ref={target} className={`flex min-h-11 justify-center ${busy ? 'pointer-events-none opacity-60' : ''}`} />
    {busy && <LoadingSpinner size="sm" />}
    {error && <Notice tone="error">{error}{hint && <span className="mt-1 block">{hint}</span>}</Notice>}
  </section>
}
