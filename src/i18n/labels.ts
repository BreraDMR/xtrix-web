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

const SPECIALIST_CATEGORY: Record<string, TranslationKey> = {
  beauty: 'category.beauty',
  wellness: 'category.wellness',
  healthcare: 'category.healthcare',
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

// product units: the API defaults to pcs, anything else may be free text from the user
export const UNIT_CODES = ['pcs', 'ml', 'l', 'g', 'kg', 'm', 'pack'] as const
const UNIT: Record<string, TranslationKey> = Object.fromEntries(UNIT_CODES.map(code => [code, `unit.${code}` as TranslationKey]))

const EXPENSE_CATEGORY: Record<string, TranslationKey> = {
  rent: 'expenseCategory.rent',
  salaries: 'expenseCategory.salaries',
  stock_purchase: 'expenseCategory.stock_purchase',
  marketing: 'expenseCategory.marketing',
  utilities: 'expenseCategory.utilities',
  subscriptions: 'expenseCategory.subscriptions',
  other: 'expenseCategory.other',
}

const EXPENSE_SOURCE: Record<string, TranslationKey> = {
  salary_payment: 'expenseSource.salary_payment',
}

const PLAN_CODES = [
  'admin_up_to_3_employees', 'admin_up_to_7_employees', 'admin_up_to_15_employees',
  'admin_unlimited_monthly', 'admin_unlimited_yearly', 'solo_basic', 'solo_pro',
]
const PLAN: Record<string, TranslationKey> = Object.fromEntries(PLAN_CODES.map(code => [code, `plan.${code}` as TranslationKey]))
const PLAN_FEATURES: Record<string, TranslationKey> = Object.fromEntries(PLAN_CODES.map(code => [code, `plan.features.${code}` as TranslationKey]))

type Named = { code?: string | null; name: string }

export function useLabels() {
  const { t } = useTranslation()
  const pick = (map: Record<string, TranslationKey>) => (code?: string | null) =>
    code ? (map[code] ? t(map[code]) : code) : ''

  return {
    role: pick(ROLE),
    businessType: pick(BUSINESS_TYPE),
    specialistCategory: pick(SPECIALIST_CATEGORY),
    visitStatus: pick(VISIT_STATUS),
    subscriptionStatus: pick(SUBSCRIPTION_STATUS),
    transactionStatus: pick(TRANSACTION_STATUS),
    unit: pick(UNIT),
    expenseSource: pick(EXPENSE_SOURCE),
    // system categories and plans carry a code, user-made ones only have their name
    expenseCategory: (category?: Named | null) =>
      category ? (category.code && EXPENSE_CATEGORY[category.code] ? t(EXPENSE_CATEGORY[category.code]) : category.name) : '',
    planName: (plan?: Named | null) =>
      plan ? (plan.code && PLAN[plan.code] ? t(PLAN[plan.code]) : plan.name) : '',
    planFeatures: (plan?: { code?: string | null; features?: string | null } | null) =>
      plan ? (plan.code && PLAN_FEATURES[plan.code] ? t(PLAN_FEATURES[plan.code]) : plan.features || '') : '',
  }
}
