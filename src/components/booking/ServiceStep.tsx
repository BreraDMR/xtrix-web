import { useState } from 'react'
import { LuChevronDown } from 'react-icons/lu'

import { useTranslation } from '../../hooks/useTranslation'
import { useLabels } from '../../i18n/labels'
import type { PublicServiceOut } from '../../api/types'
import { formatCurrency, type Currency } from '../../utils/currency'

// services the salon didn't put in any group
const OTHER = ''

type ServiceGroup = { key: string; index: number; services: PublicServiceOut[] }

// groups keep the salon's order: first time a category shows up, its block goes there; "Other" is last
function groupByCategory(services: PublicServiceOut[]): ServiceGroup[] {
  const groups = new Map<string, PublicServiceOut[]>()
  for (const service of services) {
    const key = service.category?.trim() ?? OTHER
    groups.set(key, [...(groups.get(key) ?? []), service])
  }
  const keys = [...groups.keys()].filter((key) => key !== OTHER)
  if (groups.has(OTHER)) keys.push(OTHER)
  return keys.map((key, index) => ({ key, index, services: groups.get(key) ?? [] }))
}

type ServiceStepProps = {
  services: PublicServiceOut[]
  currency: Currency
  selectedIds: number[]
  onToggle: (service: PublicServiceOut) => void
  onContinue: () => void
}

export default function ServiceStep({ services, currency, selectedIds, onToggle, onContinue }: ServiceStepProps) {
  const { t } = useTranslation()
  const labels = useLabels()
  const groups = groupByCategory(services)
  // blocks start closed, except where something is already picked (a ?service= link, or coming back)
  const [openKeys, setOpenKeys] = useState<string[]>(() =>
    groups.filter((group) => group.services.some((service) => selectedIds.includes(service.id))).map((group) => group.key),
  )
  const toggleGroup = (key: string) =>
    setOpenKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]))
  const selected = selectedIds
    .map((id) => services.find((service) => service.id === id))
    .filter((service): service is PublicServiceOut => Boolean(service))
  const totalMinutes = selected.reduce((sum, service) => sum + service.duration_minutes, 0)
  const priceKnown = selected.every((service) => service.price !== null && service.price !== undefined)
  const totalPrice = selected.reduce((sum, service) => sum + (service.price ?? 0), 0)

  const renderService = (service: PublicServiceOut) => {
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
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('booking.chooseService')}</h2>
      <p className="mt-1 text-sm text-[var(--workspace-muted)]">{t('booking.multiHint')}</p>
      {groups.length > 1 || groups[0]?.key !== OTHER ? (
        <div className="mt-4 space-y-3">
          {groups.map((group) => {
            const open = openKeys.includes(group.key)
            const picked = group.services.filter((service) => selectedIds.includes(service.id)).length
            const panelId = `booking-category-${group.index}`
            return (
              <section key={group.key} className="rounded-xl border border-[var(--workspace-line)]">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left transition hover:bg-[var(--workspace-fill)]"
                >
                  <span className="min-w-0 font-semibold [overflow-wrap:anywhere]">
                    {group.key === OTHER ? t('booking.otherCategory') : labels.specialistCategory(group.key)}
                    <span className="ml-2 text-sm font-normal text-[var(--workspace-muted)]">{group.services.length}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {picked > 0 && (
                      <span className="rounded-full bg-[var(--workspace-accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--workspace-accent)]">
                        {t('booking.categorySelected').replace('{n}', String(picked))}
                      </span>
                    )}
                    <LuChevronDown aria-hidden className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {open && (
                  <div id={panelId} className="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4">
                    {group.services.map(renderService)}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 space-y-3">{services.map(renderService)}</div>
      )}

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
