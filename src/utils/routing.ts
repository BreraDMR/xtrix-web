/**
 * Routing and URL helper utilities.
 */

export function sanitizeReturnTo(requestedPath: string | null | undefined, fallback = '/app'): string {
  if (!requestedPath) return fallback
  const trimmed = requestedPath.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback
  }
  // Disallow redirects to auth pages to prevent loops
  if (/^\/(login|register)([/?#]|$)/.test(trimmed)) {
    return fallback
  }
  return trimmed
}
