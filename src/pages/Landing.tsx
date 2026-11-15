import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import PublicHeader from '../components/marketing/PublicHeader'
import HeroShowcase from '../components/marketing/HeroShowcase'
import Features from '../components/marketing/Features'
import AssistantSpotlight from '../components/marketing/AssistantSpotlight'
import ProductTour from '../components/marketing/ProductTour'
import HowItWorks from '../components/marketing/HowItWorks'
import Pricing from '../components/marketing/Pricing'
import FAQ from '../components/marketing/FAQ'
import FinalCta from '../components/marketing/FinalCta'
import PublicFooter from '../components/marketing/PublicFooter'
import { LuArrowRight, LuChevronRight } from 'react-icons/lu'
import '../components/marketing/landing.css'

export default function Landing() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const isAuthenticated = !!token && !!user
  const stats = [
    [t('landing.stats.trial_value'), t('landing.stats.trial_label')],
    [t('landing.stats.booking_value'), t('landing.stats.booking_label')],
    [t('landing.stats.lang_value'), t('landing.stats.lang_label')],
    [t('landing.stats.devices_value'), t('landing.stats.devices_label')],
  ]

  return (
    <div className="lp min-h-screen bg-[var(--workspace-bg)] text-[var(--workspace-ink)]">
      <PublicHeader />
      <main>
        <section className="lp-hero pb-16 pt-14 sm:pb-24 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <p className="lp-pill lp-rise">
                <span className="lp-pill-dot">AI</span>
                {t('landing.hero.badge')}
              </p>
              <h1 className="lp-display lp-ink-gradient lp-rise lp-rise-1 mt-7 text-[40px] sm:text-6xl lg:text-[76px]">
                {t('landing.hero.title')}
              </h1>
              <p className="lp-rise lp-rise-2 mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-[var(--workspace-muted)] sm:text-xl">
                {t('landing.hero.subtitle')}
              </p>
              <div className="lp-rise lp-rise-2 mt-9 flex flex-wrap items-center justify-center gap-3">
                {isAuthenticated ? (
                  <Link to="/app" className="ui-button ui-button-primary min-h-12 px-7 text-[15px]">
                    {t('landing.hero.cta_app')}<LuArrowRight aria-hidden="true" />
                  </Link>
                ) : <>
                  <Link to="/register" className="ui-button ui-button-primary min-h-12 px-7 text-[15px]">
                    {t('landing.hero.cta_start')}<LuArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/login" className="ui-button ui-button-secondary min-h-12 px-7 text-[15px]">{t('landing.hero.cta_login')}</Link>
                </>}
              </div>
              <p className="lp-rise lp-rise-2 mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-[var(--workspace-muted)]">
                <span>{t('landing.hero.trial_note')}</span>
                <a href="#tour" className="inline-flex items-center font-medium text-[var(--workspace-accent)] hover:underline">{t('landing.hero.tour_link')}<LuChevronRight className="h-4 w-4" aria-hidden="true" /></a>
              </p>
            </div>
            <div className="mt-14 sm:mt-20">
              <HeroShowcase />
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--workspace-line)] bg-[var(--workspace-panel)]">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-8 lg:grid-cols-4">
            {stats.map(([value, label], index) => (
              <div key={value} className={`flex flex-col-reverse justify-end py-8 sm:py-10 ${index % 2 ? 'border-l border-[var(--workspace-line)] pl-5 sm:pl-8' : 'pr-5 sm:pr-8'} ${index > 1 ? 'border-t border-[var(--workspace-line)] lg:border-t-0' : ''} ${index ? 'lg:border-l lg:border-[var(--workspace-line)] lg:pl-8' : ''}`}>
                <dt className="mt-1.5 text-[13px] leading-snug text-[var(--workspace-muted)] sm:text-sm">{label}</dt>
                <dd className="font-display text-2xl font-semibold tracking-[-0.03em] sm:text-4xl"><span className="lp-gradient-text">{value}</span></dd>
              </div>
            ))}
          </dl>
        </section>

        <Features />
        <AssistantSpotlight />
        <ProductTour />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <FinalCta />
      </main>
      <PublicFooter />
    </div>
  )
}
