import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import type { OnboardingState, OnboardingUpdate } from '../api/types'

// the user id is part of the key: after logout the next session never reads the previous answer
export const onboardingKey = (userId?: number | null) => ['onboarding', userId ?? null]

export function useOnboarding(enabled = true) {
  const userId = useAuthStore((state) => state.user?.id)
  return useQuery<OnboardingState>({
    queryKey: onboardingKey(userId),
    queryFn: async () => {
      const { data } = await api.get<OnboardingState>('/onboarding/me')
      return data
    },
    enabled: enabled && !!userId,
    staleTime: 0,
  })
}

export function useUpdateOnboarding() {
  const userId = useAuthStore((state) => state.user?.id)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (update: OnboardingUpdate) => {
      const { data } = await api.patch<OnboardingState>('/onboarding/me', update)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKey(userId), data)
    },
  })
}
