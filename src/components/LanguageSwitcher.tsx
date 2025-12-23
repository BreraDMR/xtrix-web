import { useState } from 'react'
import { useLocaleStore } from '../store/localeStore'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'cz' as const, label: 'CZ' },
    { code: 'ru' as const, label: 'RU' },
    { code: 'en' as const, label: 'EN' },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1"
      >
        <span>{currentLanguage.label}</span>
        <span className="text-xs">▼</span>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 min-w-[80px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm font-medium transition-all hover:bg-gray-100 first:rounded-t-md last:rounded-b-md ${
                  locale === lang.code
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

