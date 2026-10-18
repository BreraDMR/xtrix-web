import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from './LoadingSpinner'
import QueryError from './QueryError'

export default function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, user } = useAuthStore()
  const location = useLocation()
  const session = useQuery({
    queryKey: ['session-user', token],
    enabled: !!token && !user,
    retry: false,
    queryFn: async () => {
      const { data } = await api.get('/users/me')
      const currentToken = useAuthStore.getState().token
      if (currentToken) useAuthStore.getState().setAuth(currentToken, data)
      return data
    },
  })
  if (!token) {
    const returnTo = location.pathname + location.search + location.hash
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }
  if (!user) {
    if (session.isError) return <QueryError retry={session.refetch} />
    return <LoadingSpinner />
  }
  return <>{children}</>
}
