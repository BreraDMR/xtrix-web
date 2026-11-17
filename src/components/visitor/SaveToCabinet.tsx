import { LuBookmarkPlus } from 'react-icons/lu'
import { useTranslation } from '../../hooks/useTranslation'
import { useVisitorSession } from '../../store/visitorSession'

// Offered after a guest booking and on /manage. Booking stays possible without an account;
// this only hands the manage token to /visitor/claim (in the fragment, never in a query).
export default function SaveToCabinet({ manageToken }: { manageToken: string }) {
  const { t } = useTranslation()
  const signedIn = useVisitorSession(state => !!state.session)
  return <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-[var(--workspace-accent-soft)] p-4">
    <span className="x-icon" aria-hidden="true"><LuBookmarkPlus /></span>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[var(--workspace-ink)]">{t('visitor.save.title')}</p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--workspace-muted)]">{t(signedIn ? 'visitor.save.textSignedIn' : 'visitor.save.text')}</p>
    </div>
    <a href={`/visitor/claim#token=${encodeURIComponent(manageToken)}`} className="ui-button ui-button-primary">{t('visitor.save.action')}</a>
  </div>
}
