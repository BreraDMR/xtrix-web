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
    <section id="features" className="scroll-mt-16 py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('landing.features.title')}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-3">
          {featureList.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="relative flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/60 p-8 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
