import { useTranslation } from '../../hooks/useTranslation'
import type { PublicServiceOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

type ServiceStepProps = {
  services: PublicServiceOut[]
  currency: Currency
  selectedIds: number[]
  onToggle: (service: PublicServiceOut) => void
  onContinue: () => void
}

export default function ServiceStep({ services, currency, selectedIds, onToggle, onContinue }: ServiceStepProps) {
  const { t } = useTranslation()
  const selected = selectedIds
    .map((id) => services.find((service) => service.id === id))
    .filter((service): service is PublicServiceOut => Boolean(service))
  const totalMinutes = selected.reduce((sum, service) => sum + service.duration_minutes, 0)
  const priceKnown = selected.every((service) => service.price !== null && service.price !== undefined)
  const totalPrice = selected.reduce((sum, service) => sum + (service.price ?? 0), 0)

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('booking.chooseService')}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{t('booking.multiHint')}</p>
      <div className="mt-4 space-y-3">
        {services.map((service) => {
          const order = selectedIds.indexOf(service.id)
          const isSelected = order >= 0
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(service)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100 dark:bg-primary-950 dark:ring-primary-900'
                  : 'border-slate-200 hover:border-primary-300 dark:border-gray-600 dark:hover:border-primary-500'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  {isSelected && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                      {order + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{service.name}</p>
                    {service.description && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{service.description}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                      {service.duration_minutes} {t('services.min')}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-right font-semibold">
                  {service.price === null || service.price === undefined
                    ? t('booking.priceOnRequest')
                    : formatCurrency(service.price, currency)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-gray-600">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{t('booking.selectedServices')}</p>
          {selected.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-gray-400">
              {t('booking.selectedCount').replace('{n}', String(selected.length))}
            </span>
          )}
        </div>
        {selected.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">{t('visits.selectService')}</p>
        ) : (
          <>
            <ol className="mt-2 space-y-1 text-sm">
              {selected.map((service, index) => (
                <li key={service.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="mr-2 text-slate-400">{index + 1}.</span>
                    <span className="font-medium">{service.name}</span>
                    <span className="ml-1 text-slate-500 dark:text-gray-400">
                      ({service.duration_minutes} {t('services.min')})
                    </span>
                  </span>
                  <span className="shrink-0 text-slate-600 dark:text-gray-300">
                    {service.price === null || service.price === undefined
                      ? t('booking.priceOnRequest')
                      : formatCurrency(service.price, currency)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">{t('booking.chainForOneMaster')}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm dark:border-gray-700">
              <span>
                <span className="text-slate-500 dark:text-gray-400">{t('booking.chainDuration')}: </span>
                <span className="font-medium">{totalMinutes} {t('services.min')}</span>
              </span>
              <span>
                <span className="text-slate-500 dark:text-gray-400">{t('booking.chainTotal')}: </span>
                <span className="font-semibold">
                  {priceKnown ? formatCurrency(totalPrice, currency) : t('booking.priceOnRequest')}
                </span>
              </span>
            </div>
          </>
        )}
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={onContinue}
          className="mt-4 w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('booking.continue')}
        </button>
      </div>
    </div>
  )
}
