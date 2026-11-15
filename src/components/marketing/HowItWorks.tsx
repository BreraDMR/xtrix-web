import { useTranslation } from '../../hooks/useTranslation'
import { LuBriefcase, LuBuilding2, LuShare2, LuSlidersHorizontal, LuUser, LuUserPlus } from 'react-icons/lu'

export default function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    { icon: LuUserPlus, title: t('landing.steps.s1_title'), description: t('landing.steps.s1_desc') },
    { icon: LuSlidersHorizontal, title: t('landing.steps.s2_title'), description: t('landing.steps.s2_desc') },
    { icon: LuShare2, title: t('landing.steps.s3_title'), description: t('landing.steps.s3_desc') },
  ]
  const audience = [
    { icon: LuBuilding2, title: t('landing.audience.salon_title'), description: t('landing.audience.salon_desc') },
    { icon: LuUser, title: t('landing.audience.solo_title'), description: t('landing.audience.solo_desc') },
    { icon: LuBriefcase, title: t('landing.audience.owner_title'), description: t('landing.audience.owner_desc') },
  ]

  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="lp-eyebrow lp-gradient-text">{t('landing.steps.eyebrow')}</p>
          <h2 className="lp-section-title mt-3">{t('landing.steps.title')}</h2>
        </div>
        <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
          <span className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-px md:block" style={{ background: 'linear-gradient(90deg, transparent, var(--x-purple), transparent)', opacity: .35 }} aria-hidden="true" />
          {steps.map(({ icon: Icon, title, description }, index) => <li key={title} className="relative flex flex-col items-center px-4 text-center">
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[var(--workspace-panel)] text-[var(--workspace-accent)] shadow-md ring-1 ring-[var(--workspace-line)]" aria-hidden="true">
              <Icon className="h-6 w-6" />
              <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: 'var(--x-gradient)' }}>{index + 1}</span>
            </span>
            <h3 className="mt-6 text-lg font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-[var(--workspace-muted)]">{description}</p>
          </li>)}
        </ol>

        <div className="mt-24 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center lg:gap-16">
          <div>
            <h2 className="lp-section-title !text-[clamp(28px,3.4vw,44px)]">{t('landing.audience.title')}</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {t('landing.audience.kinds').split(' · ').map(kind => <li key={kind} className="rounded-full bg-[var(--workspace-panel)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--workspace-muted)] ring-1 ring-[var(--workspace-line)]">{kind}</li>)}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {audience.map(({ icon: Icon, title, description }) => <div key={title} className="lp-card p-6">
              <span className="lp-icon-soft" aria-hidden="true"><Icon /></span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--workspace-muted)]">{description}</p>
            </div>)}
          </div>
        </div>
      </div>
    </section>
  )
}
