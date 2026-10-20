import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import LanguageSwitcher from '../components/LanguageSwitcher'
import Features from '../components/marketing/Features'
import ProductTour from '../components/marketing/ProductTour'
import FAQ from '../components/marketing/FAQ'
import {
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineUser,
} from 'react-icons/hi'

export default function Landing() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const isAuthenticated = !!token && !!user

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Xtrix">
              <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-slate-900 text-[24px] font-semibold leading-none text-white dark:bg-white dark:text-slate-900">
                x
              </span>
              <span className="text-[24px] font-bold tracking-tight">Xtrix</span>
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

          <div className="flex items-center gap-3">
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-medium text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              {t('landing.hero.badge')}
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.15] dark:text-white">
              {t('landing.hero.title')}
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl">
              {t('landing.hero.subtitle')}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/app"
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-blue-500"
                >
                  {t('landing.hero.cta_app')}
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-blue-500"
                  >
                    {t('landing.hero.cta_start')}
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {t('landing.hero.cta_login')}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Interface Preview / Screenshot Representation */}
          <div className="mt-16 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/70">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Xtrix Workspace · /app
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <HiOutlineCalendar className="h-4 w-4" />
                  <span>{t('landing.hero.preview_title')}</span>
                </div>
              </div>

              {/* Realistic Timetable Preview */}
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <HiOutlineClock className="h-4 w-4 text-blue-500" />
                      10:00 - 11:30
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Confirmed
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {t('landing.hero.preview_slot1')}
                  </h4>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <HiOutlineUser className="h-3.5 w-3.5" />
                    <span>Olga Petrova</span>
                    <span className="ml-auto font-medium text-slate-700 dark:text-slate-200">
                      850 CZK
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <HiOutlineClock className="h-4 w-4 text-blue-500" />
                      11:30 - 12:45
                    </span>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Confirmed
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {t('landing.hero.preview_slot2')}
                  </h4>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <HiOutlineUser className="h-3.5 w-3.5" />
                    <span>Kristina Novak</span>
                    <span className="ml-auto font-medium text-slate-700 dark:text-slate-200">
                      600 CZK
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    13:00 - 14:00
                  </span>
                  <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    + Available for booking
                  </p>
                  <p className="mt-3 text-[11px] text-slate-400">
                    Direct public booking link active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Product Tour */}
      <ProductTour />

      {/* FAQ Section */}
      <FAQ />
    </div>
  )
}
