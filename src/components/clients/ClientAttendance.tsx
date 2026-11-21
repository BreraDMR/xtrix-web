import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../ui/Button'
import StatusBadge from '../../ui/StatusBadge'
import type { ClientAttendanceOut } from '../../api/types'

// no-show counters on the client card, plus the switch for this client's online booking
export default function ClientAttendance({ clientId, attendance, canEdit }: {
  clientId: number
  attendance: ClientAttendanceOut
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blocked = attendance.online_booking_blocked

  const toggle = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.put(`/clients/${clientId}/profile`, { online_booking_blocked: !blocked })
      for (const key of [['client-overview', clientId], ['client', clientId], ['client-profile', clientId], ['clients']]) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    } catch (err) {
      setError(apiErrorMessage(err, t('clientWorkspace.blockError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-label={t('clientWorkspace.attendance')} className="space-y-3">
      <h2 className="text-base font-semibold text-[var(--workspace-ink)]">{t('clientWorkspace.attendance')}</h2>
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[var(--workspace-bg)] p-3">
          <dt className="text-xs text-[var(--workspace-muted)]">{t('clientWorkspace.noShows')}</dt>
          <dd className="text-lg font-semibold tabular-nums text-[var(--workspace-ink)]">{attendance.no_show_count}</dd>
        </div>
        <div className="rounded-lg bg-[var(--workspace-bg)] p-3">
          <dt className="text-xs text-[var(--workspace-muted)]">{t('clientWorkspace.lateCancels')}</dt>
          <dd className="text-lg font-semibold tabular-nums text-[var(--workspace-ink)]">{attendance.late_cancel_count}</dd>
        </div>
      </dl>
      {attendance.rule_reached && (
        <StatusBadge tone="warning">{t('clientWorkspace.ruleReached')}</StatusBadge>
      )}
      <p className="text-sm text-[var(--workspace-ink)]">
        {blocked ? t('clientWorkspace.onlineBlocked') : t('clientWorkspace.onlineAllowed')}
      </p>
      {canEdit && (
        <Button variant="secondary" onClick={toggle} disabled={saving}>
          {blocked ? t('clientWorkspace.unblockOnline') : t('clientWorkspace.blockOnline')}
        </Button>
      )}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </section>
  )
}
