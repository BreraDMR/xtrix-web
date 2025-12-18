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
  // Only access browser APIs if we're in the browser
  if (typeof window === 'undefined') {
    return 'en'
  }
  
  // Check localStorage first
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (saved && (saved === 'en' || saved === 'ru' || saved === 'cz')) {
      return saved as Locale
    }
  } catch (e) {
    // localStorage might not be available
  }
  
  // Fallback to browser language
  try {
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('ru')) return 'ru'
    if (browserLang.startsWith('cs') || browserLang.startsWith('cz')) return 'cz'
  } catch (e) {
    // navigator might not be available
  }
  
  return 'en'
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: getInitialLocale(),
      setLocale: (locale: Locale) => {
        set({ locale })
        // Also update document language attribute (only in browser)
        if (typeof window !== 'undefined' && document) {
          document.documentElement.lang = locale
        }
      },
    }),
    {
      name: LOCALE_STORAGE_KEY,
    }
  )
)

