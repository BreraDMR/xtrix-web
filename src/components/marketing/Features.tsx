import type { ReactNode } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import {
  LuCalendar, LuChartColumn, LuClipboardList, LuCreditCard, LuFileDown, LuGift, LuGlobe, LuMegaphone,
  LuMessagesSquare, LuPackage, LuSheet, LuUsers,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'

function Feature({ icon: Icon, title, description, className = '', children }: {
  icon: IconType; title: string; description: string; className?: string; children?: ReactNode
}) {
  return <article className={`lp-card flex flex-col p-6 sm:p-8 ${className}`}>
    <span className="lp-icon" aria-hidden="true"><Icon /></span>
    <h3 className="mt-5 text-xl font-semibold tracking-tight sm:text-[22px]">{title}</h3>
    <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[var(--workspace-muted)]">{description}</p>
    {children && <div className="mt-6 flex flex-1 items-end" aria-hidden="true">{children}</div>}
  </article>
}

export default function Features() {
  const { t, locale } = useTranslation()
  const money = new Intl.NumberFormat(locale === 'cz' ? 'cs-CZ' : locale, { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 })
  const slots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30']
  const bars = [38, 52, 46, 64, 58, 80, 72]
  const more = [
    { icon: LuClipboardList, title: t('landing.more.waitlist_title'), description: t('landing.more.waitlist_desc') },
    { icon: LuGift, title: t('landing.more.loyalty_title'), description: t('landing.more.loyalty_desc') },
    { icon: LuMegaphone, title: t('landing.more.campaigns_title'), description: t('landing.more.campaigns_desc') },
    { icon: LuPackage, title: t('landing.more.inventory_title'), description: t('landing.more.inventory_desc') },
    { icon: LuSheet, title: t('landing.more.import_title'), description: t('landing.more.import_desc') },
    { icon: LuFileDown, title: t('landing.more.exports_title'), description: t('landing.more.exports_desc') },
  ]

  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="lp-eyebrow lp-gradient-text">{t('landing.features.eyebrow')}</p>
          <h2 className="lp-section-title mt-3">{t('landing.features.title')}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-[var(--workspace-muted)]">{t('landing.features.subtitle')}</p>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-16 sm:gap-5 lg:grid-cols-6">
          <Feature icon={LuGlobe} title={t('landing.features.booking_title')} description={t('landing.features.booking_desc')} className="lg:col-span-4">
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="rounded-2xl bg-[var(--workspace-bg)] p-4">
                {[t('landing.mock.svc_haircut'), t('landing.mock.svc_manicure'), t('landing.mock.svc_massage')].map((service, index) => (
                  <div key={service} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${index === 1 ? 'bg-[var(--workspace-panel)] font-medium shadow-sm ring-1 ring-[var(--workspace-line)]' : 'text-[var(--workspace-muted)]'}`}>
                    {service}<span className="text-xs tabular-nums">{['60', '45', '90'][index]} {t('services.min')}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 content-start gap-2 rounded-2xl bg-[var(--workspace-bg)] p-4">
                {slots.map((slot, index) => <span key={slot} className={`rounded-xl py-2.5 text-center text-sm tabular-nums ${index === 3 ? 'text-white shadow-md' : 'bg-[var(--workspace-panel)] ring-1 ring-[var(--workspace-line)]'}`}
                  style={index === 3 ? { background: 'var(--x-gradient)' } : undefined}>{slot}</span>)}
              </div>
            </div>
          </Feature>
          <Feature icon={LuCalendar} title={t('landing.features.calendar_title')} description={t('landing.features.calendar_desc')} className="lg:col-span-2">
            <div className="grid w-full grid-cols-5 gap-1.5">
              {Array.from({ length: 15 }, (_, index) => <span key={index}
                className={`h-7 rounded-lg ${[1, 4, 7, 8, 12].includes(index) ? 'lp-ev-purple' : [2, 9, 13].includes(index) ? 'lp-ev-pink' : 'bg-[var(--workspace-bg)]'}`} />)}
            </div>
          </Feature>

          <Feature icon={LuUsers} title={t('landing.features.clients_title')} description={t('landing.features.clients_desc')} className="lg:col-span-2">
            <div className="flex items-center">
              {['A', 'E', 'M', 'K', 'N'].map((letter, index) => <span key={letter}
                className="-ml-2 grid h-11 w-11 place-items-center rounded-full border-2 border-[var(--workspace-panel)] text-sm font-semibold text-white first:ml-0"
                style={{ background: ['#9f5aef', '#e04aa8', '#4f8df7', '#22a06b', '#f59e0b'][index] }}>{letter}</span>)}
              <span className="ml-3 text-sm font-medium text-[var(--workspace-muted)]">+248</span>
            </div>
          </Feature>
          <Feature icon={LuChartColumn} title={t('landing.features.analytics_title')} description={t('landing.features.analytics_desc')} className="lg:col-span-4">
            <div className="flex h-28 w-full items-end gap-2 sm:gap-3">
              {bars.map((height, index) => <span key={index} className="flex-1 rounded-t-xl"
                style={{ height: `${height}%`, background: index === bars.length - 2 ? 'var(--x-gradient-diag)' : 'color-mix(in srgb, var(--x-purple) 18%, transparent)' }} />)}
            </div>
          </Feature>

          <Feature icon={LuMessagesSquare} title={t('landing.features.assistant_title')} description={t('landing.features.assistant_desc')} className="lg:col-span-3">
            <div className="flex w-full flex-col gap-2 text-sm leading-snug">
              <p className="lp-bubble-me ml-auto max-w-[85%] px-4 py-2.5">{t('landing.ai.chat_q1')}</p>
              <p className="mr-auto max-w-[85%] rounded-[20px_20px_20px_6px] bg-[var(--workspace-fill)] px-4 py-2.5">{t('landing.ai.chat_a1')}</p>
            </div>
          </Feature>
          <Feature icon={LuCreditCard} title={t('landing.features.finance_title')} description={t('landing.features.finance_desc')} className="lg:col-span-3">
            <div className="w-full divide-y divide-[var(--workspace-line)] rounded-2xl bg-[var(--workspace-bg)] px-4">
              {[[t('landing.mock.staff1'), 62, 24600], [t('landing.mock.staff2'), 48, 19200], [t('landing.mock.staff3'), 35, 14100]].map(([name, share, amount], index) => (
                <div key={String(name)} className="flex items-center gap-3 py-3 text-sm">
                  <span className="w-16 shrink-0 truncate font-medium">{name}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--workspace-line)]"><span className="block h-full rounded-full" style={{ width: `${share}%`, background: index ? 'color-mix(in srgb, var(--x-purple) 55%, transparent)' : 'var(--x-gradient)' }} /></span>
                  <span className="shrink-0 tabular-nums text-[var(--workspace-muted)]">{money.format(Number(amount))}</span>
                </div>
              ))}
            </div>
          </Feature>
        </div>

        <h3 className="mt-20 text-center text-2xl font-semibold tracking-tight sm:text-3xl">{t('landing.more.title')}</h3>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {more.map(({ icon: Icon, title, description }) => <li key={title} className="flex gap-4">
            <span className="lp-icon-soft" aria-hidden="true"><Icon /></span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--workspace-muted)]">{description}</p>
            </div>
          </li>)}
        </ul>
      </div>
    </section>
  )
}
