import { useTranslation } from '../../hooks/useTranslation'
import { apiErrorStatus, apiErrorMessage } from '../../api/errors'
import { formatCurrency, type Currency } from '../../utils/currency'
import { INTL_LOCALE } from './intl'
import type { ContactDetails } from './types'
import type { PublicServiceOut, PublicSlotOut } from '../../api/types'

type BookingSummaryProps = {
  services: PublicServiceOut[]
  staffName: string | null
  slot: PublicSlotOut
  timezone: string
  details: ContactDetails
  currency: Currency
  depositType: 'none' | 'fixed' | 'percentage'
  depositValue: number
  depositHoldMinutes: number
  isSubmitting: boolean
  error: unknown | null
  onConfirm: () => void
  onChooseAnotherTime: () => void
  onBack: () => void
}

export default function BookingSummary({
  services,
  staffName,
  slot,
  timezone,
  details,
  currency,
  depositType,
  depositValue,
  depositHoldMinutes,
  isSubmitting,
  error,
  onConfirm,
  onChooseAnotherTime,
  onBack,
}: BookingSummaryProps) {
  const { t, locale } = useTranslation()
  const dateTime = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(slot.start))
  const conflict = error ? apiErrorStatus(error) === 409 : false
  const message = error ? apiErrorMessage(error, t('common.loadError')) : null
  const totalMinutes = services.reduce((sum, service) => sum + service.duration_minutes, 0)
  const priceKnown = services.every((service) => service.price !== null && service.price !== undefined)
  const totalPrice = services.reduce((sum, service) => sum + (service.price ?? 0), 0)
  const deposit = !priceKnown || depositType === 'none'
    ? 0
    : depositType === 'fixed'
      ? Math.min(depositValue, totalPrice)
      : Math.round(totalPrice * depositValue) / 100
  const remaining = Math.round((totalPrice - deposit) * 100) / 100

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('booking.summary')}</h2>

      <dl className="mt-4 divide-y divide-[var(--workspace-line)] text-sm">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-[var(--workspace-muted)]">{t('booking.service')}</dt>
          {services.length > 1 ? (
            <dd className="text-right font-medium">
              <ol className="space-y-1">
                {services.map((service, index) => (
                  <li key={service.id}>
                    <span className="mr-1 text-[var(--workspace-subtle)]">{index + 1}.</span>
                    {service.name}
                  </li>
                ))}
              </ol>
            </dd>
          ) : (
            <dd className="text-right font-medium">{services[0]?.name}</dd>
          )}
        </div>
        {services.length > 1 && (
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.chainDuration')}</dt>
            <dd className="text-right font-medium">
              {totalMinutes} {t('services.min')}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-[var(--workspace-muted)]">{t('booking.price')}</dt>
          <dd className="text-right font-medium">
            {priceKnown ? formatCurrency(totalPrice, currency) : t('booking.priceOnRequest')}
          </dd>
        </div>
        {deposit > 0 && (
          <div className="py-3">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--workspace-muted)]">{t('booking.depositTermsTitle')}</dt>
              <dd className="text-right font-medium">{formatCurrency(deposit, currency)}</dd>
            </div>
            <p className="mt-1 text-right text-xs text-[var(--workspace-muted)]">
              {depositType === 'percentage'
                ? t('booking.depositPercent').replace('{n}', String(depositValue))
                : t('booking.depositFixed')}
              {' · '}
              {t('booking.remainingAmount')}: {formatCurrency(remaining, currency)}
            </p>
            <p className="mt-1 text-right text-xs text-[var(--workspace-muted)]">
              {t('booking.holdMinutes').replace('{n}', String(depositHoldMinutes))}
            </p>
          </div>
        )}
        {staffName && (
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-[var(--workspace-muted)]">{t('booking.master')}</dt>
            <dd className="text-right font-medium">{staffName}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-[var(--workspace-muted)]">{t('booking.dateTime')}</dt>
          <dd className="text-right font-medium">
            {dateTime}
            <span className="mt-1 block text-xs font-normal text-[var(--workspace-muted)]">{timezone}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-[var(--workspace-muted)]">{t('booking.contact')}</dt>
          <dd className="text-right font-medium">
            {details.fullName}
            <span className="mt-1 block text-xs font-normal text-[var(--workspace-muted)]">
              {details.phone || details.email}
            </span>
          </dd>
        </div>
      </dl>

      {message && (
        <div role="alert" className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--tint-amber-ink)_25%,transparent)] bg-[var(--tint-amber)] p-4 text-sm text-[var(--tint-amber-ink)]">
          <p>{message}</p>
          {conflict && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onChooseAnotherTime}
              className="mt-2 rounded-md border border-[color-mix(in_srgb,var(--tint-amber-ink)_25%,transparent)] px-3 py-1.5 font-medium hover:bg-[color-mix(in_srgb,var(--tint-amber-ink)_12%,var(--tint-amber))] disabled:opacity-60"
            >
              {t('booking.chooseAnotherTime')}
            </button>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="ui-button ui-button-secondary disabled:opacity-60"
        >
          {t('booking.back')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="ui-button ui-button-primary disabled:opacity-60"
        >
          {isSubmitting ? t('booking.submitting') : t('booking.confirm')}
        </button>
      </div>
    </div>
  )
}
