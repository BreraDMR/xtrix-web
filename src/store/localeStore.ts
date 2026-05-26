import { create } from 'zustand'

type Locale = 'en' | 'ru' | 'cz'

const getInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en'
  
  const saved = localStorage.getItem('app_locale')
  if (saved && (saved === 'en' || saved === 'ru' || saved === 'cz')) {
    return saved as Locale
  }
  
  const browserLang = navigator.language.split('-')[0].toLowerCase()
  if (browserLang === 'ru') return 'ru'
  if (browserLang === 'cs') return 'cz'
  
  return 'en'
}

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
  getInitialLocale: () => Locale
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_locale', locale)
      document.documentElement.lang = locale
    }
    set({ locale })
  },
  getInitialLocale,
}))

