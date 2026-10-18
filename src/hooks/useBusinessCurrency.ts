import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import type { BusinessOut } from '../api/types'
import { Currency } from '../utils/currency'
import { useAuthStore } from '../store/authStore'


export function useBusinessCurrency(): Currency {
  const { user } = useAuthStore()
  
  const { data: business } = useQuery({
    queryKey: ['user-business'],
    queryFn: async () => {
      try {
        const { data } = await api.get<BusinessOut>('/businesses/me')
        return data
      } catch (error) {
        if (apiErrorStatus(error) === 404) {
          return null
        }
        throw error
      }
    },
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  
  return (business?.currency as Currency) || 'EUR'
}
