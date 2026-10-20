import { useEffect, useRef, useState } from 'react'
import Button from '../../ui/Button'
import { apiErrorMessage } from '../../api/errors'
import { useOnboarding, useUpdateOnboarding } from '../../hooks/useOnboarding'
import { useTranslation } from '../../hooks/useTranslation'
import type { TranslationKey } from '../../i18n/translations'

const STEPS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'onboarding.tour.dashboard', body: 'onboarding.tour.dashboardBody' },
  { title: 'onboarding.tour.clients', body: 'onboarding.tour.clientsBody' },
  { title: 'onboarding.tour.calendar', body: 'onboarding.tour.calendarBody' },
  { title: 'onboarding.tour.assistant', body: 'onboarding.tour.assistantBody' },
]

export default function ProductTour() {
  const { t } = useTranslation()
  const { data } = useOnboarding()
  const update = useUpdateOnboarding()
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data) return
    if (data.welcome_dismissed && !data.tour_completed && !data.tour_dismissed) {
      setOpen(true)
    }
  }, [data])

  useEffect(() => {
    if (open) dialogRef.current?.focus()
  }, [open])

  const finish = () => {
    if (update.isPending) return
    update.mutate({ tour_completed: true }, { onSuccess: () => setOpen(false) })
  }

  const skip = () => {
    if (update.isPending) return
    update.mutate({ tour_dismissed: true }, { onSuccess: () => setOpen(false) })
  }

  const next = () => {
    if (stepIndex >= STEPS.length - 1) finish()
    else setStepIndex(stepIndex + 1)
  }

  const back = () => setStepIndex(Math.max(0, stepIndex - 1))

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        skip()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        next()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        back()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!open || !data) return null

  const step = STEPS[stepIndex]
  const lastStep = stepIndex === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl outline-none dark:bg-gray-900"
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
            {apiErrorMessage(update.error)}
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
      </div>
    </div>
  )
}
