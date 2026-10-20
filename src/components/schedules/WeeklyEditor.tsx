import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import Button from '../../ui/Button'
import Card from '../../ui/Card'
import Input from '../../ui/Input'
import LoadingSpinner from '../LoadingSpinner'
import QueryError from '../QueryError'
import { useTranslation } from '../../hooks/useTranslation'
import { isValidTimeWindow } from '../../utils/dates'
import type { WorkScheduleOut } from '../../api/types'
import type { TranslationKey } from '../../i18n/translations'

const WEEKDAYS: TranslationKey[] = [
  'schedule.weekday.mon',
  'schedule.weekday.tue',
  'schedule.weekday.wed',
  'schedule.weekday.thu',
  'schedule.weekday.fri',
  'schedule.weekday.sat',
  'schedule.weekday.sun',
]

const hhmm = (value: string) => value.slice(0, 5)

interface Props {
  specialistId: number
}

function IntervalRow({ item, onChanged }: { item: WorkScheduleOut; onChanged: () => void }) {
  const { t } = useTranslation()
  const [start, setStart] = useState(hhmm(item.start_time))
  const [end, setEnd] = useState(hhmm(item.end_time))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const dirty = start !== hhmm(item.start_time) || end !== hhmm(item.end_time)

  const save = async () => {
    if (!isValidTimeWindow(start, end)) {
      setError(t('schedule.error.timeRange'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.put(`/schedules/work/${item.id}`, { start_time: start, end_time: end })
      onChanged()
    } catch (err) {
      setError(apiErrorMessage(err, t('schedule.error.save')))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    setError(null)
    try {
      await api.delete(`/schedules/work/${item.id}`)
      onChanged()
    } catch (err) {
      setError(apiErrorMessage(err, t('schedule.error.save')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="time"
        aria-label={t('schedule.start')}
        value={start}
        onChange={(event) => setStart(event.target.value)}
        className="w-32"
      />
      <span aria-hidden="true">–</span>
      <Input
        type="time"
        aria-label={t('schedule.end')}
        value={end}
        onChange={(event) => setEnd(event.target.value)}
        className="w-32"
      />
      {dirty && (
        <Button onClick={save} disabled={saving}>
          {t('common.save')}
        </Button>
      )}
      {confirming ? (
        <>
          <Button variant="danger" onClick={remove} disabled={saving}>
            {t('schedule.confirmDelete')}
          </Button>
          <Button variant="quiet" onClick={() => setConfirming(false)}>
            {t('common.cancel')}
          </Button>
        </>
      ) : (
        <Button variant="quiet" onClick={() => setConfirming(true)} disabled={saving}>
          {t('common.delete')}
        </Button>
      )}
      {error && <p role="alert" className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export default function WeeklyEditor({ specialistId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [addingDay, setAddingDay] = useState<number | null>(null)
  const [draft, setDraft] = useState({ start: '09:00', end: '18:00' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery<WorkScheduleOut[]>({
    queryKey: ['work-schedule', specialistId],
    queryFn: async () => {
      const { data } = await api.get('/schedules/work', { params: { specialist_id: specialistId } })
      return Array.isArray(data) ? data : []
    },
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['work-schedule', specialistId] })
    queryClient.invalidateQueries({ queryKey: ['onboarding'] })
  }

  const openAdd = (day: number) => {
    setAddingDay(day)
    setDraft({ start: '09:00', end: '18:00' })
    setError(null)
  }

  const add = async () => {
    if (addingDay === null) return
    if (!isValidTimeWindow(draft.start, draft.end)) {
      setError(t('schedule.error.timeRange'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.post('/schedules/work', {
        specialist_id: specialistId,
        weekday: addingDay,
        start_time: draft.start,
        end_time: draft.end,
      })
      setAddingDay(null)
      refresh()
    } catch (err) {
      setError(apiErrorMessage(err, t('schedule.error.save')))
    } finally {
      setSaving(false)
    }
  }

  if (isError) return <QueryError retry={refetch} />
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--workspace-muted)]">{t('schedule.weekly.hint')}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {WEEKDAYS.map((name, day) => {
          const rows = (data ?? []).filter((item) => item.weekday === day)
          return (
            <Card key={day} className="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-medium">{t(name)}</h3>
                <Button variant="quiet" onClick={() => openAdd(day)}>
                  {t('schedule.addWindow')}
                </Button>
              </div>
              <div className="space-y-2">
                {rows.length === 0 && addingDay !== day && (
                  <p className="text-sm text-[var(--workspace-muted)]">{t('schedule.dayOff')}</p>
                )}
                {rows.map((item) => (
                  <IntervalRow key={item.id} item={item} onChanged={refresh} />
                ))}
                {addingDay === day && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--workspace-line)] pt-2">
                    <Input
                      type="time"
                      aria-label={t('schedule.start')}
                      value={draft.start}
                      onChange={(event) => setDraft({ ...draft, start: event.target.value })}
                      className="w-32"
                    />
                    <span aria-hidden="true">–</span>
                    <Input
                      type="time"
                      aria-label={t('schedule.end')}
                      value={draft.end}
                      onChange={(event) => setDraft({ ...draft, end: event.target.value })}
                      className="w-32"
                    />
                    <Button onClick={add} disabled={saving}>{t('common.save')}</Button>
                    <Button variant="quiet" onClick={() => setAddingDay(null)}>
                      {t('common.cancel')}
                    </Button>
                    {error && (
                      <p role="alert" className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
