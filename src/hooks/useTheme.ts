import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { usePreferences } from './useUiLanguage'
import { applyTheme, isTheme, savedTheme } from '../utils/theme'

export function useTheme() {
  const user = useAuthStore((state) => state.user)
  const { data } = usePreferences(!!user)
  const theme = isTheme(data?.theme) ? data.theme : savedTheme()

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const changed = () => applyTheme(theme)
    media.addEventListener('change', changed)
    return () => media.removeEventListener('change', changed)
  }, [theme])
}
