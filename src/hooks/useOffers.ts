import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import type { OfferCatalogOut, OfferOut } from '../api/types'

export const OFFERS_QUERY_KEY = ['offers-catalog']

export function useOffers(product?: 'crm' | 'ai') {
  return useQuery<OfferCatalogOut>({
    queryKey: [...OFFERS_QUERY_KEY, product ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get<OfferCatalogOut>('/offers', {
        params: product ? { product } : undefined,
      })
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useOffersList(product?: 'crm' | 'ai'): {
  offers: OfferOut[]
  isLoading: boolean
  error: unknown
} {
  const query = useOffers(product)
  return {
    offers: query.data?.offers ?? [],
    isLoading: query.isLoading,
    error: query.error,
  }
}
