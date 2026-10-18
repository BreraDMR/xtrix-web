import { useQuery, type QueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { AssistantStatusOut } from '../api/types'
import { useLocaleStore, type Locale } from '../store/localeStore'

// same roles the API lets into /assistant (they can work with clients and visits)
export const ASSISTANT_ROLES = ['admin', 'business_owner', 'specialist', 'employee']
export const canUseAssistant = (role?: string | null) => !!role && ASSISTANT_ROLES.includes(role)

export const ASSISTANT_STATUS_KEY = ['assistant-status']

// the name in the answer follows Accept-Language, so the language is part of the key
export function useAssistantStatus(enabled: boolean) {
  const locale = useLocaleStore((state) => state.locale)
  return useQuery<AssistantStatusOut>({
    queryKey: [...ASSISTANT_STATUS_KEY, locale],
    queryFn: async () => (await api.get<AssistantStatusOut>('/assistant/status')).data,
    enabled,
    retry: false,
    staleTime: 30 * 1000,
  })
}

// after the assistant changed something: every visit and client list, the dashboards built
// on them, and the usage counter
export function refreshAfterAssistant(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) => typeof query.queryKey[0] === 'string' && /^(visit|client)/.test(query.queryKey[0]),
  })
  queryClient.invalidateQueries({ queryKey: ASSISTANT_STATUS_KEY })
}

const DATE_LOCALES: Record<Locale, string> = { en: 'en-GB', ru: 'ru-RU', cz: 'cs-CZ' }

export function formatDay(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALES[locale], { day: 'numeric', month: 'long', year: 'numeric' })
}

// "Tue 20 Oct, 10:00–11:00" in the browser's time zone, like the rest of the app
export function formatTimeRange(start: string, end: string | null | undefined, locale: Locale): string {
  const tag = DATE_LOCALES[locale]
  const from = new Date(start)
  const text = from.toLocaleString(tag, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  if (!end) return text
  const to = new Date(end)
  const sameDay = from.toDateString() === to.toDateString()
  const tail = sameDay
    ? to.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' })
    : to.toLocaleString(tag, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return `${text}–${tail}`
}
