import { useId, useRef, useState } from 'react'
import { useLocaleStore } from '../store/localeStore'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const toggle = useRef<HTMLButtonElement>(null)

  const languages = [
    { code: 'cz' as const, label: 'CZ' },
    { code: 'ru' as const, label: 'RU' },
    { code: 'en' as const, label: 'EN' },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  return (
    <div className="relative" onKeyDown={event => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        event.stopPropagation()
        setIsOpen(false)
        toggle.current?.focus()
      }
    }}>
      <button
        type="button"
        ref={toggle}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen(!isOpen)}
        className="ui-button ui-button-secondary !min-h-9 !gap-1.5 !px-3 !py-1.5 !text-xs"
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
          <div id={menuId} className="absolute right-0 top-full z-20 mt-2 w-24 rounded-md border border-[var(--workspace-line)] bg-[var(--workspace-panel)] p-1 shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full rounded px-3 py-2 text-left text-xs font-medium hover:bg-[var(--workspace-accent-soft)] ${
                  locale === lang.code
                    ? 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]'
                    : 'text-[var(--workspace-ink)]'
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

