import { useState, type FormEvent } from 'react'

import { useTranslation } from '../../hooks/useTranslation'
import FormError from '../FormError'
import FormField from '../FormField'
import type { ContactDetails } from './types'

type ContactStepProps = {
  value: ContactDetails
  onChange: (value: ContactDetails) => void
  onSubmit: () => void
  onBack: () => void
}

type ContactErrors = {
  name?: string
  contact?: string
  email?: string
  phone?: string
  processing?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isPhoneValid = (phone: string) => {
  const clean = phone.replace(/[\s\-().]/g, '')
  return /^\+[1-9]\d{1,14}$/.test(clean) && clean.length >= 8 && clean.length <= 16
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700'

export default function ContactStep({ value, onChange, onSubmit, onBack }: ContactStepProps) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState<ContactErrors>({})

  const update = (patch: Partial<ContactDetails>) => {
    onChange({ ...value, ...patch })
    setErrors({})
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fullName = value.fullName.trim()
    const phone = value.phone.trim()
    const email = value.email.trim()
    const next: ContactErrors = {}

    if (!fullName) next.name = t('booking.nameRequired')
    if (!phone && !email) next.contact = t('booking.contactRequired')
    else if (phone && email) next.contact = t('booking.contactOnlyOne')
    else if (email && !EMAIL_PATTERN.test(email)) next.email = t('booking.invalidEmail')
    else if (phone && !isPhoneValid(phone)) {
      next.phone = t('booking.invalidPhone')
    }
    if (!value.processingConsent) next.processing = t('booking.processingConsentRequired')

    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    onChange({ ...value, fullName, phone, email })
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="text-lg font-semibold">{t('booking.yourDetails')}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('booking.contactHint')}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField label={t('field.full_name')} required error={errors.name} className="sm:col-span-2">
          <input
            name="full_name"
            value={value.fullName}
            onChange={(event) => update({ fullName: event.target.value })}
            autoComplete="name"
            maxLength={255}
            className={inputClass}
          />
        </FormField>
        <FormField label={t('field.phone')} error={errors.phone} hint={t('booking.phoneHint')}>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            value={value.phone}
            onChange={(event) => update({ phone: event.target.value })}
            autoComplete="tel"
            maxLength={50}
            className={inputClass}
          />
        </FormField>
        <FormField label={t('field.email')} error={errors.email}>
          <input
            name="email"
            type="email"
            inputMode="email"
            value={value.email}
            onChange={(event) => update({ email: event.target.value })}
            autoComplete="email"
            className={inputClass}
          />
        </FormField>
      </div>
      {errors.contact && <FormError message={errors.contact} />}

      <div className="mt-5 space-y-3">
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.processingConsent}
              onChange={(event) => update({ processingConsent: event.target.checked })}
              className="mt-1"
            />
            <span>{t('booking.processingConsent')}</span>
          </label>
          {errors.processing && <FormError message={errors.processing} />}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.marketingConsent}
            onChange={(event) => update({ marketingConsent: event.target.checked })}
            className="mt-1"
          />
          <span>{t('booking.marketingConsent')}</span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {t('booking.back')}
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {t('booking.continue')}
        </button>
      </div>
    </form>
  )
}
