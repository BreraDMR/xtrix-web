import { useState } from 'react'
import Button from '../../ui/Button'
import { apiErrorMessage } from '../../api/errors'
import { useOnboarding, useUpdateOnboarding } from '../../hooks/useOnboarding'
import { useTranslation } from '../../hooks/useTranslation'
import { useNativeDialog } from '../../hooks/useNativeDialog'
import type { TranslationKey } from '../../i18n/translations'

const STEPS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'onboarding.tour.dashboard', body: 'onboarding.tour.dashboardBody' },
  { title: 'onboarding.tour.clients', body: 'onboarding.tour.clientsBody' },
  { title: 'onboarding.tour.calendar', body: 'onboarding.tour.calendarBody' },
  { title: 'onboarding.tour.assistant', body: 'onboarding.tour.assistantBody' },
]

export default function ProductTour() {
  const { data } = useOnboarding()
  const update = useUpdateOnboarding()
  if (!data || !data.welcome_dismissed || data.tour_completed || data.tour_dismissed) return null
  return <TourDialog update={update} />
}

function TourDialog({ update }: { update: ReturnType<typeof useUpdateOnboarding> }) {
  const { t } = useTranslation()
  const [stepIndex, setStepIndex] = useState(0)
  const { dialog, isTopDialog } = useNativeDialog()

  const finish = () => {
    if (update.isPending) return
    update.mutate({ tour_completed: true })
  }

  const skip = () => {
    if (update.isPending) return
    update.mutate({ tour_dismissed: true })
  }

  const next = () => {
    if (stepIndex >= STEPS.length - 1) finish()
    else setStepIndex(stepIndex + 1)
  }

  const back = () => setStepIndex(Math.max(0, stepIndex - 1))

  const step = STEPS[stepIndex]
  const lastStep = stepIndex === STEPS.length - 1

  return (
      <dialog
        ref={dialog}
        onCancel={event => {
          event.preventDefault()
          event.stopPropagation()
          if (isTopDialog()) skip()
        }}
        onKeyDown={event => {
          if (!isTopDialog() || update.isPending) return
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            next()
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault()
            back()
          }
        }}
        aria-labelledby="onboarding-tour-title"
        tabIndex={-1}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border-0 bg-[var(--workspace-panel)] p-6 text-[var(--workspace-ink)] shadow-xl outline-none backdrop:bg-black/40"
      >
        <p className="text-xs uppercase tracking-wide text-[var(--workspace-muted)]">
          {t('onboarding.tour.title')} · {stepIndex + 1}/{STEPS.length}
        </p>
        <h2 id="onboarding-tour-title" className="mt-1 text-xl font-semibold tracking-tight">
          {t(step.title)}
        </h2>
        <p className="mt-2 text-sm text-[var(--workspace-muted)]">{t(step.body)}</p>

        {update.isError && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {apiErrorMessage(update.error, t('onboarding.error.save'))}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="quiet" onClick={skip} disabled={update.isPending}>
            {t('onboarding.tour.skip')}
          </Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="secondary" onClick={back} disabled={update.isPending}>
                {t('onboarding.tour.back')}
              </Button>
            )}
            <Button onClick={next} disabled={update.isPending}>
              {lastStep ? t('onboarding.tour.done') : t('onboarding.tour.next')}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={`h-1.5 w-6 rounded-full ${index === stepIndex ? 'bg-blue-600' : 'bg-[var(--workspace-border)]'}`}
            />
          ))}
        </div>
      </dialog>
  )
}
