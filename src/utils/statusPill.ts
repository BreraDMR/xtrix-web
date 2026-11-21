import type { StatusTone } from '../ui/StatusBadge'

// visit statuses on the shared status tokens (planned blue, in progress amber, completed green,
// cancelled red), so lists, the client card, the public pages and calendar blocks always agree
export const VISIT_STATUS_TONE: Record<string, StatusTone> = {
  planned: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
}
// an unknown status shows as cancelled in the CRM lists, as it always did
export function visitStatusTone(status: string | null | undefined): StatusTone {
  return VISIT_STATUS_TONE[status ?? ''] ?? 'danger'
}

// a sign next to the colour, so a status reads without colour too (calendar, client card, visit list)
export const VISIT_STATUS_MARK: Record<string, string> = { planned: '○', in_progress: '◐', completed: '✓', cancelled: '✕' }
export function visitStatusMark(status: string | null | undefined): string {
  return VISIT_STATUS_MARK[status ?? ''] ?? ''
}

// salary pages (owner and staff view share these)
export function salaryStatusTone(status: string): StatusTone {
  return status === 'paid' ? 'success' : status === 'partial' ? 'warning' : status === 'unpaid' ? 'danger' : 'neutral'
}
export function paymentMethodTone(method: string): StatusTone {
  return method === 'cash' ? 'success' : method === 'card' || method === 'transfer' ? 'accent' : 'neutral'
}
export function salaryPaymentTone(status: string): StatusTone {
  return status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'danger'
}
