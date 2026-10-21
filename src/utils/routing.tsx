import { useLocation, useParams, Navigate } from 'react-router-dom'

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
