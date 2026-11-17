import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LuArrowLeft, LuCalendarClock, LuCircleCheck, LuMail, LuMapPin, LuPhone, LuUser, LuX } from 'react-icons/lu'
import visitorApi, { visitorKey } from '../../api/visitorClient'
import { apiErrorCode, apiErrorMessage, apiErrorStatus } from '../../api/errors'
import type { Schema } from '../../api/types'
import type { TranslationKey } from '../../i18n/translations'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Modal from '../../ui/Modal'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Isolated, Notice, VisitorShell } from '../../components/visitor/VisitorUi'
import { Price, StatusPill } from '../../components/visitor/VisitSummary'
import { browserTimeZone, formatClock, formatVisitTime, safeTimeZone, visitServices, zoneLabel } from '../../components/visitor/format'
import { useTranslation } from '../../hooks/useTranslation'
import { isoToZonedWallTime, zonedWallTimeToIso } from '../../utils/dates'

type Visit = Schema<'VisitorHistoryVisit'>
type Actions = Schema<'VisitorBookingActions'>
type Command = 'confirm' | 'cancel' | 'reschedule'

// Hints for buttons the salon doesn't allow right now, by the last part of the reason code.
const REASON_HINTS: [RegExp, TranslationKey][] = [
  [/^visitor_actions_unavailable$/, 'visitor.reason.unavailableSalon'],
  [/_too_late$/, 'visitor.reason.tooLate'],
  [/_completed$/, 'visitor.reason.completed'],
  [/_in_progress$/, 'visitor.reason.inProgress'],
  [/_started$/, 'visitor.reason.inProgress'],
  [/_cancelled$|_already$/, 'visitor.reason.cancelled'],
  [/_unavailable$/, 'visitor.reason.unavailable'],
]

function reasonHint(reason: string | null | undefined): TranslationKey | null {
  if (!reason) return null
  return REASON_HINTS.find(([pattern]) => pattern.test(reason))?.[1] ?? 'visitor.reason.unavailable'
}

export default function VisitorVisit() {
  const { t } = useTranslation()
  const { visitId } = useParams()
  const id = Number(visitId)
  const visit = useQuery({
    queryKey: visitorKey('visit', id),
    enabled: Number.isInteger(id) && id > 0,
    retry: false,
    queryFn: async ({ signal }) => (await visitorApi.get<Visit>(`/visitor/visits/${id}`, { signal })).data,
  })
  const gone = !Number.isInteger(id) || id <= 0 || apiErrorStatus(visit.error) === 404

  return <VisitorShell title={visit.data?.business.name ?? t('visitor.visit.title')}
    actions={<Link to="/visitor/visits" className="ui-button ui-button-secondary"><LuArrowLeft aria-hidden="true" />{t('visitor.visit.back')}</Link>}>
    {gone ? <Notice tone="warning">{t('visitor.visit.gone')}</Notice>
      : visit.isPending ? <div className="py-12"><LoadingSpinner /></div>
        : visit.isError ? <Notice tone="error">
          <p>{apiErrorMessage(visit.error, t('common.loadError'))}</p>
          <Button variant="secondary" className="mt-3" onClick={() => void visit.refetch()}>{t('common.retry')}</Button>
        </Notice>
          : <Isolated fallback={<Notice tone="warning">{t('visitor.feed.cardFailed')}</Notice>}>
            <VisitDetails visit={visit.data} />
          </Isolated>}
  </VisitorShell>
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div className="flex items-start gap-3 py-3">
    <span className="x-icon-soft mt-0.5" aria-hidden="true">{icon}</span>
    <div className="min-w-0"><dt className="text-xs text-[var(--workspace-muted)]">{label}</dt><dd className="mt-0.5 text-[15px] [overflow-wrap:anywhere]">{children}</dd></div>
  </div>
}

function VisitDetails({ visit }: { visit: Visit }) {
  const { t, locale } = useTranslation()
  const zone = visit.business.timezone
  const other = zoneLabel(zone)
  const staff = visit.staff_name ?? visit.items.find(item => item.staff_name)?.staff_name
  const { business } = visit
  return <div className="space-y-5">
    <section className="ui-card p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium capitalize text-[var(--workspace-accent)]">{formatVisitTime(visit.start, zone, locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h2 className="mt-1 font-display text-[28px] font-semibold leading-tight tracking-[-0.035em] tabular-nums sm:text-[34px]">
            {formatClock(visit.start, zone, locale)}{visit.end ? `–${formatClock(visit.end, zone, locale)}` : ''}
          </h2>
          {other && <p className="mt-1 text-xs text-[var(--workspace-muted)]">{t('visitor.time.salonZone').replace('{zone}', other)} · {t('visitor.time.yourZone').replace('{zone}', browserTimeZone())}</p>}
          <p className="mt-3 text-[17px] font-semibold [overflow-wrap:anywhere]">{visitServices(visit) || t('visitor.visit.noService')}</p>
        </div>
        <StatusPill status={visit.status} />
      </div>
      {visit.confirmed_at && <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--tint-green)] px-3 py-1 text-xs font-medium text-[var(--tint-green-ink)]">
        <LuCircleCheck className="h-3.5 w-3.5" aria-hidden="true" />{t('visitor.visit.confirmedAt').replace('{when}', formatVisitTime(visit.confirmed_at, zone, locale, { dateStyle: 'medium', timeStyle: 'short' }))}
      </p>}
      <dl className="mt-5 grid divide-y divide-[var(--workspace-line)] border-t border-[var(--workspace-line)] sm:grid-cols-2 sm:divide-y-0">
        {staff && <Row icon={<LuUser />} label={t('booking.master')}>{staff}</Row>}
        {business.address && <Row icon={<LuMapPin />} label={t('visitor.visit.address')}>{business.address}</Row>}
        {business.phone && <Row icon={<LuPhone />} label={t('visitor.visit.phone')}><a href={`tel:${business.phone}`} className="text-[var(--workspace-accent)] hover:underline">{business.phone}</a></Row>}
        {business.email && <Row icon={<LuMail />} label={t('field.email')}><a href={`mailto:${business.email}`} className="text-[var(--workspace-accent)] hover:underline">{business.email}</a></Row>}
      </dl>
    </section>

    {visit.items.length > 0 && <section className="ui-card p-5 sm:p-7" aria-labelledby={`visit-${visit.id}-items`}>
      <h3 id={`visit-${visit.id}-items`} className="text-[17px] font-semibold tracking-[-0.02em]">{t('visitor.visit.services')}</h3>
      <ul className="mt-3 divide-y divide-[var(--workspace-line)]">
        {[...visit.items].sort((a, b) => a.position - b.position).map(item => <li key={item.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
          <div className="min-w-0">
            <p className="font-medium [overflow-wrap:anywhere]">{item.service_name ?? t('visitor.visit.noService')}</p>
            <p className="mt-0.5 text-[13px] text-[var(--workspace-muted)] tabular-nums">
              {formatClock(item.start, zone, locale)}–{formatClock(item.end, zone, locale)} · {item.duration_minutes} {t('services.min')}{item.staff_name ? ` · ${item.staff_name}` : ''}
            </p>
          </div>
          <Price price={item.price} className="font-semibold" />
        </li>)}
      </ul>
    </section>}

    <section className="ui-card flex flex-wrap items-center justify-between gap-3 p-5 sm:px-7">
      <span className="text-sm text-[var(--workspace-muted)]">{t('visitor.visit.price')}</span>
      <Price price={visit.price} className="font-display text-[22px] font-semibold tracking-[-0.02em]" />
    </section>

    <VisitActions visit={visit} />
  </div>
}

function VisitActions({ visit }: { visit: Visit }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const actions = useQuery({
    queryKey: visitorKey('actions', visit.id),
    retry: false,
    queryFn: async ({ signal }) => (await visitorApi.get<Actions>(`/visitor/visits/${visit.id}/actions`, { signal })).data,
  })
  const [busy, setBusy] = useState<Command | null>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'warning'; text: string } | null>(null)
  const [asking, setAsking] = useState<'cancel' | 'reschedule' | null>(null)
  const zone = safeTimeZone(visit.business.timezone) ?? browserTimeZone()
  const initial = isoToZonedWallTime(visit.start, zone)
  const [day, setDay] = useState(initial.day)
  const [time, setTime] = useState(initial.time)
  const [slotTaken, setSlotTaken] = useState(false)

  const refresh = () => {
    void client.invalidateQueries({ queryKey: visitorKey('visit', visit.id) })
    void client.invalidateQueries({ queryKey: visitorKey('actions', visit.id) })
    void client.invalidateQueries({ queryKey: visitorKey('visits') })
  }

  const run = async (command: Command, body?: unknown, retried = false): Promise<void> => {
    setBusy(command); setMessage(null); setSlotTaken(false)
    try {
      await visitorApi.post(`/visitor/visits/${visit.id}/${command}`, body)
      setAsking(null)
      setMessage({ tone: 'success', text: t(`visitor.action.${command}Done` as TranslationKey) })
      refresh()
    } catch (failure) {
      const status = apiErrorStatus(failure)
      const code = apiErrorCode(failure)
      // one quiet retry when the server was busy with another change of this visit
      if (status === 409 && code === 'visitor_action_retry' && !retried) return run(command, body, true)
      const text = apiErrorMessage(failure, t('visitor.action.failed'))
      if (status === 404) { setAsking(null); setMessage({ tone: 'warning', text: t('visitor.visit.gone') }); void client.invalidateQueries({ queryKey: visitorKey('visits') }) }
      else if (status === 409 && code === 'booking_reschedule_unavailable') { setSlotTaken(true); setMessage({ tone: 'error', text: t('visitor.action.slotTaken') }) }
      else if (status === 409 && code === 'booking_cancel_unavailable') { setAsking(null); setMessage({ tone: 'warning', text }) }
      else if (status === 409) { setAsking(null); setMessage({ tone: 'error', text }); void actions.refetch() }
      else setMessage({ tone: 'error', text })
    } finally {
      setBusy(null)
    }
  }

  const reschedule = (event: FormEvent) => {
    event.preventDefault()
    if (!day || !time) return
    void run('reschedule', { start: zonedWallTimeToIso(day, time, zone) })
  }

  const data = actions.data
  const hints = data ? [...new Set((['confirm', 'cancel', 'reschedule'] as const)
    .filter(name => !data[name].allowed).map(name => reasonHint(data[name].reason)).filter((key): key is TranslationKey => !!key))] : []
  const anyAllowed = !!data && (data.confirm.allowed || data.cancel.allowed || data.reschedule.allowed)

  return <section className="ui-card p-5 sm:p-7" aria-labelledby={`visit-${visit.id}-actions`}>
    <h3 id={`visit-${visit.id}-actions`} className="text-[17px] font-semibold tracking-[-0.02em]">{t('visitor.action.title')}</h3>
    {message && <Notice tone={message.tone} className="mt-4">{message.text}</Notice>}
    {actions.isPending ? <div className="py-4"><LoadingSpinner size="sm" /></div>
      : actions.isError ? <Notice tone="warning" className="mt-4">
        <p>{t('visitor.action.loadFailed')}</p>
        <Button variant="secondary" className="mt-3" onClick={() => void actions.refetch()}>{t('common.retry')}</Button>
      </Notice>
        : <>
          {anyAllowed && <div className="mt-4 flex flex-wrap gap-2">
            {data.confirm.allowed && <Button disabled={!!busy} onClick={() => void run('confirm')}><LuCircleCheck aria-hidden="true" />{t(busy === 'confirm' ? 'common.loading' : 'visitor.action.confirm')}</Button>}
            {data.reschedule.allowed && <Button variant="secondary" disabled={!!busy} onClick={() => { setMessage(null); setAsking('reschedule') }}><LuCalendarClock aria-hidden="true" />{t('visitor.action.reschedule')}</Button>}
            {data.cancel.allowed && <Button variant="danger" disabled={!!busy} onClick={() => { setMessage(null); setAsking('cancel') }}><LuX aria-hidden="true" />{t('visitor.action.cancel')}</Button>}
          </div>}
          {hints.length > 0 && <ul className="mt-4 space-y-1.5 text-sm text-[var(--workspace-muted)]">{hints.map(key => <li key={key}>{t(key)}</li>)}</ul>}
          {!anyAllowed && !hints.length && <p className="mt-3 text-sm text-[var(--workspace-muted)]">{t('visitor.reason.unavailable')}</p>}
        </>}

    {asking === 'cancel' && <Modal title={t('visitor.action.cancelTitle')} busy={busy === 'cancel'} onClose={() => setAsking(null)}>
      <div className="space-y-5 p-6">
        <p className="text-sm leading-relaxed text-[var(--workspace-muted)]">{t('visitor.action.cancelText')}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={busy === 'cancel'} onClick={() => setAsking(null)}>{t('visitor.action.keep')}</Button>
          <Button variant="danger" disabled={busy === 'cancel'} onClick={() => void run('cancel')}>{t(busy === 'cancel' ? 'common.loading' : 'visitor.action.cancel')}</Button>
        </div>
      </div>
    </Modal>}

    {asking === 'reschedule' && <Modal title={t('visitor.action.rescheduleTitle')} busy={busy === 'reschedule'} onClose={() => setAsking(null)}>
      <form onSubmit={reschedule} className="space-y-5 p-6">
        <p className="text-sm leading-relaxed text-[var(--workspace-muted)]">{t('visitor.action.rescheduleText').replace('{zone}', zone)}</p>
        {slotTaken && message && <Notice tone="error">{message.text}</Notice>}
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--workspace-muted)]">{t('visitor.action.day')}</span>
            <Input type="date" required value={day} onChange={event => setDay(event.target.value)} /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--workspace-muted)]">{t('visitor.action.time')}</span>
            <Input type="time" required step={300} value={time} onChange={event => setTime(event.target.value)} /></label>
        </div>
        <p className="text-xs text-[var(--workspace-muted)]">{t('visitor.action.priceKept')}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" disabled={busy === 'reschedule'} onClick={() => setAsking(null)}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={busy === 'reschedule' || !day || !time}>{t(busy === 'reschedule' ? 'common.loading' : 'visitor.action.rescheduleSubmit')}</Button>
        </div>
      </form>
    </Modal>}
  </section>
}
