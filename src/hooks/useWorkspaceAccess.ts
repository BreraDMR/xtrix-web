import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import type { Schema } from '../api/types'
import { useAuthStore } from '../store/authStore'

export type WorkspaceAccess = Schema<'SubscriptionAccessOut'>
export const WorkspaceAccessContext = createContext<WorkspaceAccess | null | undefined>(undefined)
export const useWorkspaceAccessContext = () => useContext(WorkspaceAccessContext)

export function useWorkspaceAccess() {
  const token = useAuthStore(state => state.token)
  const userId = useAuthStore(state => state.user?.id)
  return useQuery({
    queryKey: ['workspace-access', userId, token],
    enabled: !!token,
    queryFn: async () => (await api.get<WorkspaceAccess>('/subscriptions/access')).data,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false,
  })
}
