import { useLocation, useParams, Navigate } from 'react-router-dom'

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

/**
 * Sanitizes and normalizes returnTo query parameters.
 * - Disallows external domains, protocol-relative URLs, backslashes, and auth loops.
 * - Maps legacy CRM paths (e.g. /subscription?session_id=...) to their /app/... equivalents.
 */
export function sanitizeReturnTo(requestedPath: string | null | undefined, fallback = '/app'): string {
  if (!requestedPath) return fallback
  const trimmed = requestedPath.trim()
  
  // Must be a relative root path and not protocol-relative or containing backslashes
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback
  }

  // Prevent redirect loops back to login/register
  if (/^\/(login|register)([/?#]|$)/.test(trimmed)) {
    return fallback
  }

  // Normalize legacy root CRM paths to /app/...
  for (const legacyPath of LEGACY_CRM_ROUTES) {
    if (trimmed === legacyPath || trimmed.startsWith(`${legacyPath}/`) || trimmed.startsWith(`${legacyPath}?`) || trimmed.startsWith(`${legacyPath}#`)) {
      return `/app${trimmed}`
    }
  }

  return trimmed
}

export function LegacyRedirect({ target }: { target: string }) {
  const location = useLocation()
  return <Navigate to={`${target}${location.search}${location.hash}`} replace />
}

export function ParameterizedLegacyRedirect({
  targetTemplate,
}: {
  targetTemplate: (params: Record<string, string | undefined>) => string
}) {
  const location = useLocation()
  const params = useParams()
  return <Navigate to={`${targetTemplate(params)}${location.search}${location.hash}`} replace />
}
