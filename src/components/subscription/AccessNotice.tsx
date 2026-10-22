import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import type { WorkspaceAccess } from '../../hooks/useWorkspaceAccess'

export default function AccessNotice({ access }: { access: WorkspaceAccess }) {
  const { t, locale } = useTranslation()
  const end = access.crm_mode === 'read_only' ? access.read_only_until : access.trial_end
  const date = end ? new Date(end).toLocaleString(locale === 'cz' ? 'cs-CZ' : locale) : ''
  const message = access.crm_mode === 'blocked' ? t('pilot.blocked')
    : access.crm_mode === 'read_only' ? t('pilot.readOnly').replace('{date}', date)
      : access.trial_end ? t('pilot.active').replace('{date}', date) : null
  if (!message) return null
  return <div role="status" className="crm-access" data-mode={access.crm_mode}>
    <p>{message}</p>
    <Link to="/app/subscription" className="shrink-0 font-medium underline underline-offset-4">{t('subscription.title')}</Link>
  </div>
}
