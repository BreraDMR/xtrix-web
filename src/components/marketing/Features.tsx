import { useTranslation } from '../../hooks/useTranslation'
import {
  HiOutlineCalendar,
  HiOutlineChatAlt2,
  HiOutlineChartBar,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
  HiOutlineUsers,
} from 'react-icons/hi'

export default function Features() {
  const { t } = useTranslation()

  const featureList = [
    {
      icon: HiOutlineGlobeAlt,
      title: t('landing.features.booking_title'),
      description: t('landing.features.booking_desc'),
    },
    {
      icon: HiOutlineCalendar,
      title: t('landing.features.calendar_title'),
      description: t('landing.features.calendar_desc'),
    },
    {
      icon: HiOutlineUsers,
      title: t('landing.features.clients_title'),
      description: t('landing.features.clients_desc'),
    },
    {
      icon: HiOutlineChatAlt2,
      title: t('landing.features.assistant_title'),
      description: t('landing.features.assistant_desc'),
    },
    {
      icon: HiOutlineChartBar,
      title: t('landing.features.analytics_title'),
      description: t('landing.features.analytics_desc'),
    },
    {
      icon: HiOutlineCreditCard,
      title: t('landing.features.finance_title'),
      description: t('landing.features.finance_desc'),
    },
  ]

  return (
    <section id="features" className="scroll-mt-24 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-16">
          <h2 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{t('landing.features.title')}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--workspace-muted)] sm:text-base">{t('landing.features.subtitle')}</p>
        </div>
        <div className="mt-10 grid gap-x-12 sm:grid-cols-2 lg:mt-12 lg:gap-x-16">
          {featureList.map((item, index) => {
            const Icon = item.icon
            return <article key={item.title} className="flex gap-4 border-t border-[var(--workspace-line)] py-6 sm:py-7">
              <span className="pt-1 text-[11px] tabular-nums text-[var(--workspace-muted)]" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1">
                <h3 className="flex items-start gap-2.5 text-base font-semibold"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--workspace-accent)]" aria-hidden="true" />{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--workspace-muted)]">{item.description}</p>
              </div>
            </article>
          })}
        </div>
      </div>
    </section>
  )
}
