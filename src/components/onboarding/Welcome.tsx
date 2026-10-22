import { Link } from 'react-router-dom'
import Button from '../../ui/Button'
import Card from '../../ui/Card'
import { apiErrorMessage } from '../../api/errors'
import { useOnboarding, useUpdateOnboarding } from '../../hooks/useOnboarding'
import { useTranslation } from '../../hooks/useTranslation'
import type { OnboardingStepKey } from '../../api/types'

const STEP_ROUTE: Partial<Record<OnboardingStepKey, string>> = {
  business: '/app/business',
  service: '/app/services',
  staff: '/app/employees',
  schedule: '/app/schedules',
  booking: '/app/business',
}

export default function Welcome() {
  const { t } = useTranslation()
  const { data } = useOnboarding()
  const update = useUpdateOnboarding()

  if (!data || data.welcome_dismissed) return null

  const copy = data.persona === 'owner'
    ? { title: t('onboarding.welcome.ownerTitle'), body: t('onboarding.welcome.ownerBody') }
    : data.persona === 'solo'
      ? { title: t('onboarding.welcome.soloTitle'), body: t('onboarding.welcome.soloBody') }
      : { title: t('onboarding.welcome.staffTitle'), body: t('onboarding.welcome.staffBody') }
  const nextRoute = data.next_step ? STEP_ROUTE[data.next_step] : undefined
  const to = data.persona === 'staff' ? '/app/calendar' : nextRoute || '/app'
  const cta = data.persona === 'staff' || !nextRoute ? t('onboarding.welcome.open') : t('onboarding.welcome.start')

  return (
    <Card className="mb-5 overflow-hidden p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{copy.title}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--workspace-muted)]">{copy.body}</p>
          {update.isError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{apiErrorMessage(update.error, t('onboarding.error.save'))}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link to={to} className="ui-button ui-button-primary" onClick={() => update.mutate({ welcome_dismissed: true })}>
            {cta}
          </Link>
          <Button
            variant="quiet"
            onClick={() => update.mutate({ welcome_dismissed: true })}
            disabled={update.isPending}
          >
            {t('onboarding.welcome.later')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
