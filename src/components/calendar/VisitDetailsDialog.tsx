import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { cs, enUS, ru } from 'date-fns/locale'
import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import FormError from '../FormError'
import Button from '../../ui/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { useLabels } from '../../i18n/labels'
import { useLocaleStore } from '../../store/localeStore'
import { useBusinessCurrency } from '../../hooks/useBusinessCurrency'
import { formatCurrency } from '../../utils/currency'
import { isoToZonedWallTime, zonedWallTimeToIso } from '../../utils/dates'
import { dayTimeline, timelineLabel } from './timeline'
import type { CalendarVisit } from './DayGrid'

interface VisitDetailsDialogProps {
  visit: CalendarVisit
  name: string
  staffName?: string
  timeZone: string
  // false in a read-only workspace: details only, no move and no edit
  canManage: boolean
  onClose: () => void
  onMoved: () => void
  onEdit: (visitId: number) => void
}

const durationMs = (visit: CalendarVisit): number | null => {
  if (!visit.date_end) return null
  const start = new Date(visit.date_start).getTime()
  const end = new Date(visit.date_end).getTime()
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : null
}

export default function VisitDetailsDialog({
  visit,
  name,
  staffName,
  timeZone,
  canManage,
  onClose,
  onMoved,
  onEdit,
}: VisitDetailsDialogProps) {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const { visitStatus } = useLabels()
  const currency = useBusinessCurrency()
  const current = isoToZonedWallTime(visit.date_start, timeZone)
  const [day, setDay] = useState(current.day)
  const [time, setTime] = useState(current.time)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const span = durationMs(visit)
  const changed = day !== current.day || time !== current.time

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  // on a DST day a bare 02:30 is ambiguous, so the label carries the offset like the grid does
  const offsets = dayTimeline(current.day, timeZone).minutes !== 1440
  const label = (iso: string) => timelineLabel(iso, timeZone, offsets)
  const endIso = span !== null ? new Date(new Date(visit.date_start).getTime() + span).toISOString() : null
  const dateLocale = locale === 'ru' ? ru : locale === 'cz' ? cs : enUS
  const dayLabel = format(parseISO(current.day), locale === 'cz' ? 'EEEE d. MMMM' : 'EEEE, d MMMM', { locale: dateLocale })
  const services = [...(visit.items ?? [])].sort((a, b) => a.position - b.position)
  const price = visit.price === null || visit.price === undefined ? '—' : formatCurrency(visit.price, currency)

  // a no-show only makes sense once the visit should have begun; the API checks it too
  const started = new Date(visit.date_start).getTime() <= Date.now()
  const status = visit.status ?? 'planned'
  const attendanceAction: { label: string; body: Record<string, unknown> } | null =
    status === 'no_show' ? { label: t('calendar.undoNoShow'), body: { status: 'planned' } }
      : status === 'cancelled' ? (visit.late_cancel
        ? { label: t('calendar.clearLateCancel'), body: { late_cancel: false } }
        : { label: t('calendar.markLateCancel'), body: { late_cancel: true } })
        : (status === 'planned' || status === 'in_progress') && started
          ? { label: t('calendar.markNoShow'), body: { status: 'no_show' } }
          : null

  const saveAttendance = async () => {
    if (!attendanceAction || saving) return
    setError('')
    setSaving(true)
    try {
      await api.put(`/visits/${visit.id}`, attendanceAction.body)
      onMoved()
    } catch (err) {
      setError(apiErrorMessage(err, t('calendar.attendanceError')))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving || !changed) return
    setError('')
    const startIso = zonedWallTimeToIso(day, time, timeZone)
    const startMs = new Date(startIso).getTime()
    if (!Number.isFinite(startMs)) {
      setError(t('calendar.moveInvalidTime'))
      return
    }
    const payload: { date_start: string; date_end?: string } = { date_start: startIso }
    if (span !== null) payload.date_end = new Date(startMs + span).toISOString()

    setSaving(true)
    try {
      await api.put(`/visits/${visit.id}`, payload)
      onMoved()
    } catch (err) {
      // a 409 leaves the visit where it was: the grid is refreshed only after a successful move
      setError(
        apiErrorStatus(err) === 409
          ? t('calendar.moveConflict')
          : apiErrorMessage(err, t('calendar.moveError')),
      )
    } finally {
      setSaving(false)
    }
  }

  const row = 'grid grid-cols-[6.5rem_1fr] gap-2 py-1.5'
  const term = 'text-[var(--workspace-muted)]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="visit-details-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[24px] border border-[var(--workspace-card-border)] bg-[var(--workspace-panel)] p-6 shadow-[var(--x-shadow-lift)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="visit-details-title" className="text-lg font-semibold text-[var(--workspace-ink)]">
            {t('calendar.detailsTitle')}
          </h2>
          {canManage && (
            <Button variant="secondary" onClick={() => onEdit(visit.id)} disabled={saving}>
              {t('calendar.editVisit')}
            </Button>
          )}
        </div>

        <dl className="mt-3 divide-y divide-[var(--workspace-line)] text-sm text-[var(--workspace-ink)]">
          <div className={row}>
            <dt className={term}>{t('visits.client')}</dt>
            <dd className="min-w-0 font-medium">{name}</dd>
          </div>
          <div className={row}>
            <dt className={term}>{t('calendar.detailsServices')}</dt>
            <dd className="min-w-0">
              <ul aria-label={t('calendar.detailsServices')}>
                {services.length > 1
                  ? services.map((item) => (
                      <li key={item.id}>
                        {item.service_name || '—'}
                        <span className="text-[var(--workspace-muted)]"> · {label(item.date_start)}–{label(item.date_end)}</span>
                      </li>
                    ))
                  : <li>{visit.service_name || services[0]?.service_name || '—'}</li>}
              </ul>
            </dd>
          </div>
          <div className={row}>
            <dt className={term}>{t('visits.specialist')}</dt>
            <dd className="min-w-0">{staffName || `#${visit.specialist_id}`}</dd>
          </div>
          <div className={row}>
            <dt className={term}>{t('calendar.moveTime')}</dt>
            <dd className="min-w-0">
              <span className="block">{dayLabel} · {label(visit.date_start)}{endIso ? `–${label(endIso)}` : ''}</span>
              <span className="block text-xs text-[var(--workspace-muted)]">{timeZone}</span>
            </dd>
          </div>
          <div className={row}>
            <dt className={term}>{t('visits.status')}</dt>
            <dd className="min-w-0">
              {visitStatus(visit.status) || '—'}
              {status === 'cancelled' && visit.late_cancel && (
                <span className="text-[var(--workspace-muted)]"> · {t('visits.lateCancel')}</span>
              )}
            </dd>
          </div>
          <div className={row}>
            <dt className={term}>{t('visits.price')}</dt>
            <dd className="min-w-0 tabular-nums">{price}</dd>
          </div>
        </dl>

        {canManage && (
          <section aria-label={t('calendar.attendanceTitle')} className="mt-4 border-t border-[var(--workspace-line)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--workspace-ink)]">{t('calendar.attendanceTitle')}</h3>
            {attendanceAction ? (
              <Button variant="secondary" className="mt-2" onClick={saveAttendance} disabled={saving}>
                {attendanceAction.label}
              </Button>
            ) : (
              (status === 'planned' || status === 'in_progress') && (
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">{t('calendar.noShowHint')}</p>
              )
            )}
          </section>
        )}

        {canManage ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-[var(--workspace-line)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--workspace-ink)]">{t('calendar.moveTitle')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-[var(--workspace-ink)]">
                {t('calendar.moveDate')}
                <input
                  type="date"
                  required
                  autoFocus
                  value={day}
                  onChange={(event) => setDay(event.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--workspace-line)] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium text-[var(--workspace-ink)]">
                {t('calendar.moveTime')}
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--workspace-line)] px-3 py-2"
                />
              </label>
            </div>

            {changed && (
              <p aria-live="polite" className="text-sm text-[var(--workspace-ink)]">
                {t('calendar.moveFromTo')
                  .replace('{from}', `${current.day} ${current.time}`)
                  .replace('{to}', `${day} ${time}`)}
              </p>
            )}

            {error && (
              <div role="alert">
                <FormError message={error} />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={saving || !changed}>
                {saving ? t('calendar.moving') : t('calendar.moveSubmit')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={onClose} autoFocus>
              {t('common.close')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
