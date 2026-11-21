import { useId, useRef, useState } from 'react'
import { useLocaleStore } from '../store/localeStore'
import { LuChevronDown, LuGlobe } from 'react-icons/lu'
import { useTranslation } from '../hooks/useTranslation'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore()
  const { t } = useTranslation()
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
        // starts with the code that is on the button, so voice control still finds it by "EN"
        aria-label={`${currentLanguage.label}, ${t('settings.language')}`}
        onClick={() => setIsOpen(!isOpen)}
        className="ui-button ui-button-secondary !min-h-9 !gap-1.5 !px-3 !py-1.5 !text-xs"
      >
        <LuGlobe aria-hidden="true" className="!h-3.5 !w-3.5 text-[var(--workspace-muted)]" />
        <span>{currentLanguage.label}</span>
        <LuChevronDown aria-hidden="true" className={`!h-3.5 !w-3.5 text-[var(--workspace-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div id={menuId} className="absolute right-0 top-full z-20 mt-2 w-32 rounded-2xl border border-[var(--workspace-card-border)] bg-[color-mix(in_srgb,var(--workspace-panel)_90%,transparent)] p-1.5 shadow-lg backdrop-blur-xl">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLocale(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-[13px] font-medium hover:bg-[var(--workspace-hover)] ${
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

