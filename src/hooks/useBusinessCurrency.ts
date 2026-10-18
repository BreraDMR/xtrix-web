import { Currency } from '../utils/currency'
import { useAuthStore } from '../store/authStore'
import { useMyBusiness } from './useMyBusiness'

export function useBusinessCurrency(): Currency {
  const { user } = useAuthStore()
  const { data: business } = useMyBusiness(!!user)
  return (business?.currency as Currency) || 'EUR'
}
