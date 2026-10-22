import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { HiCheckCircle, HiOutlineArrowRight } from 'react-icons/hi'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import { apiErrorMessage } from '../../api/errors'
import { useOnboarding, useUpdateOnboarding } from '../../hooks/useOnboarding'
import { useTranslation } from '../../hooks/useTranslation'
import type { OnboardingStepKey } from '../../api/types'
import type { TranslationKey } from '../../i18n/translations'

const STEP_ROUTE: Partial<Record<OnboardingStepKey, string>> = {
  business: '/app/business',
  service: '/app/services',
  staff: '/app/employees',
  schedule: '/app/schedules',
  booking: '/app/business',
}

const STEP_COPY: Record<OnboardingStepKey, { title: TranslationKey; cta: TranslationKey }> = {
  business: { title: 'onboarding.step.business.title', cta: 'onboarding.step.business.cta' },
  service: { title: 'onboarding.step.service.title', cta: 'onboarding.step.service.cta' },
  staff: { title: 'onboarding.step.staff.title', cta: 'onboarding.step.staff.cta' },
  schedule: { title: 'onboarding.step.schedule.title', cta: 'onboarding.step.schedule.cta' },
  booking: { title: 'onboarding.step.booking.title', cta: 'onboarding.step.booking.cta' },
}

export default function Checklist() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const stepsId = useId()
  const { data } = useOnboarding()
  const update = useUpdateOnboarding()

  if (!data || data.persona === 'staff' || data.checklist_dismissed || !data.welcome_dismissed) return null

  const steps = data.steps.filter((step) => step.available)
  if (steps.length === 0 || data.completed_steps >= data.total_steps) return null
  const next = steps.find(step => step.key === data.next_step) || steps.find(step => !step.completed)
  const visibleSteps = expanded || !next ? steps : [next]

  return (
    <Card className="mb-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{t('onboarding.checklist.title')}</h2>
          <p className="mt-1 text-xs text-[var(--workspace-muted)]">{t('onboarding.checklist.description')}</p>
        </div>
        <Button
          variant="quiet"
          onClick={() => update.mutate({ checklist_dismissed: true })}
          disabled={update.isPending}
        >
          {t('onboarding.checklist.hide')}
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--workspace-border)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={data.total_steps}
          aria-valuenow={data.completed_steps}
          aria-label={t('onboarding.checklist.progressLabel')}
        >
          <div className="h-full rounded-full bg-[var(--workspace-accent)] transition-all" style={{ width: `${data.progress_percent}%` }} />
        </div>
        <span className="text-sm tabular-nums text-[var(--workspace-muted)]">
          {data.completed_steps}/{data.total_steps}
        </span>
      </div>

      <ol id={stepsId} className="mt-3 space-y-2">
        {visibleSteps.map((step) => {
          const route = STEP_ROUTE[step.key]
          const isNext = !step.completed && step.key === data.next_step
          return (
            <li
              key={step.key}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                isNext
                  ? 'border-[var(--workspace-line)] bg-[var(--workspace-bg)]'
                  : 'border-[var(--workspace-border)]'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {step.completed ? (
                  <HiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border border-[var(--workspace-border)]" aria-hidden="true" />
                )}
                <span className={`break-words text-sm ${step.completed ? 'text-[var(--workspace-muted)] line-through' : 'font-medium'}`}>
                  {step.key === 'staff' && data.persona === 'solo'
                    ? t('onboarding.step.staff.soloTitle')
                    : t(STEP_COPY[step.key].title)}
                </span>
                {isNext && expanded && (
                  <span className="shrink-0 rounded-full bg-[var(--workspace-accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--workspace-accent)]">
                    {t('onboarding.checklist.next')}
                  </span>
                )}
              </div>
              {!step.completed && route && (
                <Link
                  to={route}
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-[var(--workspace-accent)] hover:underline"
                >
                  {t(STEP_COPY[step.key].cta)}
                  <HiOutlineArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              {!step.completed && !route && (
                <span className="shrink-0 text-xs text-[var(--workspace-muted)]">
                  {t('onboarding.checklist.locked')}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {steps.length > 1 && <button type="button" aria-expanded={expanded} aria-controls={stepsId}
        onClick={() => setExpanded(value => !value)}
        className="mt-2 min-h-8 text-xs font-medium text-[var(--workspace-accent)] hover:underline">
        {t(expanded ? 'onboarding.checklist.collapse' : 'onboarding.checklist.expand')}
      </button>}

      {update.isError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{apiErrorMessage(update.error, t('onboarding.error.save'))}</p>
      )}
    </Card>
  )
}
