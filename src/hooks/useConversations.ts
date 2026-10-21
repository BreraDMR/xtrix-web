import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

  const listQuery = useInfiniteQuery<ConversationPage>({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<ConversationPage>('/assistant/conversations', {
        params: pageParam ? { offset: pageParam } : undefined,
      })
      return data ?? { items: [], total: 0, limit: 50, offset: pageParam }
    },
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const loaded = last.offset + last.items.length
      return loaded < last.total ? loaded : undefined
    },
    enabled: enabled && !!user,
    staleTime: 10 * 1000,
  })

  const conversations = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data],
  )

  // Synchronize active ID with saved storage and the pages loaded so far.
  useEffect(() => {
    if (!listQuery.data) return
    if (conversations.length === 0) {
      if (activeId !== null) {
        setActiveIdState(null)
        setSavedConversationId(null, user?.id, user?.business_id)
      }
      return
    }
    // A saved chat older than the first page stays selected; replacing it with the
    // newest one would silently open the wrong conversation.
    if (!activeId) {
      const first = conversations[0].id
      setActiveIdState(first)
      setSavedConversationId(first, user?.id, user?.business_id)
    }
  }, [conversations, activeId, listQuery.data, user?.id, user?.business_id])

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

  // A lost create response must not become a second chat on retry.
  const createRequestKey = useRef<string | null>(null)
  const createMutation = useMutation({
    mutationFn: async () => {
      createRequestKey.current ||= crypto.randomUUID()
      const payload: ConversationCreate = {
        client_request_id: createRequestKey.current,
      }
      const { data } = await api.post<ConversationOut>('/assistant/conversations', payload)
      return data
    },
    onSuccess: (newConv) => {
      createRequestKey.current = null
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
    conversations,
    total: listQuery.data?.pages[0]?.total ?? 0,
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
    hasMore: !!listQuery.hasNextPage,
    loadMore: listQuery.fetchNextPage,
    isLoadingMore: listQuery.isFetchingNextPage,
    refetch: listQuery.refetch,
  }
}

export function useConversationMessages(conversationId: string | null, enabled = true) {
  const query = useInfiniteQuery<MessagePage>({
    queryKey: [...MESSAGES_KEY, conversationId],
    queryFn: async ({ pageParam }) => {
      if (!conversationId) return { items: [], next_before: null }
      const { data } = await api.get<MessagePage>(`/assistant/conversations/${conversationId}/messages`, {
        params: pageParam ? { before: pageParam } : undefined,
      })
      return data ?? { items: [], next_before: null }
    },
    initialPageParam: null as number | null,
    getNextPageParam: (last) => last.next_before ?? undefined,
    enabled: enabled && !!conversationId,
    staleTime: 5 * 1000,
  })
  // pages arrive newest first; render them oldest first
  const items = useMemo(
    () => (query.data?.pages ?? []).slice().reverse().flatMap((page) => page.items),
    [query.data],
  )
  return { ...query, items }
}
