import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import type { Schema } from '../api/types'
import { HiOutlineClock, HiOutlineExclamationCircle } from 'react-icons/hi'

type Subscription = Schema<'SubscriptionOut'>

interface TrialStatus {
  is_trial_active: boolean
  is_trial: boolean
  trial_start: string | null
  trial_end: string | null
  has_access: boolean
}

export default function TrialBanner() {
  const { t } = useTranslation()

  const { data: subscription } = useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/subscriptions/me')
        return data
      } catch {
        return null
      }
    },
    staleTime: 60 * 1000,
  })

  const { data: trialStatus } = useQuery<TrialStatus>({
    queryKey: ['trial-status'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/trial/status')
      return data
    },
    staleTime: 60 * 1000,
  })

  // If user is paying for an active non-trial subscription, NEVER show trial banner
  if (subscription && !subscription.is_trial && subscription.status === 'active') {
    return null
  }

  if (!trialStatus || !trialStatus.is_trial) {
    return null
  }

  const getDaysRemaining = (endDate?: string | null) => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const daysRemaining = getDaysRemaining(trialStatus.trial_end)
  const isExpired = !trialStatus.is_trial_active || daysRemaining === 0

  if (isExpired) {
    return (
      <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <HiOutlineExclamationCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="text-sm font-medium">
              {t('trial.banner_expired')}
            </span>
          </div>
          <Link
            to="/app/subscription"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500"
          >
            {t('trial.banner_cta')}
          </Link>
        </div>
      </div>
    )
  }

  const dateStr = formatDate(trialStatus.trial_end)
  const activeMsg = t('trial.banner_active')
    .replace('{days}', String(daysRemaining))
    .replace('{date}', dateStr)

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <HiOutlineClock className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium">{activeMsg}</span>
        </div>
        <Link
          to="/app/subscription"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-500 dark:bg-amber-700 dark:hover:bg-amber-600"
        >
          {t('trial.banner_cta')}
        </Link>
      </div>
    </div>
  )
}
