import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import { MY_BUSINESS_KEY } from '../../hooks/useMyBusiness'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../ui/Button'
import Card from '../../ui/Card'
import Input from '../../ui/Input'
import Select from '../../ui/Select'
import type { BusinessOut } from '../../api/types'

const inRange = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max

// late-cancel window and the "N no-shows within M months" rule; everything is off until the owner turns it on
export default function NoShowRules({ business, canEdit }: { business: BusinessOut; canEdit: boolean }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [windowHours, setWindowHours] = useState(String(business.late_cancel_window_hours ?? 24))
  const [enabled, setEnabled] = useState(Boolean(business.noshow_rule_enabled))
  const [threshold, setThreshold] = useState(String(business.noshow_rule_threshold ?? 3))
  const [months, setMonths] = useState(String(business.noshow_rule_period_months ?? 6))
  const [tag, setTag] = useState(business.noshow_rule_tag ?? 'no-show')
  const [block, setBlock] = useState(Boolean(business.noshow_rule_block_online))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setSaved(false)
  }

  const save = async () => {
    const hours = Number(windowHours)
    const count = Number(threshold)
    const period = Number(months)
    const cleanTag = tag.trim().replace(/\s+/g, ' ')
    if (!inRange(hours, 0, 336) || !inRange(count, 1, 50) || !inRange(period, 1, 36)
      || !cleanTag || cleanTag.length > 40) {
      setError(t('noShowRule.rangeError'))
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await api.put(`/businesses/${business.id}`, {
        late_cancel_window_hours: hours,
        noshow_rule_enabled: enabled,
        noshow_rule_threshold: count,
        noshow_rule_period_months: period,
        noshow_rule_tag: cleanTag,
        noshow_rule_block_online: block,
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
    <Card className="p-5">
      <h3 className="mb-1 font-semibold">{t('noShowRule.title')}</h3>
      <p className="mb-4 text-sm text-[var(--workspace-muted)]">{t('noShowRule.hint')}</p>
      <div className="flex flex-wrap items-start gap-4">
        <label className="w-56 text-sm">
          <span className="mb-1 block">{t('noShowRule.window')}</span>
          <Input type="number" min={0} max={336} value={windowHours} disabled={!canEdit}
            onChange={(event) => edit(setWindowHours)(event.target.value)} />
          <span className="mt-1 block text-xs text-[var(--workspace-muted)]">{t('noShowRule.windowHint')}</span>
        </label>
        <label className="w-56 text-sm">
          <span className="mb-1 block">{t('noShowRule.enabled')}</span>
          <Select value={enabled ? 'on' : 'off'} disabled={!canEdit}
            onChange={(event) => edit(setEnabled)(event.target.value === 'on')}>
            <option value="off">{t('noShowRule.off')}</option>
            <option value="on">{t('noShowRule.on')}</option>
          </Select>
        </label>
      </div>
      {enabled && (
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <label className="w-32 text-sm">
            <span className="mb-1 block">{t('noShowRule.threshold')}</span>
            <Input type="number" min={1} max={50} value={threshold} disabled={!canEdit}
              onChange={(event) => edit(setThreshold)(event.target.value)} />
          </label>
          <label className="w-32 text-sm">
            <span className="mb-1 block">{t('noShowRule.period')}</span>
            <Input type="number" min={1} max={36} value={months} disabled={!canEdit}
              onChange={(event) => edit(setMonths)(event.target.value)} />
          </label>
          <label className="w-48 text-sm">
            <span className="mb-1 block">{t('noShowRule.tag')}</span>
            <Input value={tag} maxLength={40} disabled={!canEdit}
              onChange={(event) => edit(setTag)(event.target.value)} />
          </label>
          <label className="w-56 text-sm">
            <span className="mb-1 block">{t('noShowRule.block')}</span>
            <Select value={block ? 'yes' : 'no'} disabled={!canEdit}
              onChange={(event) => edit(setBlock)(event.target.value === 'yes')}>
              <option value="no">{t('noShowRule.blockNo')}</option>
              <option value="yes">{t('noShowRule.blockYes')}</option>
            </Select>
          </label>
          <p className="w-full text-sm text-[var(--workspace-muted)]">
            {t('noShowRule.summary').replace('{n}', threshold).replace('{m}', months).replace('{tag}', tag.trim())}
          </p>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {saved && <p role="status" className="mt-3 text-sm text-green-700 dark:text-green-400">{t('noShowRule.saved')}</p>}
      {canEdit && (
        <div className="mt-4">
          <Button onClick={save} disabled={saving}>{t('noShowRule.save')}</Button>
        </div>
      )}
    </Card>
  )
}
