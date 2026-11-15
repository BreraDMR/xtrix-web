import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { LuMessagesSquare, LuCalendar, LuCircleCheck, LuMic, LuUsersRound } from 'react-icons/lu'
import { DaySchedule } from './HeroShowcase'

export default function ProductTour() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'calendar' | 'clients' | 'assistant'>('calendar')
  const views = [
    { key: 'calendar', icon: LuCalendar, label: t('landing.tour.calendar_tab'), title: t('landing.tour.step1_title'), description: t('landing.tour.step1_desc') },
    { key: 'clients', icon: LuUsersRound, label: t('landing.tour.clients_tab'), title: t('landing.tour.step2_title'), description: t('landing.tour.step2_desc') },
    { key: 'assistant', icon: LuMessagesSquare, label: t('landing.tour.assistant_tab'), title: t('landing.tour.step3_title'), description: t('landing.tour.step3_desc') },
  ] as const
  const current = views.find(view => view.key === activeTab)!
  const agenda = <div className="divide-y divide-[var(--workspace-line)] overflow-hidden rounded-2xl border border-[var(--workspace-line)]">
    {[['10:00', t('landing.hero.preview_slot1'), t('visits.completed'), true], ['11:30', t('landing.hero.preview_slot2'), t('visits.planned'), false]].map(([time, description, status, done]) => (
      <div key={String(time)} className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 px-4 py-3.5 text-sm sm:grid-cols-[4rem_minmax(0,1fr)_auto]">
        <span className="text-xs tabular-nums text-[var(--workspace-muted)]">{time}</span>
        <span className="min-w-0 font-medium leading-relaxed">{description}</span>
        <span className={`col-start-2 justify-self-start rounded-full px-2.5 py-1 text-xs sm:col-start-auto ${done ? 'bg-[var(--lp-green-soft)] text-[var(--lp-green-ink)]' : 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]'}`}>{status}</span>
      </div>
    ))}
  </div>

  return (
    <section id="tour" className="scroll-mt-20 border-b border-[var(--workspace-line)] bg-[var(--workspace-panel)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="lp-eyebrow lp-gradient-text">{t('landing.nav.tour')}</p>
          <h2 className="lp-section-title mt-3">{t('landing.tour.title')}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-[var(--workspace-muted)]">{t('landing.tour.subtitle')}</p>
        </div>
        <div className="mt-10 flex justify-center">
          <div role="group" aria-label={t('landing.nav.tour')} className="lp-segment">
            {views.map(view => {
              const Icon = view.icon
              return <button key={view.key} type="button" onClick={() => setActiveTab(view.key)}
                aria-pressed={activeTab === view.key} aria-controls="landing-tour-panel">
                <Icon aria-hidden="true" />{view.label}
              </button>
            })}
          </div>
        </div>

        <div id="landing-tour-panel" role="region" aria-labelledby="landing-tour-title" className="lp-window mx-auto mt-10 grid max-w-5xl min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
          <div className="flex flex-col justify-center border-b border-[var(--workspace-line)] bg-[var(--workspace-bg)] p-6 sm:p-10 lg:border-b-0 lg:border-r">
            <span className="lp-icon" aria-hidden="true"><current.icon /></span>
            <h3 id="landing-tour-title" className="mt-5 text-2xl font-semibold tracking-tight">{current.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--workspace-muted)]">{current.description}</p>
            <p className="mt-8 text-[11px] leading-relaxed text-[var(--workspace-muted)]">{t('landing.preview.sampleNotice')}</p>
          </div>
          <div className="min-w-0 p-5 sm:p-8">
            {activeTab === 'calendar' && <>
              <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold text-[var(--workspace-muted)]"><LuCalendar className="h-4 w-4" aria-hidden="true" />{t('landing.hero.preview_title')}</h4>
              <DaySchedule compact />
            </>}
            {activeTab === 'clients' && <>
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-white" style={{ background: 'var(--x-gradient-diag)' }} aria-hidden="true">NK</span>
                <div className="min-w-0"><p className="text-xs text-[var(--workspace-muted)]">{t('clientForm.fullName')}</p><p className="mt-0.5 text-lg font-semibold">N. K.</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--workspace-accent)]">{t('landing.mock.client_tags')}</p></div>
              </div>
              <dl className="my-5 grid grid-cols-3 gap-2">
                {[[t('landing.mock.client_visits'), '14'], [t('landing.mock.client_last'), t('landing.mock.client_last_value')], [t('landing.mock.client_bonus'), '320']].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-2xl bg-[var(--workspace-bg)] p-3"><dt className="truncate text-[11px] text-[var(--workspace-muted)]">{label}</dt><dd className="mt-1 truncate text-sm font-semibold">{value}</dd></div>
                ))}
              </dl>
              <h4 className="mb-3 text-xs font-semibold text-[var(--workspace-muted)]">{t('clientWorkspace.history')}</h4>
              {agenda}
              <dl className="mt-5 text-sm"><dt className="text-xs text-[var(--workspace-muted)]">{t('visits.notes')}</dt><dd className="mt-1">{t('clientWorkspace.noNotes')}</dd></dl>
            </>}
            {activeTab === 'assistant' && <>
              <div className="mb-5 flex items-start gap-3">
                <LuMic className="mt-0.5 h-5 w-5 shrink-0 text-[var(--workspace-accent)]" aria-hidden="true" />
                <div><h4 className="text-sm font-semibold">{t('landing.features.assistant_title')}</h4><p className="mt-2 text-sm leading-relaxed text-[var(--workspace-muted)]">{t('landing.features.assistant_desc')}</p></div>
              </div>
              <div className="flex flex-col gap-2.5 text-sm leading-snug">
                <p className="lp-bubble-me ml-auto max-w-[85%] px-4 py-2.5">{t('landing.ai.chat_q1')}</p>
                <p className="mr-auto max-w-[85%] rounded-[20px_20px_20px_6px] bg-[var(--workspace-fill)] px-4 py-2.5">{t('landing.ai.chat_a1')}</p>
              </div>
              <div className="mt-5">{agenda}</div>
              <p className="mt-4 flex items-center gap-2 text-sm font-medium"><LuCircleCheck className="h-5 w-5 text-[var(--lp-green-ink)]" aria-hidden="true" />{t('landing.ai.plan_step')}</p>
            </>}
          </div>
        </div>
      </div>
    </section>
  )
}
