const LEGACY_CRM_ROUTES = [
  '/clients',
  '/visits',
  '/calendar',
  '/services',
  '/profile',
  '/employees',
  '/my-salary',
  '/business',
  '/inventory',
  '/finance',
  '/analytics',
  '/loyalty',
  '/subscription',
  '/settings',
]

function hasControls(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0)
    if (code < 32 || code === 127) return true
  }
  return false
}

/**
 * Sanitizes and normalizes returnTo query parameters.
 * - Disallows external domains, protocol-relative URLs, backslashes, and auth loops.
 * - Maps legacy CRM paths (e.g. /subscription?session_id=...) to their /app/... equivalents.
 */
export function sanitizeReturnTo(requestedPath: string | null | undefined, fallback = '/app'): string {
  if (!requestedPath) return fallback
  // Reject controls before URL parsing, which silently strips tabs and line breaks.
  if (hasControls(requestedPath)) return fallback
  const trimmed = requestedPath.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) return fallback

  let canonical: string
  try {
    const base = 'https://xtrix.invalid'
    const parsed = new URL(trimmed, base)
    const path = decodeURIComponent(parsed.pathname)
    if (parsed.origin !== base || path.startsWith('//') || path.includes('\\')
      || hasControls(path)
      || /^\/(login|register)([/?#]|$)/i.test(path)) return fallback
    canonical = parsed.pathname + parsed.search + parsed.hash
  } catch {
    return fallback
  }

  // Normalize legacy root CRM paths to /app/...
  for (const legacyPath of LEGACY_CRM_ROUTES) {
    if (canonical === legacyPath || canonical.startsWith(`${legacyPath}/`) || canonical.startsWith(`${legacyPath}?`) || canonical.startsWith(`${legacyPath}#`)) {
      return `/app${canonical}`
    }
  }

  return canonical
}
