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

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('booking.summary')}</h2>

      <dl className="mt-4 divide-y divide-slate-100 text-sm dark:divide-gray-700">
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-slate-500 dark:text-gray-400">{t('booking.service')}</dt>
          {services.length > 1 ? (
            <dd className="text-right font-medium">
              <ol className="space-y-1">
                {services.map((service, index) => (
                  <li key={service.id}>
                    <span className="mr-1 text-slate-400">{index + 1}.</span>
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
            <dt className="text-slate-500 dark:text-gray-400">{t('booking.chainDuration')}</dt>
            <dd className="text-right font-medium">
              {totalMinutes} {t('services.min')}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-slate-500 dark:text-gray-400">{t('booking.price')}</dt>
          <dd className="text-right font-medium">
            {priceKnown ? formatCurrency(totalPrice, currency) : t('booking.priceOnRequest')}
          </dd>
        </div>
        {staffName && (
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500 dark:text-gray-400">{t('booking.master')}</dt>
            <dd className="text-right font-medium">{staffName}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-slate-500 dark:text-gray-400">{t('booking.dateTime')}</dt>
          <dd className="text-right font-medium">
            {dateTime}
            <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-gray-400">{timezone}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-slate-500 dark:text-gray-400">{t('booking.contact')}</dt>
          <dd className="text-right font-medium">
            {details.fullName}
            <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-gray-400">
              {details.phone || details.email}
            </span>
          </dd>
        </div>
      </dl>

      {message && (
        <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <p>{message}</p>
          {conflict && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onChooseAnotherTime}
              className="mt-2 rounded-md border border-amber-300 px-3 py-1.5 font-medium hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:hover:bg-amber-900"
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
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {t('booking.back')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {isSubmitting ? t('booking.submitting') : t('booking.confirm')}
        </button>
      </div>
    </div>
  )
}
