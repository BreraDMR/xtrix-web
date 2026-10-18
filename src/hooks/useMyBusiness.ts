import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import type { BusinessOut } from '../api/types'

export const MY_BUSINESS_KEY = ['user-business']

// The business the user works in, shared by the currency and the assistant name.
// null = no business yet (404).
export function useMyBusiness(enabled = true) {
  return useQuery<BusinessOut | null>({
    queryKey: MY_BUSINESS_KEY,
    queryFn: async () => {
      try {
        const { data } = await api.get<BusinessOut>('/businesses/me')
        return data
      } catch (error) {
        if (apiErrorStatus(error) === 404) return null
        throw error
      }
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
