import { format, Locale } from 'date-fns'
import { enUS, ru, cs } from 'date-fns/locale'
import type { Locale as AppLocale } from '../i18n/translations'

const dateLocales: Record<AppLocale, Locale> = {
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
  // Full date with time: "January 15, 2024 at 3:45 PM"
  full: (locale: AppLocale) => locale === 'ru' ? 'PPp' : 'PPp',
  // Date only: "January 15, 2024"
  date: (locale: AppLocale) => 'PP',
  // Time only: "3:45 PM"
  time: (locale: AppLocale) => 'p',
  // Short date: "01/15/2024" or "15.01.2024"
  short: (locale: AppLocale) => locale === 'ru' || locale === 'cz' ? 'dd.MM.yyyy' : 'MM/dd/yyyy',
  // Month and day: "January 15"
  monthDay: (locale: AppLocale) => 'MMMM d',
  // Calendar header: "January 15, 2024"
  calendar: (locale: AppLocale) => 'MMMM d, yyyy',
}

