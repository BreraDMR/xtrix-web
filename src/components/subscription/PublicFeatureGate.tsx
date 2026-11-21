import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useOffers } from '../../hooks/useOffers'
import { useTranslation } from '../../hooks/useTranslation'
import LoadingSpinner from '../LoadingSpinner'
import QueryError from '../QueryError'

export default function PublicFeatureGate({ children, feature }: { children: ReactNode; feature: 'email' | 'payments' | 'forms' }) {
  const { t } = useTranslation()
  const catalog = useOffers()
  if (catalog.isLoading) return <LoadingSpinner />
  if (catalog.isError) return <QueryError retry={catalog.refetch} />
  if (!catalog.data) return null
  const unavailable = feature === 'email' ? !catalog.data.email_available : catalog.data.pilot_mode
  if (!unavailable) return <>{children}</>
  return <main className="flex min-h-screen items-center justify-center bg-[var(--workspace-fill)] px-5"><div className="w-full max-w-lg rounded-2xl border border-[var(--workspace-line)] bg-[var(--workspace-panel)] p-8">
    <h1 className="text-2xl font-semibold">Xtrix</h1>
    <p role="status" className="mt-4 text-[var(--workspace-muted)]">{t(feature === 'email' ? 'pilot.emailUnavailable' : 'pilot.unavailable')}</p>
    <Link to="/login" className="mt-6 inline-block ui-button ui-button-primary">{t('forgot.backToLogin')}</Link>
  </div></main>
}
