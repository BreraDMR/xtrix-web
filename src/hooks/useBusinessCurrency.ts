import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { Currency } from '../utils/currency'
import { useAuthStore } from '../store/authStore'

/**
 * Хук для получения валюты бизнеса
 * @returns валюта бизнеса (по умолчанию EUR)
 */
export function useBusinessCurrency(): Currency {
  const { user } = useAuthStore()
  
  const { data: business } = useQuery({
    queryKey: ['user-business'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/businesses/me')
        return data
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 минут
  })
  
  return (business?.currency as Currency) || 'EUR'
}
