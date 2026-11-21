import { useEffect, useState } from 'react'

import { useTranslation } from '../../hooks/useTranslation'
import LoadingSpinner from '../LoadingSpinner'
import { INTL_LOCALE } from './intl'
import type { PublicDaySlotsOut, PublicSlotOut } from '../../api/types'

type TimeStepProps = {
  days: PublicDaySlotsOut[]
  timezone: string
  selectedStart: string | null
  isLoading: boolean
  isError: boolean
  onRetry: () => unknown
  onSelect: (slot: PublicSlotOut) => void
  onWaitlist?: () => void
  onBack: () => void
}

const dayAsUtc = (day: string) => new Date(`${day}T00:00:00Z`)

export default function TimeStep({
  days,
  timezone,
  selectedStart,
  isLoading,
  isError,
  onRetry,
  onSelect,
  onWaitlist,
  onBack,
}: TimeStepProps) {
  const { t, locale } = useTranslation()
  const intlLocale = INTL_LOCALE[locale]
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    setSelectedDay((current) => {
      const currentDay = days.find((day) => day.date === current)
      if (currentDay && currentDay.slots.length > 0) return current
      const slotDay = selectedStart
        ? days.find((day) => day.slots.some((slot) => slot.start === selectedStart))?.date
        : undefined
      if (slotDay) return slotDay
      return days.find((day) => day.slots.length > 0)?.date ?? days[0]?.date ?? null
    })
  }, [days, selectedStart])

  const weekdayFormatter = new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone: 'UTC' })
  const dateFormatter = new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const timeFormatter = new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  })

  const activeDay = days.find((day) => day.date === selectedDay)
  const hasSlots = days.some((day) => day.slots.length > 0)

  const back = (
    <button
      type="button"
      onClick={onBack}
      className="mt-5 ui-button ui-button-secondary"
    >
      {t('booking.back')}
    </button>
  )

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('booking.chooseTime')}</h2>
      <p className="mt-1 text-sm text-[var(--workspace-muted)]">
        {t('booking.timezone')}: <span className="font-medium">{timezone}</span>
      </p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : isError ? (
        <div role="alert" className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] bg-[var(--tint-red)] p-4 text-sm text-[var(--tint-red-ink)]">
          <p>{t('common.loadError')}</p>
          <button
            type="button"
            onClick={() => void onRetry()}
            className="mt-2 rounded-md border border-[color-mix(in_srgb,var(--tint-red-ink)_25%,transparent)] px-3 py-1.5 font-medium hover:bg-[color-mix(in_srgb,var(--tint-red-ink)_12%,var(--tint-red))]"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : !hasSlots ? (
        <div className="mt-4 rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-fill)] p-4">
          <p className="text-sm text-[var(--workspace-muted)]">{t('booking.noSlots')}</p>
          {onWaitlist && (
            <>
              <p className="mt-1 text-sm text-[var(--workspace-muted)]">{t('booking.waitlist.noSlotsHint')}</p>
              <button
                type="button"
                onClick={onWaitlist}
                className="mt-3 ui-button ui-button-primary"
              >
                {t('booking.waitlist.cta')}
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-2">
            {days.map((day) => {
              const empty = day.slots.length === 0
              const active = day.date === selectedDay
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={empty}
                  aria-pressed={active}
                  onClick={() => setSelectedDay(day.date)}
                  className={`min-w-[5.5rem] shrink-0 rounded-xl border px-3 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? 'border-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]'
                      : 'border-[var(--workspace-line)] hover:border-[var(--workspace-focus)]'
                  }`}
                >
                  <span className="block text-xs uppercase text-[var(--workspace-muted)]">
                    {weekdayFormatter.format(dayAsUtc(day.date))}
                  </span>
                  <span className="block text-sm font-medium">{dateFormatter.format(dayAsUtc(day.date))}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {activeDay?.slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                aria-pressed={slot.start === selectedStart}
                onClick={() => onSelect(slot)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  slot.start === selectedStart
                    ? 'border-[var(--workspace-accent)] bg-[image:var(--x-gradient)] text-white'
                    : 'border-[var(--workspace-line)] hover:border-[var(--workspace-focus)] hover:bg-[var(--workspace-accent-soft)]'
                }`}
              >
                {timeFormatter.format(new Date(slot.start))}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--workspace-muted)]">{t('booking.onlyFreeTimes')}</p>
        </>
      )}

      {back}
    </div>
  )
}
