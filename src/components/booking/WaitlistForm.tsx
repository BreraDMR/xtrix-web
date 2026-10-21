import { useState, type FormEvent } from 'react'

import api from '../../api/client'
import { apiErrorMessage } from '../../api/errors'
import FormError from '../FormError'
import { useTranslation } from '../../hooks/useTranslation'
import type { PublicServiceOut, WaitlistJoinIn, WaitlistJoinOut, WaitlistMessageOut } from '../../api/types'

type WaitlistFormProps = {
  slug: string
  service: PublicServiceOut
  staffId: number | null
  staffName: string | null
  timezone: string
  onBack: () => void
}

type TimePreference = WaitlistJoinIn['time_preference']

function salonDate(timeZone: string, offsetDays: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? '0')
  const date = new Date(Date.UTC(part('year'), part('month') - 1, part('day') + offsetDays))
  return date.toISOString().slice(0, 10)
}

export default function WaitlistForm({ slug, service, staffId, staffName, timezone, onBack }: WaitlistFormProps) {
  const { t } = useTranslation()
  const today = salonDate(timezone, 0)
  const lastDay = salonDate(timezone, 32)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateFrom, setDateFrom] = useState(salonDate(timezone, 0))
  const [dateTo, setDateTo] = useState(salonDate(timezone, 14))
  const [timePreference, setTimePreference] = useState<TimePreference>('any')
  const [processingConsent, setProcessingConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [result, setResult] = useState<WaitlistJoinOut | null>(null)
  const [leaveToken, setLeaveToken] = useState<string | null>(null)
  const [left, setLeft] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    if (!fullName.trim()) {
      setLocalError(t('booking.nameRequired'))
      return
    }
    if (!email.trim()) {
      setLocalError(t('booking.waitlist.emailRequired'))
      return
    }
    if (!processingConsent) {
      setLocalError(t('booking.processingConsentRequired'))
      return
    }
    if (!dateFrom || !dateTo || dateTo < dateFrom) {
      setLocalError(t('booking.waitlist.dateRange'))
      return
    }

    const payload: WaitlistJoinIn = {
      service_id: service.id,
      staff_id: staffId ?? undefined,
      preferred_date_from: dateFrom,
      preferred_date_to: dateTo,
      time_preference: timePreference,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      marketing_consent: marketingConsent,
      processing_consent: processingConsent,
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const { data } = await api.post<WaitlistJoinOut>(
        `/public/waitlist/${encodeURIComponent(slug)}/join`,
        payload,
      )
      setResult(data)
      setLeaveToken(data.manage_token ?? null)
    } catch (submitError) {
      setError(submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const leave = async () => {
    if (!leaveToken || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      await api.post<WaitlistMessageOut>('/public/waitlist/leave', null, {
        headers: { 'X-Waitlist-Token': leaveToken },
      })
      setLeft(true)
    } catch (leaveError) {
      setError(leaveError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (left) {
    return (
      <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-gray-600 dark:bg-gray-700">
        <h2 className="text-lg font-semibold">{t('booking.waitlist.leftTitle')}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">{t('booking.waitlist.leftText')}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white dark:border-gray-500 dark:hover:bg-gray-600"
        >
          {t('booking.back')}
        </button>
      </section>
    )
  }

  if (result) {
    return (
      <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950">
        <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
          {t('booking.waitlist.joinedTitle')}
        </h2>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">{t('booking.waitlist.joinedText')}</p>
        <p className="mt-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
          {t('booking.waitlist.notBooking')}
        </p>
        <FormError message={error ? apiErrorMessage(error, t('common.error')) : ''} />
        <div className="mt-4 flex flex-wrap gap-3">
          {leaveToken && (
            <button
              type="button"
              onClick={() => void leave()}
              disabled={isSubmitting}
              className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-900"
            >
              {t('booking.waitlist.leave')}
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {t('booking.back')}
          </button>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="mt-4">
      <h2 className="text-lg font-semibold">{t('booking.waitlist.title')}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">{t('booking.waitlist.notBooking')}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('booking.waitlist.explanation')}</p>

      <dl className="mt-4 grid gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm dark:bg-gray-700 sm:grid-cols-2">
        <div>
          <dt className="text-slate-500 dark:text-gray-400">{t('booking.service')}</dt>
          <dd className="font-medium">{service.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-gray-400">{t('booking.master')}</dt>
          <dd className="font-medium">{staffName || t('booking.anyMaster')}</dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">{t('clientForm.fullName')}</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            maxLength={200}
            autoComplete="name"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">{t('clients.email')}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={320}
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">{t('clients.phone')}</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={32}
            autoComplete="tel"
            placeholder="+420777123456"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">{t('booking.waitlist.timePreference')}</span>
          <select
            value={timePreference}
            onChange={(event) => setTimePreference(event.target.value as TimePreference)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="any">{t('booking.waitlist.timeAny')}</option>
            <option value="morning">{t('booking.waitlist.timeMorning')}</option>
            <option value="afternoon">{t('booking.waitlist.timeAfternoon')}</option>
            <option value="evening">{t('booking.waitlist.timeEvening')}</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">{t('booking.waitlist.dateFrom')}</span>
          <input
            required
            type="date"
            value={dateFrom}
            min={today}
            max={lastDay}
            onChange={(event) => {
              setDateFrom(event.target.value)
              if (dateTo && event.target.value > dateTo) setDateTo(event.target.value)
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">{t('booking.waitlist.dateTo')}</span>
          <input
            required
            type="date"
            value={dateTo}
            min={dateFrom || today}
            max={lastDay}
            onChange={(event) => setDateTo(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={processingConsent}
          onChange={(event) => setProcessingConsent(event.target.checked)}
          className="mt-0.5"
        />
        <span>{t('booking.waitlist.processingConsent')}</span>
      </label>
      <label className="mt-2 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={marketingConsent}
          onChange={(event) => setMarketingConsent(event.target.checked)}
          className="mt-0.5"
        />
        <span>{t('booking.marketingConsent')}</span>
      </label>

      {localError && (
        <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
          {localError}
        </p>
      )}
      <FormError message={error ? apiErrorMessage(error, t('common.error')) : ''} />

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? t('booking.submitting') : t('booking.waitlist.join')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {t('booking.waitlist.decline')}
        </button>
      </div>
    </form>
  )
}
