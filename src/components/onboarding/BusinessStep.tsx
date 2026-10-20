import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import BusinessForm from '../BusinessForm'
import api from '../../api/client'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../hooks/useTranslation'

export default function BusinessStep() {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const handleSuccess = async () => {
    setShowForm(false)
    // a new business changes the stored user's business_id, so refresh it before
    // dropping every cached answer that was fetched without a business
    try {
      const { data } = await api.get('/users/me')
      const { token } = useAuthStore.getState()
      if (token) useAuthStore.getState().setAuth(token, data)
    } catch (error) {
      console.error('Failed to refresh the user after saving the business:', error)
    }
    queryClient.invalidateQueries()
  }

  return (
    <Card className="mb-5 p-5 sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">{t('onboarding.step.business.title')}</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-[var(--workspace-muted)]">{t('onboarding.step.business.body')}</p>
      {showForm ? (
        <div className="mt-5">
          <BusinessForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
        </div>
      ) : (
        <Button className="mt-4" onClick={() => setShowForm(true)}>
          {t('onboarding.step.business.cta')}
        </Button>
      )}
    </Card>
  )
}
