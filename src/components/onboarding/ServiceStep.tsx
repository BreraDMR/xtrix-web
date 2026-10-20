import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import ServiceForm from '../ServiceForm'
import { useAuthStore } from '../../store/authStore'
import { useOnboarding, onboardingKey } from '../../hooks/useOnboarding'
import { useTranslation } from '../../hooks/useTranslation'

export default function ServiceStep() {
  const { t } = useTranslation()
  const { data } = useOnboarding()
  const userId = useAuthStore((state) => state.user?.id)
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  if (!data || data.next_step !== 'service') return null

  const draftKey = `onboarding-service-draft:${userId ?? 'anonymous'}`

  const handleSuccess = () => {
    setShowForm(false)
    queryClient.invalidateQueries({ queryKey: ['services'] })
    queryClient.invalidateQueries({ queryKey: onboardingKey(userId) })
  }

  return (
    <Card className="mb-5 p-5 sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">{t('onboarding.step.service.title')}</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--workspace-muted)]">{t('onboarding.step.service.body')}</p>
      {showForm ? (
        <div className="mt-5">
          <ServiceForm
            draftKey={draftKey}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      ) : (
        <Button className="mt-4" onClick={() => setShowForm(true)}>
          {t('onboarding.step.service.cta')}
        </Button>
      )}
    </Card>
  )
}
