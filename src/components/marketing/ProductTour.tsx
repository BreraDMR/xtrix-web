import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import {
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineChatAlt2,
  HiOutlineCheck,
} from 'react-icons/hi'

export default function ProductTour() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'calendar' | 'clients' | 'assistant'>('calendar')

  return (
    <section id="tour" className="scroll-mt-16 py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('landing.tour.title')}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            {t('landing.tour.subtitle')}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex rounded-xl bg-white p-1.5 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <HiOutlineCalendar className="h-4 w-4" />
              {t('landing.tour.calendar_tab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'clients'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <HiOutlineUserGroup className="h-4 w-4" />
              {t('landing.tour.clients_tab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assistant')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'assistant'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <HiOutlineChatAlt2 className="h-4 w-4" />
              {t('landing.tour.assistant_tab')}
            </button>
          </div>
        </div>

        {/* Interface Showcase */}
        <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {activeTab === 'calendar' && (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('landing.tour.step1_title')}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t('landing.tour.step1_desc')}
                  </p>
                </div>
                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  Salon Demo Grid
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 text-xs">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="font-semibold text-slate-500">09:00 - 10:00</div>
                  <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    Consultation
                  </div>
                  <div className="mt-1 text-slate-500">Master: Maria K.</div>
                  <span className="mt-3 inline-block rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Completed
                  </span>
                </div>
                <div className="rounded-xl border-2 border-blue-500 bg-blue-50/30 p-4 dark:bg-blue-950/20">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">10:00 - 11:30</div>
                  <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    Balayage & Styling
                  </div>
                  <div className="mt-1 text-slate-500">Master: Elena V.</div>
                  <span className="mt-3 inline-block rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    In Progress
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                  <div className="font-semibold text-slate-500">12:00 - 13:00</div>
                  <div className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    Classic Manicure
                  </div>
                  <div className="mt-1 text-slate-500">Master: Anna S.</div>
                  <span className="mt-3 inline-block rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Planned
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-800">
                  <span className="text-slate-400">14:00 - 18:00</span>
                  <span className="mt-2 font-medium text-blue-600 dark:text-blue-400">
                    4 Open Slots
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('landing.tour.step2_title')}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t('landing.tour.step2_desc')}
                  </p>
                </div>
                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  Client Record Preview
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    VK
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Victoria Kuznetsova
                    </h4>
                    <p className="text-xs text-slate-500">VIP Client · 14 completed visits</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-xs text-slate-500">Loyalty Cashback</span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      450 CZK
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200/80 pt-4 dark:border-slate-800">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Recent Procedures
                  </h5>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-slate-100/70 p-2.5 dark:bg-slate-900">
                      <span>Hair care & blow-dry · Elena V.</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        1,200 CZK
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-100/70 p-2.5 dark:bg-slate-900">
                      <span>Gel manicure with design · Anna S.</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        750 CZK
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assistant' && (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('landing.tour.step3_title')}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {t('landing.tour.step3_desc')}
                  </p>
                </div>
                <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  Sashenka AI Dialog
                </span>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex justify-end">
                  <div className="max-w-md rounded-2xl bg-blue-600 px-4 py-3 text-xs text-white">
                    Какое расписание у мастера Елены на завтра после 14:00?
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-md rounded-2xl bg-slate-100 p-4 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <p className="font-semibold text-purple-700 dark:text-purple-400">
                      Сашенька (AI):
                    </p>
                    <p className="mt-1">
                      У Елены на завтра запланирован один визит в 15:00 (стрижка, 60 мин). Свободные
                      интервалы: 14:00–15:00 и 16:30–19:00.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <HiOutlineCheck className="h-3.5 w-3.5" />
                      Данные проверены по рабочему журналу
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
