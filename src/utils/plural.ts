import type { Locale } from '../store/localeStore'

// "7 days" needs a real plural in Russian and Czech (день/дня/дней, den/dny/dní)
const DAY_FORMS: Record<Locale, Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }> = {
  en: { one: 'day', other: 'days' },
  ru: { one: 'день', few: 'дня', many: 'дней', other: 'дня' },
  cz: { one: 'den', few: 'dny', many: 'dne', other: 'dní' },
}

export function formatDays(count: number, locale: Locale): string {
  const rule = new Intl.PluralRules(locale === 'cz' ? 'cs' : locale).select(count)
  const forms = DAY_FORMS[locale]
  return `${count} ${forms[rule] ?? forms.other}`
}
