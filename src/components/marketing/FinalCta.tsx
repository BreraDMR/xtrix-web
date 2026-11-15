import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
import { LuArrowRight } from 'react-icons/lu'

export default function FinalCta() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const isAuthenticated = !!token && !!user
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="lp-cta mx-auto max-w-6xl px-6 py-16 text-center sm:px-12 sm:py-24">
        <h2 className="lp-section-title mx-auto max-w-3xl text-white">{t('landing.cta.title')}</h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/85">{t('landing.hero.trial_note')}</p>
        <Link to={isAuthenticated ? '/app' : '/register'} className="ui-button lp-button-light mt-9 min-h-12 px-8 text-[15px] font-semibold">
          {t(isAuthenticated ? 'landing.cta.open' : 'landing.cta.start')}<LuArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
