import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import EmployeeForm from '../EmployeeForm'
import api from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { useOnboarding, onboardingKey } from '../../hooks/useOnboarding'
import { useTranslation } from '../../hooks/useTranslation'

const dismissKey = (userId?: number | null) => `onboarding-team-prompt:${userId ?? 'anonymous'}`

function readDismissed(key: string) {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export default function StaffStep() {
  const { t } = useTranslation()
  const { data } = useOnboarding()
  const userId = useAuthStore((state) => state.user?.id)
  const queryClient = useQueryClient()
  const key = dismissKey(userId)
  const [dismissed, setDismissed] = useState(() => readDismissed(key))
  const [showForm, setShowForm] = useState(false)

  const staffStep = data?.steps.find((step) => step.key === 'staff')
  const { data: employees } = useQuery({
    queryKey: ['employees', true],
    queryFn: async () => {
      const { data } = await api.get('/employees/', { params: { is_active: true } })
      return Array.isArray(data) ? data : []
    },
    enabled: !!data && data.persona === 'owner',
  })

  if (!data || data.persona !== 'owner' || !staffStep?.completed || dismissed) return null
  if (!employees || employees.length > 0) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(key, '1')
    } catch {
      // the prompt simply comes back next time, setup is not blocked
    }
  }

  const handleSuccess = () => {
    setShowForm(false)
    dismiss()
    queryClient.invalidateQueries({ queryKey: ['employees'] })
    queryClient.invalidateQueries({ queryKey: onboardingKey(userId) })
  }

  return (
    <Card className="mb-5 p-5 sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">{t('onboarding.step.staff.title')}</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--workspace-muted)]">{t('onboarding.step.staff.body')}</p>
      {showForm ? (
        <div className="mt-5">
          <EmployeeForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowForm(true)}>{t('onboarding.step.staff.cta')}</Button>
          <Button variant="quiet" onClick={dismiss}>
            {t('onboarding.step.staff.workAlone')}
          </Button>
        </div>
      )}
    </Card>
  )
}
