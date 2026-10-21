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
  return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 dark:bg-gray-950"><div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-900">
    <h1 className="text-2xl font-semibold">Xtrix</h1>
    <p role="status" className="mt-4 text-gray-600 dark:text-gray-300">{t(feature === 'email' ? 'pilot.emailUnavailable' : 'pilot.unavailable')}</p>
    <Link to="/login" className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">{t('forgot.backToLogin')}</Link>
  </div></main>
}
