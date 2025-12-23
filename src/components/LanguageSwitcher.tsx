import { useLocaleStore } from '../store/localeStore'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()

  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
    { code: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
    { code: 'cz' as const, label: 'Čeština', flag: '🇨🇿' },
  ]

  return (
    <div className="flex items-center gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            locale === lang.code
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={lang.label}
        >
          <span className="mr-1.5">{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  )
}

