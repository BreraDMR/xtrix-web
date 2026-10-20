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
import { isValidTimeWindow, showDay, showZonedDateTime, today, zonedWallTimeToIso } from '../../utils/dates'
import type { BlockSlotOut, ScheduleExceptionOut } from '../../api/types'

interface Props {
  specialistId: number
  timeZone: string
}

const emptyException = () => ({
  id: undefined as number | undefined,
  day: today(),
  closed: true,
  start: '12:00',
  end: '13:00',
  reason: '',
})

const emptyBlock = () => ({ day: today(), start: '12:00', end: '13:00', reason: '' })

export default function DateExceptions({ specialistId, timeZone }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [exceptionForm, setExceptionForm] = useState(emptyException)
  const [blockForm, setBlockForm] = useState(emptyBlock)
  const [exceptionError, setExceptionError] = useState<string | null>(null)
  const [blockError, setBlockError] = useState<string | null>(null)
  const [savingException, setSavingException] = useState(false)
  const [savingBlock, setSavingBlock] = useState(false)
  const [confirmException, setConfirmException] = useState<number | null>(null)
  const [confirmBlock, setConfirmBlock] = useState<number | null>(null)

  const exceptionsQuery = useQuery<ScheduleExceptionOut[]>({
    queryKey: ['schedule-exceptions', specialistId],
    queryFn: async () => {
      const { data } = await api.get('/schedules/exceptions', { params: { specialist_id: specialistId } })
      return Array.isArray(data) ? data : []
    },
  })

  const blocksQuery = useQuery<BlockSlotOut[]>({
    queryKey: ['schedule-blocks', specialistId],
    queryFn: async () => {
      const { data } = await api.get('/schedules/blocks', { params: { specialist_id: specialistId } })
      return Array.isArray(data) ? data : []
    },
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['schedule-exceptions', specialistId] })
    queryClient.invalidateQueries({ queryKey: ['schedule-blocks', specialistId] })
  }

  const saveException = async () => {
    if (!exceptionForm.closed && !isValidTimeWindow(exceptionForm.start, exceptionForm.end)) {
      setExceptionError(t('schedule.error.timeRange'))
      return
    }
    setSavingException(true)
    setExceptionError(null)
    const payload = {
      exception_date: exceptionForm.day,
      is_closed: exceptionForm.closed,
      start_time: exceptionForm.closed ? null : exceptionForm.start,
      end_time: exceptionForm.closed ? null : exceptionForm.end,
      reason: exceptionForm.reason.trim() || null,
    }
    try {
      if (exceptionForm.id) {
        await api.put(`/schedules/exceptions/${exceptionForm.id}`, payload)
      } else {
        await api.post('/schedules/exceptions', { ...payload, specialist_id: specialistId })
      }
      setExceptionForm(emptyException())
      refresh()
    } catch (err) {
      setExceptionError(apiErrorMessage(err, t('schedule.error.save')))
    } finally {
      setSavingException(false)
    }
  }

  const deleteException = async (id: number) => {
    setExceptionError(null)
    try {
      await api.delete(`/schedules/exceptions/${id}`)
      if (exceptionForm.id === id) setExceptionForm(emptyException())
      setConfirmException(null)
      refresh()
    } catch (err) {
      setExceptionError(apiErrorMessage(err, t('schedule.error.save')))
    }
  }

  const editException = (item: ScheduleExceptionOut) => {
    setExceptionForm({
      id: item.id,
      day: item.exception_date,
      closed: item.is_closed,
      start: item.start_time?.slice(0, 5) ?? '12:00',
      end: item.end_time?.slice(0, 5) ?? '13:00',
      reason: item.reason ?? '',
    })
    setExceptionError(null)
  }

  const saveBlock = async () => {
    if (!blockForm.day || !isValidTimeWindow(blockForm.start, blockForm.end, 15)) {
      setBlockError(t('schedule.error.timeRange'))
      return
    }
    const start = zonedWallTimeToIso(blockForm.day, blockForm.start, timeZone)
    const end = zonedWallTimeToIso(blockForm.day, blockForm.end, timeZone)
    if (end <= start) {
      setBlockError(t('schedule.error.timeRange'))
      return
    }
    setSavingBlock(true)
    setBlockError(null)
    try {
      await api.post('/schedules/blocks', {
        specialist_id: specialistId,
        start,
        end,
        reason: blockForm.reason.trim() || null,
      })
      setBlockForm(emptyBlock())
      refresh()
    } catch (err) {
      setBlockError(apiErrorMessage(err, t('schedule.error.save')))
    } finally {
      setSavingBlock(false)
    }
  }

  const deleteBlock = async (id: number) => {
    setBlockError(null)
    try {
      await api.delete(`/schedules/blocks/${id}`)
      setConfirmBlock(null)
      refresh()
    } catch (err) {
      setBlockError(apiErrorMessage(err, t('schedule.error.save')))
    }
  }

  if (exceptionsQuery.isError || blocksQuery.isError) {
    return (
      <QueryError
        retry={() => {
          exceptionsQuery.refetch()
          blocksQuery.refetch()
        }}
      />
    )
  }
  if (exceptionsQuery.isLoading || blocksQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const exceptions = exceptionsQuery.data ?? []
  const blocks = blocksQuery.data ?? []

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--workspace-muted)]">
        {t('schedule.exceptions.hint')} {t('schedule.timezone')}: {timeZone}
      </p>

      <Card className="p-5">
        <h3 className="mb-1 font-semibold">{t('schedule.exceptions.title')}</h3>
        <p className="mb-4 text-sm text-[var(--workspace-muted)]">{t('schedule.exceptions.closed')}</p>

        <div className="mb-4 space-y-3 rounded-lg border border-[var(--workspace-line)] p-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block">{t('schedule.exceptions.day')}</span>
              <Input
                type="date"
                value={exceptionForm.day}
                onChange={(event) => setExceptionForm({ ...exceptionForm, day: event.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={exceptionForm.closed}
                onChange={(event) => setExceptionForm({ ...exceptionForm, closed: event.target.checked })}
              />
              {t('schedule.exceptions.closedLabel')}
            </label>
            {!exceptionForm.closed && (
              <>
                <label className="text-sm">
                  <span className="mb-1 block">{t('schedule.start')}</span>
                  <Input
                    type="time"
                    value={exceptionForm.start}
                    onChange={(event) => setExceptionForm({ ...exceptionForm, start: event.target.value })}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block">{t('schedule.end')}</span>
                  <Input
                    type="time"
                    value={exceptionForm.end}
                    onChange={(event) => setExceptionForm({ ...exceptionForm, end: event.target.value })}
                  />
                </label>
              </>
            )}
            <label className="min-w-40 flex-1 text-sm">
              <span className="mb-1 block">{t('schedule.reason')}</span>
              <Input
                value={exceptionForm.reason}
                maxLength={255}
                placeholder={t('schedule.reasonPlaceholder')}
                onChange={(event) => setExceptionForm({ ...exceptionForm, reason: event.target.value })}
              />
            </label>
          </div>
          {exceptionError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{exceptionError}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={saveException} disabled={savingException}>
              {exceptionForm.id ? t('schedule.exceptions.update') : t('schedule.exceptions.add')}
            </Button>
            {exceptionForm.id && (
              <Button variant="quiet" onClick={() => setExceptionForm(emptyException())}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </div>

        {exceptions.length === 0 ? (
          <p className="text-sm text-[var(--workspace-muted)]">{t('schedule.exceptions.empty')}</p>
        ) : (
          <ul className="divide-y divide-[var(--workspace-line)]">
            {exceptions.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {showDay(item.exception_date)}
                    {' · '}
                    {item.is_closed
                      ? t('schedule.exceptions.closedLabel')
                      : `${item.start_time?.slice(0, 5)}–${item.end_time?.slice(0, 5)}`}
                  </p>
                  {item.reason && <p className="text-sm text-[var(--workspace-muted)]">{item.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="quiet" onClick={() => editException(item)}>
                    {t('common.edit')}
                  </Button>
                  {confirmException === item.id ? (
                    <>
                      <Button variant="danger" onClick={() => deleteException(item.id)}>
                        {t('schedule.confirmDelete')}
                      </Button>
                      <Button variant="quiet" onClick={() => setConfirmException(null)}>
                        {t('common.cancel')}
                      </Button>
                    </>
                  ) : (
                    <Button variant="quiet" onClick={() => setConfirmException(item.id)}>
                      {t('common.delete')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 font-semibold">{t('schedule.blocks.title')}</h3>
        <p className="mb-4 text-sm text-[var(--workspace-muted)]">{t('schedule.blocks.hint')}</p>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--workspace-line)] p-3">
          <label className="text-sm">
            <span className="mb-1 block">{t('schedule.exceptions.day')}</span>
            <Input
              type="date"
              value={blockForm.day}
              onChange={(event) => setBlockForm({ ...blockForm, day: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block">{t('schedule.start')}</span>
            <Input
              type="time"
              value={blockForm.start}
              onChange={(event) => setBlockForm({ ...blockForm, start: event.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block">{t('schedule.end')}</span>
            <Input
              type="time"
              value={blockForm.end}
              onChange={(event) => setBlockForm({ ...blockForm, end: event.target.value })}
            />
          </label>
          <label className="min-w-40 flex-1 text-sm">
            <span className="mb-1 block">{t('schedule.reason')}</span>
            <Input
              value={blockForm.reason}
              maxLength={255}
              placeholder={t('schedule.reasonPlaceholder')}
              onChange={(event) => setBlockForm({ ...blockForm, reason: event.target.value })}
            />
          </label>
          <Button variant="secondary" onClick={saveBlock} disabled={savingBlock}>
            {t('schedule.blocks.add')}
          </Button>
        </div>
        {blockError && (
          <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">{blockError}</p>
        )}

        {blocks.length === 0 ? (
          <p className="text-sm text-[var(--workspace-muted)]">{t('schedule.blocks.empty')}</p>
        ) : (
          <ul className="divide-y divide-[var(--workspace-line)]">
            {blocks.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="font-medium">
                    {showZonedDateTime(item.start, timeZone)} – {showZonedDateTime(item.end, timeZone)}
                  </p>
                  {item.reason && <p className="text-sm text-[var(--workspace-muted)]">{item.reason}</p>}
                </div>
                <div className="flex gap-2">
                  {confirmBlock === item.id ? (
                    <>
                      <Button variant="danger" onClick={() => deleteBlock(item.id)}>
                        {t('schedule.confirmDelete')}
                      </Button>
                      <Button variant="quiet" onClick={() => setConfirmBlock(null)}>
                        {t('common.cancel')}
                      </Button>
                    </>
                  ) : (
                    <Button variant="quiet" onClick={() => setConfirmBlock(item.id)}>
                      {t('common.delete')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
