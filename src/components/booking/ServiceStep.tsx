import { useTranslation } from '../../hooks/useTranslation'
import type { PublicServiceOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

type ServiceStepProps = {
  services: PublicServiceOut[]
  currency: Currency
  selectedId: number | null
  onSelect: (service: PublicServiceOut) => void
}

export default function ServiceStep({ services, currency, selectedId, onSelect }: ServiceStepProps) {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('booking.chooseService')}</h2>
      <div className="mt-4 space-y-3">
        {services.map((service) => {
          const selected = service.id === selectedId
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(service)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                selected
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100 dark:bg-primary-950 dark:ring-primary-900'
                  : 'border-slate-200 hover:border-primary-300 dark:border-gray-600 dark:hover:border-primary-500'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{service.name}</p>
                  {service.description && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{service.description}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
                    {service.duration_minutes} {t('services.min')}
                  </p>
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
    </div>
  )
}
