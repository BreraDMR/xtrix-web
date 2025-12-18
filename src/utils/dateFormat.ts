import { format, Locale } from 'date-fns'
import { enUS, ru, cs } from 'date-fns/locale'
import type { Locale as AppLocale } from '../i18n/translations'

export const dateLocales: Record<AppLocale, Locale> = {
  en: enUS,
  ru: ru,
  cz: cs, // Czech locale
}

export function formatDate(date: Date | string, formatStr: string, locale: AppLocale = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateLocale = dateLocales[locale] || enUS
  return format(dateObj, formatStr, { locale: dateLocale })
}

// Common date formats
export const dateFormats = {
  // Full date with time: "15.01.2024, 15:45" for RU/CZ, "January 15, 2024 at 3:45 PM" for EN
  full: (locale: AppLocale) => {
    if (locale === 'ru' || locale === 'cz') {
      return 'dd.MM.yyyy, HH:mm'
    }
    return 'PPp'
  },
  // Date only: "15.01.2024" for RU/CZ, "January 15, 2024" for EN
  date: (locale: AppLocale) => {
    if (locale === 'ru' || locale === 'cz') {
      return 'dd.MM.yyyy'
    }
    return 'PP'
  },
  // Time only: "15:45" for RU/CZ, "3:45 PM" for EN
  time: (locale: AppLocale) => {
    if (locale === 'ru' || locale === 'cz') {
      return 'HH:mm'
    }
    return 'p'
  },
  // Short date: "15.01.2024" for RU/CZ, "01/15/2024" for EN
  short: (locale: AppLocale) => locale === 'ru' || locale === 'cz' ? 'dd.MM.yyyy' : 'MM/dd/yyyy',
  // Month and day: "15 января" for RU, "15. ledna" for CZ, "January 15" for EN
  monthDay: (_locale: AppLocale) => 'MMMM d',
  // Calendar header: "15 января 2024" for RU, "15. ledna 2024" for CZ, "January 15, 2024" for EN
  calendar: (_locale: AppLocale) => {
    if (_locale === 'ru' || _locale === 'cz') {
      return 'd MMMM yyyy'
    }
    return 'MMMM d, yyyy'
  },
}

