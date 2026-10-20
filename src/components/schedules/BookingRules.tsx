import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import { MY_BUSINESS_KEY } from '../../hooks/useMyBusiness'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../ui/Button'
import Card from '../../ui/Card'
import Input from '../../ui/Input'
import LoadingSpinner from '../LoadingSpinner'
import type { BusinessOut, ServiceOut } from '../../api/types'

const TIMEZONES = [
  'UTC',
  'Europe/Prague',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/London',
  'Europe/Warsaw',
  'Europe/Kyiv',
  'Asia/Almaty',
  'Asia/Tbilisi',
  'Asia/Dubai',
  'America/New_York',
  'America/Los_Angeles',
]

interface Props {
  business: BusinessOut | null
  canEdit: boolean
}

function ServiceBufferRow({ service, disabled, onSaved }: {
  service: ServiceOut
  disabled: boolean
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [before, setBefore] = useState(String(service.buffer_before_minutes ?? 0))
  const [after, setAfter] = useState(String(service.buffer_after_minutes ?? 0))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const dirty = before !== String(service.buffer_before_minutes ?? 0)
    || after !== String(service.buffer_after_minutes ?? 0)

  const save = async () => {
    const beforeValue = Number(before)
    const afterValue = Number(after)
    if (
      !Number.isInteger(beforeValue) || !Number.isInteger(afterValue)
      || beforeValue < 0 || afterValue < 0 || beforeValue > 1440 || afterValue > 1440
    ) {
      setError(t('schedule.error.bufferRange'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.put(`/services/${service.id}`, {
        buffer_before_minutes: beforeValue,
        buffer_after_minutes: afterValue,
      })
      onSaved()
    } catch (err) {
      setError(apiErrorMessage(err, t('schedule.error.save')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="flex flex-wrap items-end gap-3 border-t border-[var(--workspace-line)] py-3 first:border-t-0">
      <div className="min-w-40 flex-1">
        <p className="font-medium">{service.name}</p>
        {service.duration_minutes != null && (
          <p className="text-sm text-[var(--workspace-muted)]">
            {t('schedule.buffers.duration')}: {service.duration_minutes} {t('services.min')}
          </p>
        )}
      </div>
      <label className="text-sm">
        <span className="mb-1 block">{t('schedule.buffers.before')}</span>
        <Input
          type="number"
          min={0}
          max={1440}
          step={5}
          className="w-28"
          value={before}
          disabled={disabled}
          onChange={(event) => setBefore(event.target.value)}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block">{t('schedule.buffers.after')}</span>
        <Input
          type="number"
          min={0}
          max={1440}
          step={5}
          className="w-28"
          value={after}
          disabled={disabled}
          onChange={(event) => setAfter(event.target.value)}
        />
      </label>
      {!disabled && dirty && (
        <Button onClick={save} disabled={saving}>{t('common.save')}</Button>
      )}
      {error && <p role="alert" className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </li>
  )
}

export default function BookingRules({ business, canEdit }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [timezone, setTimezone] = useState(business?.timezone ?? 'UTC')
  const [horizon, setHorizon] = useState(String(business?.booking_horizon_days ?? 30))
  const [lead, setLead] = useState(String(business?.booking_lead_time_minutes ?? 0))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const servicesQuery = useQuery<ServiceOut[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get('/services/')
      return Array.isArray(data) ? data : (data?.items || [])
    },
  })

  const savePolicy = async () => {
    if (!business) return
    const horizonValue = Number(horizon)
    const leadValue = Number(lead)
    if (!Number.isInteger(horizonValue) || horizonValue < 1 || horizonValue > 365) {
      setError(t('schedule.error.horizonRange'))
      return
    }
    if (!Number.isInteger(leadValue) || leadValue < 0 || leadValue > 10080) {
      setError(t('schedule.error.leadRange'))
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await api.put(`/businesses/${business.id}`, {
        timezone: timezone.trim(),
        booking_horizon_days: horizonValue,
        booking_lead_time_minutes: leadValue,
      })
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: MY_BUSINESS_KEY })
    } catch (err) {
      setError(apiErrorMessage(err, t('schedule.error.save')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="mb-1 font-semibold">{t('schedule.rules.title')}</h3>
        <p className="mb-4 text-sm text-[var(--workspace-muted)]">{t('schedule.rules.hint')}</p>

        {!business ? (
          <p className="text-sm text-[var(--workspace-muted)]">{t('schedule.rules.noBusiness')}</p>
        ) : (
          <div className="flex flex-wrap items-start gap-4">
            <label className="min-w-56 text-sm">
              <span className="mb-1 block">{t('schedule.rules.timezone')}</span>
              <Input
                list="schedule-timezones"
                value={timezone}
                maxLength={64}
                disabled={!canEdit}
                onChange={(event) => {
                  setTimezone(event.target.value)
                  setSaved(false)
                }}
              />
              <datalist id="schedule-timezones">
                {TIMEZONES.map((zone) => <option key={zone} value={zone} />)}
              </datalist>
              <span className="mt-1 block text-xs text-[var(--workspace-muted)]">{t('schedule.rules.timezoneHint')}</span>
            </label>
            <label className="w-44 text-sm">
              <span className="mb-1 block">{t('schedule.rules.horizon')}</span>
              <Input
                type="number"
                min={1}
                max={365}
                value={horizon}
                disabled={!canEdit}
                onChange={(event) => {
                  setHorizon(event.target.value)
                  setSaved(false)
                }}
              />
              <span className="mt-1 block text-xs text-[var(--workspace-muted)]">{t('schedule.rules.horizonHint')}</span>
            </label>
            <label className="w-52 text-sm">
              <span className="mb-1 block">{t('schedule.rules.lead')}</span>
              <Input
                type="number"
                min={0}
                max={10080}
                step={5}
                value={lead}
                disabled={!canEdit}
                onChange={(event) => {
                  setLead(event.target.value)
                  setSaved(false)
                }}
              />
              <span className="mt-1 block text-xs text-[var(--workspace-muted)]">{t('schedule.rules.leadHint')}</span>
            </label>
          </div>
        )}

        {!canEdit && business && (
          <p className="mt-3 text-sm text-[var(--workspace-muted)]">{t('schedule.rules.readOnly')}</p>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {saved && <p role="status" className="mt-3 text-sm text-green-700 dark:text-green-400">{t('schedule.rules.saved')}</p>}
        {canEdit && business && (
          <div className="mt-4">
            <Button onClick={savePolicy} disabled={saving}>{t('schedule.rules.save')}</Button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 font-semibold">{t('schedule.buffers.title')}</h3>
        <p className="mb-3 text-sm text-[var(--workspace-muted)]">{t('schedule.buffers.hint')}</p>

        {servicesQuery.isLoading && (
          <div className="flex h-24 items-center justify-center"><LoadingSpinner /></div>
        )}
        {servicesQuery.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {apiErrorMessage(servicesQuery.error, t('schedule.error.load'))}
          </p>
        )}
        {!servicesQuery.isLoading && !servicesQuery.isError && (servicesQuery.data ?? []).length === 0 && (
          <p className="text-sm text-[var(--workspace-muted)]">{t('schedule.buffers.empty')}</p>
        )}
        <ul>
          {(servicesQuery.data ?? []).map((service) => (
            <ServiceBufferRow
              key={service.id}
              service={service}
              disabled={!canEdit}
              onSaved={() => queryClient.invalidateQueries({ queryKey: ['services'] })}
            />
          ))}
        </ul>
      </Card>
    </div>
  )
}
