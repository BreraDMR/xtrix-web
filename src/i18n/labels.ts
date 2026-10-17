import { useTranslation } from '../hooks/useTranslation'
import type { TranslationKey } from './translations'

// The API sends codes (role, status, business_type, ...), never display labels -
// translating them is our job. An unknown code is shown as is.
const ROLE: Record<string, TranslationKey> = {
  admin: 'role.admin',
  business_owner: 'role.businessOwner',
  specialist: 'role.specialist',
  employee: 'role.employee',
  client: 'role.client',
}

const BUSINESS_TYPE: Record<string, TranslationKey> = {
  salon: 'businessType.salon',
  clinic: 'businessType.clinic',
  medical: 'businessType.medical',
  dental: 'businessType.dental',
  hospital: 'businessType.hospital',
  individual: 'businessType.individual',
  barbershop: 'businessType.barbershop',
  rehab_center: 'businessType.rehabCenter',
}

const VISIT_STATUS: Record<string, TranslationKey> = {
  planned: 'visits.planned',
  in_progress: 'visits.inProgress',
  completed: 'visits.completed',
  cancelled: 'visits.cancelled',
}

const SUBSCRIPTION_STATUS: Record<string, TranslationKey> = {
  active: 'subscription.status.active',
  pending_cancellation: 'subscription.pendingCancellation',
  cancelled: 'subscription.status.cancelled',
  expired: 'subscription.status.expired',
  past_due: 'subscription.status.past_due',
}

const TRANSACTION_STATUS: Record<string, TranslationKey> = {
  succeeded: 'subscription.transaction.succeeded',
  pending: 'subscription.transaction.pending',
  failed: 'subscription.transaction.failed',
  refunded: 'subscription.transaction.refunded',
}

export function useLabels() {
  const { t } = useTranslation()
  const pick = (map: Record<string, TranslationKey>) => (code?: string | null) =>
    code ? (map[code] ? t(map[code]) : code) : ''

  return {
    role: pick(ROLE),
    businessType: pick(BUSINESS_TYPE),
    visitStatus: pick(VISIT_STATUS),
    subscriptionStatus: pick(SUBSCRIPTION_STATUS),
    transactionStatus: pick(TRANSACTION_STATUS),
  }
}
