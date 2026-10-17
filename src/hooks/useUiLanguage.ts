import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import type { UserPreferencesOut, UserPreferencesUpdate } from '../api/types'
import { useLocaleStore, type Locale } from '../store/localeStore'

// The UI language is an account setting now: user_preferences.language on the API, and
// e-mails to the user go out in it too. The locale store just mirrors it for this tab.
export const PREFERENCES_KEY = ['user-preferences']

const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'ru' || value === 'cz'

export function usePreferences(enabled = true) {
  return useQuery<UserPreferencesOut>({
    queryKey: PREFERENCES_KEY,
    queryFn: async () => {
      const { data } = await api.get<UserPreferencesOut>('/user-preferences/me')
      return data
    },
    enabled,
    retry: false,
  })
}

export function useSetUiLanguage() {
  const setLocale = useLocaleStore((state) => state.setLocale)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (language: Locale) => {
      const body: UserPreferencesUpdate = { language }
      const { data } = await api.put<UserPreferencesOut>('/user-preferences/me', body)
      return data
    },
    onSuccess: (data) => queryClient.setQueryData(PREFERENCES_KEY, data),
  })

  return (language: Locale) => {
    setLocale(language)
    mutation.mutate(language)
  }
}

// Once per session, after login: take the saved language, or save the one picked on the
// login page if the account has none yet.
export function useSyncUiLanguage() {
  const { data } = usePreferences()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const setUiLanguage = useSetUiLanguage()
  const synced = useRef(false)

  useEffect(() => {
    if (!data || synced.current) return
    synced.current = true
    if (isLocale(data.language)) {
      if (data.language !== locale) setLocale(data.language)
    } else {
      setUiLanguage(locale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when the preferences arrive
  }, [data])
}
