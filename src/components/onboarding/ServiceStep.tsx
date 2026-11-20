import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import ServiceForm from '../ServiceForm'
import { useAuthStore } from '../../store/authStore'
import { useOnboarding, onboardingKey } from '../../hooks/useOnboarding'
import { useWorkspaceAccessContext } from '../../hooks/useWorkspaceAccess'
import { useTranslation } from '../../hooks/useTranslation'

export default function ServiceStep() {
  const { t } = useTranslation()
  const { data } = useOnboarding()
  const userId = useAuthStore((state) => state.user?.id)
  const queryClient = useQueryClient()
  const access = useWorkspaceAccessContext()
  const [showForm, setShowForm] = useState(false)

  // read-only and blocked salons can't save a service anyway, and while the welcome
  // card is up it already sends the owner to this very step - one prompt is enough
  const canEdit = !access || access.crm_mode === 'full'
  if (!data || data.next_step !== 'service' || !canEdit || !data.welcome_dismissed) return null

  const draftKey = `onboarding-service-draft:${userId ?? 'anonymous'}`

  const handleSuccess = () => {
    setShowForm(false)
    queryClient.invalidateQueries({ queryKey: ['services'] })
    queryClient.invalidateQueries({ queryKey: onboardingKey(userId) })
  }

  return (
    <Card className="mb-5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{t('onboarding.step.service.title')}</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--workspace-muted)]">{t('onboarding.step.service.body')}</p>
        </div>
        {!showForm && <Button className="shrink-0 self-start sm:self-center" onClick={() => setShowForm(true)}>
          {t('onboarding.step.service.cta')}
        </Button>}
      </div>
      {showForm && (
        <div className="mt-4">
          <ServiceForm
            draftKey={draftKey}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </Card>
  )
}
