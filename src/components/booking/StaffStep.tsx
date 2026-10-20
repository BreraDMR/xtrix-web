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
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <p>{t('common.loadError')}</p>
          <button
            type="button"
            onClick={() => void onRetry()}
            className="mt-2 rounded-md border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : staff.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">{t('booking.noStaff')}</p>
      ) : (
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="w-full rounded-xl border border-primary-200 bg-primary-50 p-4 text-left font-medium text-primary-800 transition hover:border-primary-400 dark:border-primary-800 dark:bg-primary-950 dark:text-primary-200 dark:hover:border-primary-600"
          >
            {t('booking.anyMaster')}
          </button>
          {staff.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelect(person.id)}
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-primary-300 dark:border-gray-600 dark:hover:border-primary-500"
            >
              <p className="font-medium">{person.full_name}</p>
              {person.position && (
                <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">{person.position}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
      >
        {t('booking.back')}
      </button>
    </div>
  )
}
