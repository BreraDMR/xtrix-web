import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
import LanguageSwitcher from '../LanguageSwitcher'
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi'

export default function PublicHeader() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAuthenticated = !!token && !!user

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Xtrix">
            <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-slate-900 text-[24px] font-semibold leading-none text-white dark:bg-white dark:text-slate-900">
              x
            </span>
            <span className="text-[24px] font-bold tracking-tight text-slate-900 dark:text-white">
              Xtrix
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
            <a href="#features" className="transition hover:text-slate-900 dark:hover:text-white">
              {t('landing.nav.features')}
            </a>
            <a href="#tour" className="transition hover:text-slate-900 dark:hover:text-white">
              {t('landing.nav.tour')}
            </a>
            <a href="#faq" className="transition hover:text-slate-900 dark:hover:text-white">
              {t('landing.nav.faq')}
            </a>
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500"
            >
              {t('landing.hero.cta_app')}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t('landing.hero.cta_login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {t('landing.hero.cta_start')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <HiOutlineX className="h-6 w-6" /> : <HiOutlineMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-lg md:hidden dark:border-slate-800 dark:bg-slate-950">
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-slate-700 transition hover:text-blue-600 dark:text-slate-200"
            >
              {t('landing.nav.features')}
            </a>
            <a
              href="#tour"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-slate-700 transition hover:text-blue-600 dark:text-slate-200"
            >
              {t('landing.nav.tour')}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-slate-700 transition hover:text-blue-600 dark:text-slate-200"
            >
              {t('landing.nav.faq')}
            </a>
          </nav>
          <div className="mt-4 border-t border-slate-200/80 pt-4 dark:border-slate-800">
            {isAuthenticated ? (
              <Link
                to="/app"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white"
              >
                {t('landing.hero.cta_app')}
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-300 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  {t('landing.hero.cta_login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  {t('landing.hero.cta_start')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
