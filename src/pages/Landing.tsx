import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import PublicHeader from '../components/marketing/PublicHeader'
import Features from '../components/marketing/Features'
import ProductTour from '../components/marketing/ProductTour'
import Pricing from '../components/marketing/Pricing'
import FAQ from '../components/marketing/FAQ'
import PublicFooter from '../components/marketing/PublicFooter'
import { HiOutlineArrowRight, HiOutlineCalendar, HiOutlineClock, HiOutlineLink } from 'react-icons/hi'

export default function Landing() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const isAuthenticated = !!token && !!user
  const appointments = [
    { time: '10:00', description: t('landing.hero.preview_slot1'), status: t('visits.completed') },
    { time: '11:30', description: t('landing.hero.preview_slot2'), status: t('visits.planned') },
  ]

  return (
    <div className="min-h-screen bg-[var(--workspace-bg)] text-[var(--workspace-ink)]">
      <PublicHeader />
      <main>
        <section className="border-b border-[var(--workspace-line)] py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="min-w-0">
              <p className="flex items-center gap-3 text-xs font-medium leading-relaxed text-[var(--workspace-accent)]">
                <span className="h-px w-7 shrink-0 bg-[var(--workspace-accent)]" aria-hidden="true" />
                {t('landing.hero.badge')}
              </p>
              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.12] tracking-[-0.04em] [text-wrap:balance] sm:text-5xl lg:text-6xl">
                {t('landing.hero.title')}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--workspace-muted)] sm:text-lg">
                {t('landing.hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {isAuthenticated ? (
                  <Link to="/app" className="ui-button ui-button-primary">
                    {t('landing.hero.cta_app')}<HiOutlineArrowRight aria-hidden="true" />
                  </Link>
                ) : <>
                  <Link to="/register" className="ui-button ui-button-primary">
                    {t('landing.hero.cta_start')}<HiOutlineArrowRight aria-hidden="true" />
                  </Link>
                  <Link to="/login" className="ui-button ui-button-secondary">{t('landing.hero.cta_login')}</Link>
                </>}
              </div>
            </div>

            <figure aria-labelledby="landing-hero-sample" className="min-w-0 overflow-hidden rounded-lg border border-[var(--workspace-line)] bg-[var(--workspace-panel)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--workspace-line)] bg-[var(--workspace-bg)] px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-medium"><HiOutlineCalendar className="h-4 w-4 text-[var(--workspace-accent)]" aria-hidden="true" />{t('landing.tour.calendar_tab')}</span>
                <span className="text-xs text-[var(--workspace-muted)]">Xtrix</span>
              </div>
              <div className="px-4 py-5 sm:px-5">
                <h2 className="mb-5 text-sm font-semibold">{t('landing.hero.preview_title')}</h2>
                <div className="divide-y divide-[var(--workspace-line)] border-y border-[var(--workspace-line)]">
                  {appointments.map(appointment => (
                    <div key={appointment.time} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 py-4">
                      <span className="flex items-start gap-1.5 pt-0.5 text-xs tabular-nums text-[var(--workspace-muted)]"><HiOutlineClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{appointment.time}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-relaxed">{appointment.description}</p>
                        <span className="mt-2 inline-block rounded bg-[var(--workspace-accent-soft)] px-2 py-0.5 text-xs text-[var(--workspace-accent)]">{appointment.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-start gap-3">
                  <HiOutlineLink className="mt-0.5 h-4 w-4 shrink-0 text-[var(--workspace-accent)]" aria-hidden="true" />
                  <div><h3 className="text-xs font-medium">{t('landing.features.booking_title')}</h3><p className="mt-1 text-xs leading-relaxed text-[var(--workspace-muted)]">{t('landing.features.booking_desc')}</p></div>
                </div>
              </div>
              <figcaption id="landing-hero-sample" className="border-t border-[var(--workspace-line)] px-4 py-3 text-[11px] leading-relaxed text-[var(--workspace-muted)] sm:px-5">{t('landing.preview.sampleNotice')}</figcaption>
            </figure>
          </div>
        </section>
        <Features />
        <ProductTour />
        <Pricing />
        <FAQ />
      </main>
      <PublicFooter />
    </div>
  )
}
