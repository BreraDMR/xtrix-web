import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
import LanguageSwitcher from '../LanguageSwitcher'
import { LuMenu, LuX } from 'react-icons/lu'

export default function PublicHeader() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const isAuthenticated = !!token && !!user

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMobileMenuOpen(false); menuButton.current?.focus() }
    }
    if (mobileMenuOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  const links = [
    { href: '#features', label: t('landing.nav.features') },
    { href: '#assistant', label: t('landing.ai.eyebrow') },
    { href: '#tour', label: t('landing.nav.tour') },
    { href: '#pricing', label: t('landing.nav.pricing') },
    { href: '#faq', label: t('landing.nav.faq') },
  ]
  const accounts = <>{isAuthenticated
    ? <Link to="/app" className="ui-button ui-button-primary" onClick={() => setMobileMenuOpen(false)}>{t('landing.hero.cta_app')}</Link>
    : <>
      <Link to="/login" className="ui-button ui-button-quiet" onClick={() => setMobileMenuOpen(false)}>{t('landing.hero.cta_login')}</Link>
      <Link to="/register" className="ui-button ui-button-primary" onClick={() => setMobileMenuOpen(false)}>{t('landing.hero.cta_start')}</Link>
    </>}
  </>

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--workspace-hairline)] bg-[color-mix(in_srgb,var(--workspace-panel)_76%,transparent)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-10">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Xtrix">
            <span className="crm-logo h-8 w-8 text-[17px]" aria-hidden="true">X</span>
            <span className="text-xl font-semibold tracking-tight">Xtrix</span>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] text-[var(--workspace-muted)] lg:flex">
            {links.map(link => <a key={link.href} href={link.href} className="py-2 transition-colors hover:text-[var(--workspace-ink)]">{link.label}</a>)}
            <Link to="/visitor/visits" className="py-2 transition-colors hover:text-[var(--workspace-ink)]">{t('landing.nav.clientCabinet')}</Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <div className="hidden items-center gap-2 lg:flex">{accounts}</div>
          <button ref={menuButton} type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-10 w-10 place-items-center rounded-md text-[var(--workspace-muted)] hover:bg-[var(--workspace-bg)] lg:hidden"
            aria-expanded={mobileMenuOpen} aria-controls="landing-mobile-navigation" aria-label={t('landing.nav.toggleMenu')}>
            {mobileMenuOpen ? <LuX className="h-5 w-5" aria-hidden="true" /> : <LuMenu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && <div id="landing-mobile-navigation" className="border-t border-[var(--workspace-line)] px-5 py-4 lg:hidden">
        <nav className="grid grid-cols-2 gap-2 text-sm text-[var(--workspace-muted)]">
          {links.map(link => <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[var(--workspace-accent)]">{link.label}</a>)}
          <Link to="/visitor/visits" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-[var(--workspace-accent)]">{t('landing.nav.clientCabinet')}</Link>
        </nav>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--workspace-line)] pt-4">{accounts}</div>
      </div>}
    </header>
  )
}
