// visit status pills read the shared status tokens from theme.css (planned blue, in progress amber,
// completed green, cancelled red), so lists and calendar blocks always agree in both themes
export function visitStatusClass(status: string | null | undefined): string {
  switch (status) {
    case 'planned': return 'x-status x-status-planned'
    case 'in_progress': return 'x-status x-status-in-progress'
    case 'completed': return 'x-status x-status-completed'
    default: return 'x-status x-status-cancelled'
  }
}

// a sign next to the colour, so a status reads without colour too (calendar, client card, visit list)
export const VISIT_STATUS_MARK: Record<string, string> = { planned: '○', in_progress: '◐', completed: '✓', cancelled: '✕' }
export function visitStatusMark(status: string | null | undefined): string {
  return VISIT_STATUS_MARK[status ?? ''] ?? ''
}
