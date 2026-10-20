import { Link } from 'react-router-dom'
import { HiOutlineLightBulb } from 'react-icons/hi'
import Button from '../../ui/Button'
import { apiErrorMessage } from '../../api/errors'
import { useOnboarding, useUpdateOnboarding } from '../../hooks/useOnboarding'
import { useTranslation } from '../../hooks/useTranslation'
import type { OnboardingHintKey } from '../../api/types'
import type { TranslationKey } from '../../i18n/translations'

const COPY: Record<OnboardingHintKey, { title: TranslationKey; body: TranslationKey; cta: TranslationKey }> = {
  clients: {
    title: 'onboarding.hint.clients.title',
    body: 'onboarding.hint.clients.body',
    cta: 'onboarding.hint.clients.cta',
  },
  services: {
    title: 'onboarding.hint.services.title',
    body: 'onboarding.hint.services.body',
    cta: 'onboarding.hint.services.cta',
  },
  calendar: {
    title: 'onboarding.hint.calendar.title',
    body: 'onboarding.hint.calendar.body',
    cta: 'onboarding.hint.calendar.cta',
  },
}

interface ContextHintProps {
  hint: OnboardingHintKey
  onAction?: () => void
  to?: string
}

export default function ContextHint({ hint, onAction, to }: ContextHintProps) {
  const { t } = useTranslation()
  const { data } = useOnboarding()
  const update = useUpdateOnboarding()

  if (!data || data.dismissed_hints.includes(hint)) return null

  const copy = COPY[hint]
  const dismiss = () => update.mutate({ dismissed_hints: [...data.dismissed_hints, hint] })

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="flex min-w-0 items-start gap-3">
        <HiOutlineLightBulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-medium">{t(copy.title)}</p>
          <p className="mt-0.5 text-sm text-[var(--workspace-muted)]">{t(copy.body)}</p>
          {update.isError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{apiErrorMessage(update.error)}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:pl-3">
        {to && (
          <Link to={to} className="ui-button ui-button-primary">
            {t(copy.cta)}
          </Link>
        )}
        {!to && onAction && (
          <Button onClick={onAction}>{t(copy.cta)}</Button>
        )}
        <Button variant="quiet" onClick={dismiss} disabled={update.isPending}>
          {t('onboarding.hint.dismiss')}
        </Button>
      </div>
    </div>
  )
}
