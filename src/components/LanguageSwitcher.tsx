import { useLocaleStore } from '../store/localeStore'
import type { Locale } from '../i18n/translations'

interface Language {
  code: Locale
  label: string
  flag: string
}

const languages: Language[] = [
  { code: 'cz', label: 'CZ', flag: '🇨🇿' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale)
    // Force page refresh to apply all translations
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            locale === lang.code
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-200'
          }`}
          title={lang.label}
        >
          <span className="text-base leading-none">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
        </button>
      ))}
    </div>
  )
}

