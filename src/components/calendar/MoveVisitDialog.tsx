import { useEffect, useState } from 'react'
import api from '../../api/client'
import { apiErrorMessage, apiErrorStatus } from '../../api/errors'
import FormError from '../FormError'
import Button from '../../ui/Button'
import { useTranslation } from '../../hooks/useTranslation'
import { isoToZonedWallTime, zonedWallTimeToIso } from '../../utils/dates'
import type { CalendarVisit } from './DayGrid'

interface MoveVisitDialogProps {
  visit: CalendarVisit
  name: string
  timeZone: string
  onClose: () => void
  onMoved: () => void
}

const durationMs = (visit: CalendarVisit): number | null => {
  if (!visit.date_end) return null
  const start = new Date(visit.date_start).getTime()
  const end = new Date(visit.date_end).getTime()
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : null
}

export default function MoveVisitDialog({
  visit,
  name,
  timeZone,
  onClose,
  onMoved,
}: MoveVisitDialogProps) {
  const { t } = useTranslation()
  const current = isoToZonedWallTime(visit.date_start, timeZone)
  const [day, setDay] = useState(current.day)
  const [time, setTime] = useState(current.time)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const span = durationMs(visit)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, saving])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
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
        aria-labelledby="move-visit-title"
        className="w-full max-w-md rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-panel)] p-5 shadow-xl"
      >
        <h2 id="move-visit-title" className="text-lg font-semibold text-[var(--workspace-ink)]">
          {t('calendar.moveTitle')}
        </h2>
        <p className="mt-1 text-sm text-[var(--workspace-muted)]">
          {name} · {current.day} {current.time}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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

          {error && (
            <div role="alert">
              <FormError message={error} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('calendar.moving') : t('calendar.moveSubmit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
