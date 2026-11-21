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
      <p className="mt-1 text-sm text-[var(--workspace-muted)]">{t('booking.multiHint')}</p>
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
                  ? 'border-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)] ring-2 ring-[var(--x-lavender-border)]'
                  : 'border-[var(--workspace-line)] hover:border-[var(--workspace-focus)]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  {isSelected && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[image:var(--x-gradient)] text-xs font-semibold text-white">
                      {order + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{service.name}</p>
                    {service.description && (
                      <p className="mt-1 text-sm text-[var(--workspace-muted)]">{service.description}</p>
                    )}
                    <p className="mt-1 text-sm text-[var(--workspace-muted)]">
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

      <div className="mt-5 rounded-xl border border-[var(--workspace-line)] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{t('booking.selectedServices')}</p>
          {selected.length > 0 && (
            <span className="text-xs text-[var(--workspace-muted)]">
              {t('booking.selectedCount').replace('{n}', String(selected.length))}
            </span>
          )}
        </div>
        {selected.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--workspace-muted)]">{t('visits.selectService')}</p>
        ) : (
          <>
            <ol className="mt-2 space-y-1 text-sm">
              {selected.map((service, index) => (
                <li key={service.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="mr-2 text-[var(--workspace-subtle)]">{index + 1}.</span>
                    <span className="font-medium">{service.name}</span>
                    <span className="ml-1 text-[var(--workspace-muted)]">
                      ({service.duration_minutes} {t('services.min')})
                    </span>
                  </span>
                  <span className="shrink-0 text-[var(--workspace-muted)]">
                    {service.price === null || service.price === undefined
                      ? t('booking.priceOnRequest')
                      : formatCurrency(service.price, currency)}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-[var(--workspace-muted)]">{t('booking.chainForOneMaster')}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--workspace-line)] pt-3 text-sm">
              <span>
                <span className="text-[var(--workspace-muted)]">{t('booking.chainDuration')}: </span>
                <span className="font-medium">{totalMinutes} {t('services.min')}</span>
              </span>
              <span>
                <span className="text-[var(--workspace-muted)]">{t('booking.chainTotal')}: </span>
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
          className="mt-4 w-full ui-button ui-button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('booking.continue')}
        </button>
      </div>
    </div>
  )
}
