import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { HiOutlineCalendar, HiOutlineUserGroup, HiOutlineChatAlt2, HiOutlineMicrophone } from 'react-icons/hi'

export default function ProductTour() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'calendar' | 'clients' | 'assistant'>('calendar')
  const views = [
    { key: 'calendar', icon: HiOutlineCalendar, label: t('landing.tour.calendar_tab'), title: t('landing.tour.step1_title'), description: t('landing.tour.step1_desc') },
    { key: 'clients', icon: HiOutlineUserGroup, label: t('landing.tour.clients_tab'), title: t('landing.tour.step2_title'), description: t('landing.tour.step2_desc') },
    { key: 'assistant', icon: HiOutlineChatAlt2, label: t('landing.tour.assistant_tab'), title: t('landing.tour.step3_title'), description: t('landing.tour.step3_desc') },
  ] as const
  const current = views.find(view => view.key === activeTab)!
  const agenda = <div className="divide-y divide-[var(--workspace-line)] border-y border-[var(--workspace-line)]">
    {[['10:00', t('landing.hero.preview_slot1'), t('visits.completed')], ['11:30', t('landing.hero.preview_slot2'), t('visits.planned')]].map(([time, description, status]) => (
      <div key={time} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 py-4 text-sm sm:grid-cols-[4rem_minmax(0,1fr)_auto]">
        <span className="text-xs tabular-nums text-[var(--workspace-muted)]">{time}</span>
        <span className="min-w-0 font-medium leading-relaxed">{description}</span>
        <span className="col-start-2 justify-self-start rounded bg-[var(--workspace-accent-soft)] px-2 py-1 text-xs text-[var(--workspace-accent)] sm:col-start-auto">{status}</span>
      </div>
    ))}
  </div>

  return (
    <section id="tour" className="scroll-mt-24 border-y border-[var(--workspace-line)] bg-[var(--workspace-panel)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-16">
          <h2 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{t('landing.tour.title')}</h2>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--workspace-muted)] sm:text-base">{t('landing.tour.subtitle')}</p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
          <div role="group" aria-label={t('landing.nav.tour')} className="grid content-start gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {views.map(view => {
              const Icon = view.icon
              return <button key={view.key} type="button" onClick={() => setActiveTab(view.key)}
                aria-pressed={activeTab === view.key} aria-controls="landing-tour-panel"
                className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm font-medium ${activeTab === view.key
                  ? 'border-[var(--workspace-line)] bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]'
                  : 'border-transparent text-[var(--workspace-muted)] hover:bg-[var(--workspace-bg)]'}`}>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />{view.label}
              </button>
            })}
          </div>
          <div id="landing-tour-panel" role="region" aria-labelledby="landing-tour-title" className="min-w-0 overflow-hidden rounded-lg border border-[var(--workspace-line)]">
            <div className="border-b border-[var(--workspace-line)] px-4 py-5 sm:px-6">
              <h3 id="landing-tour-title" className="text-lg font-semibold tracking-tight">{current.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-muted)]">{current.description}</p>
            </div>
            <div className="p-4 sm:p-6">
              {activeTab === 'calendar' && <>
                <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold text-[var(--workspace-muted)]"><HiOutlineCalendar className="h-4 w-4" aria-hidden="true" />{t('landing.hero.preview_title')}</h4>
                {agenda}
              </>}
              {activeTab === 'clients' && <>
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--workspace-accent-soft)] text-sm font-medium text-[var(--workspace-accent)]" aria-hidden="true">NK</span>
                  <div><p className="text-xs text-[var(--workspace-muted)]">{t('clientForm.fullName')}</p><p className="mt-0.5 text-sm font-semibold">N. K.</p></div>
                </div>
                <h4 className="mb-3 text-xs font-semibold text-[var(--workspace-muted)]">{t('clientWorkspace.history')}</h4>
                {agenda}
                <dl className="mt-5 text-sm"><dt className="text-xs text-[var(--workspace-muted)]">{t('visits.notes')}</dt><dd className="mt-1">{t('clientWorkspace.noNotes')}</dd></dl>
              </>}
              {activeTab === 'assistant' && <>
                <div className="mb-5 flex items-start gap-3">
                  <HiOutlineMicrophone className="mt-0.5 h-5 w-5 shrink-0 text-[var(--workspace-accent)]" aria-hidden="true" />
                  <div><h4 className="text-sm font-semibold">{t('landing.features.assistant_title')}</h4><p className="mt-2 text-sm leading-relaxed text-[var(--workspace-muted)]">{t('landing.features.assistant_desc')}</p></div>
                </div>
                {agenda}
              </>}
            </div>
            <p className="border-t border-[var(--workspace-line)] bg-[var(--workspace-bg)] px-4 py-3 text-[11px] leading-relaxed text-[var(--workspace-muted)] sm:px-6">{t('landing.preview.sampleNotice')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
