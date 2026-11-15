import { useTranslation } from '../../hooks/useTranslation'
import { LuCalendarCheck, LuCircleCheck, LuMic, LuSparkles, LuUsers } from 'react-icons/lu'

export default function AssistantSpotlight() {
  const { t } = useTranslation()
  const points = [
    { icon: LuMic, label: t('landing.ai.p1') },
    { icon: LuCalendarCheck, label: t('landing.ai.p2') },
    { icon: LuUsers, label: t('landing.ai.p3') },
  ]

  return (
    <section id="assistant" className="lp-dark scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="min-w-0">
          <p className="lp-eyebrow text-[#d8b9ff]"><LuSparkles className="h-4 w-4" aria-hidden="true" />{t('landing.ai.eyebrow')}</p>
          <h2 className="lp-section-title mt-3 text-white">{t('landing.ai.title')}</h2>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#a1a1a6]">{t('landing.ai.subtitle')}</p>
          <ul className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {points.map(({ icon: Icon, label }) => <li key={label} className="lp-dark-card flex items-center gap-3 px-4 py-3.5 text-sm font-medium !rounded-2xl">
              <Icon className="h-5 w-5 shrink-0 text-[#d8b9ff]" aria-hidden="true" />{label}
            </li>)}
          </ul>
        </div>

        <div className="lp-dark-card min-w-0 p-5 sm:p-7" aria-hidden="true">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: 'var(--x-gradient-diag)' }}><LuSparkles className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-white">{t('landing.features.assistant_title')}</p>
              <p className="flex items-center gap-1.5 text-xs text-[#7fd8a7]"><span className="h-1.5 w-1.5 rounded-full bg-[#7fd8a7]" />{t('landing.ai.eyebrow')}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 text-[14.5px] leading-snug">
            <p className="lp-bubble-me ml-auto max-w-[85%] px-4 py-2.5">{t('landing.ai.chat_q1')}</p>
            <p className="lp-bubble-ai mr-auto max-w-[85%] px-4 py-2.5">{t('landing.ai.chat_a1')}</p>
            <p className="lp-bubble-me ml-auto max-w-[85%] px-4 py-2.5">{t('landing.ai.chat_q2')}</p>
            <div className="mr-auto w-full max-w-[85%] rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="flex items-center gap-2 font-medium text-white"><LuCircleCheck className="h-5 w-5 shrink-0 text-[#7fd8a7]" />{t('landing.ai.plan_step')}</p>
              <p className="mt-1 pl-7 text-[13px] text-[#a1a1a6]">{t('landing.ai.plan_detail')} · {t('landing.mock.staff3')}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-full bg-white/10 px-4 py-3 text-sm text-[#a1a1a6]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white" style={{ background: 'var(--x-gradient)' }}><LuMic className="h-4 w-4" /></span>
            <span className="flex-1">{t('landing.ai.listening')}</span>
            <span className="lp-wave text-[#d8b9ff]"><i /><i /><i /><i /><i /></span>
          </div>
          <p className="mt-4 text-center text-[11px] text-[#8e8e93]">{t('landing.preview.sampleNotice')}</p>
        </div>
      </div>
    </section>
  )
}
