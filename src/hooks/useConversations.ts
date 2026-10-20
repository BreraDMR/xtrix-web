import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { ConversationCreate, ConversationOut, ConversationPage, ConversationRename, MessagePage } from '../api/types'
import { useAuthStore } from '../store/authStore'

export const CONVERSATIONS_KEY = ['assistant-conversations']
export const MESSAGES_KEY = ['assistant-messages']

const getStorageKey = (userId?: number, businessId?: number | null) =>
  userId ? `xtrix.assistant.conversation_id.${userId}.${businessId ?? 'solo'}` : null

export function getSavedConversationId(userId?: number, businessId?: number | null): string | null {
  const key = getStorageKey(userId, businessId)
  if (!key) return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function setSavedConversationId(id: string | null, userId?: number, businessId?: number | null) {
  const key = getStorageKey(userId, businessId)
  if (!key) return
  try {
    if (id) localStorage.setItem(key, id)
    else localStorage.removeItem(key)
  } catch {
    // browser storage unavailable
  }
}

export function useConversations(enabled = true) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [activeId, setActiveIdState] = useState<string | null>(() => getSavedConversationId(user?.id, user?.business_id))

  const queryKey = [...CONVERSATIONS_KEY, user?.id, user?.business_id]

  const listQuery = useQuery<ConversationPage>({
    queryKey,
    queryFn: async () => (await api.get<ConversationPage>('/assistant/conversations')).data,
    enabled: enabled && !!user,
    staleTime: 10 * 1000,
  })

  // Synchronize active ID with saved storage and available items
  useEffect(() => {
    if (!listQuery.data) return
    const items = listQuery.data.items
    if (items.length === 0) {
      if (activeId !== null) {
        setActiveIdState(null)
        setSavedConversationId(null, user?.id, user?.business_id)
      }
      return
    }

    if (activeId) {
      const exists = items.some((item) => item.id === activeId)
      if (!exists) {
        // Saved ID is archived or belongs to another workspace, pick first active
        const fallback = items[0].id
        setActiveIdState(fallback)
        setSavedConversationId(fallback, user?.id, user?.business_id)
      }
    } else {
      const first = items[0].id
      setActiveIdState(first)
      setSavedConversationId(first, user?.id, user?.business_id)
    }
  }, [listQuery.data, activeId, user?.id, user?.business_id])

  // Clear on logout
  useEffect(() => {
    if (!user) {
      setActiveIdState(null)
    }
  }, [user])

  const selectConversation = useCallback((id: string | null) => {
    setActiveIdState(id)
    setSavedConversationId(id, user?.id, user?.business_id)
  }, [user?.id, user?.business_id])

  const createMutation = useMutation({
    mutationFn: async (title?: string) => {
      const payload: ConversationCreate = {
        client_request_id: crypto.randomUUID(),
        title: title || undefined,
      }
      const { data } = await api.post<ConversationOut>('/assistant/conversations', payload)
      return data
    },
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey })
      selectConversation(newConv.id)
    },
  })

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const payload: ConversationRename = { title }
      const { data } = await api.patch<ConversationOut>(`/assistant/conversations/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ConversationOut>(`/assistant/conversations/${id}/archive`)
      return data
    },
    onSuccess: (_, archivedId) => {
      queryClient.invalidateQueries({ queryKey })
      if (activeId === archivedId) {
        selectConversation(null)
      }
    },
  })

  return {
    conversations: listQuery.data?.items ?? [],
    total: listQuery.data?.total ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    activeId,
    selectConversation,
    createConversation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    renameConversation: renameMutation.mutateAsync,
    isRenaming: renameMutation.isPending,
    archiveConversation: archiveMutation.mutateAsync,
    isArchiving: archiveMutation.isPending,
    refetch: listQuery.refetch,
  }
}

export function useConversationMessages(conversationId: string | null, enabled = true) {
  return useQuery<MessagePage>({
    queryKey: [...MESSAGES_KEY, conversationId],
    queryFn: async () => {
      if (!conversationId) return { items: [], next_before: null }
      const { data } = await api.get<MessagePage>(`/assistant/conversations/${conversationId}/messages`)
      return data
    },
    enabled: enabled && !!conversationId,
    staleTime: 5 * 1000,
  })
}
