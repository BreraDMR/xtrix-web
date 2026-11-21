import { useTranslation } from '../../hooks/useTranslation'
import LoadingSpinner from '../LoadingSpinner'
import type { PublicStaffOut } from '../../api/types'

type StaffStepProps = {
  staff: PublicStaffOut[]
  isLoading: boolean
  isError: boolean
  onRetry: () => unknown
  onSelect: (staffId: number | null) => void
  onBack: () => void
}

export default function StaffStep({
  staff,
  isLoading,
  isError,
  onRetry,
  onSelect,
  onBack,
}: StaffStepProps) {
  const { t } = useTranslation()

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('booking.chooseMaster')}</h2>

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
      ) : staff.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--workspace-muted)]">{t('booking.noStaff')}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="w-full rounded-xl border border-[var(--x-lavender-border)] bg-[var(--workspace-accent-soft)] p-4 text-left font-medium text-[var(--workspace-accent)] transition hover:border-[var(--workspace-focus)]"
          >
            {t('booking.anyMaster')}
          </button>
          {staff.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelect(person.id)}
              className="w-full rounded-xl border border-[var(--workspace-line)] p-4 text-left transition hover:border-[var(--workspace-focus)]"
            >
              <p className="font-medium">{person.full_name}</p>
              {person.position && (
                <p className="mt-1 text-sm text-[var(--workspace-muted)]">{person.position}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-5 ui-button ui-button-secondary"
      >
        {t('booking.back')}
      </button>
    </div>
  )
}
