import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from '../i18n/translations'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LOCALE_STORAGE_KEY = 'xtrix-locale'

// Get initial locale from localStorage or browser language
function getInitialLocale(): Locale {
  // Check localStorage first
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (saved && (saved === 'en' || saved === 'ru' || saved === 'cz')) {
    return saved as Locale
  }
  
  // Fallback to browser language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('ru')) return 'ru'
  if (browserLang.startsWith('cs') || browserLang.startsWith('cz')) return 'cz'
  
  return 'en'
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: getInitialLocale(),
      setLocale: (locale: Locale) => {
        set({ locale })
        // Also update document language attribute
        document.documentElement.lang = locale
      },
    }),
    {
      name: LOCALE_STORAGE_KEY,
    }
  )
)

