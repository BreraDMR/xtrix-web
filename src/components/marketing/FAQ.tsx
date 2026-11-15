import { useId, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { LuChevronDown } from 'react-icons/lu'

export default function FAQ() {
  const { t } = useTranslation()
  const answerId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: t('landing.faq.q1'),
      a: t('landing.faq.a1'),
    },
    {
      q: t('landing.faq.q2'),
      a: t('landing.faq.a2'),
    },
    {
      q: t('landing.faq.q3'),
      a: t('landing.faq.a3'),
    },
    {
      q: t('landing.faq.q4'),
      a: t('landing.faq.a4'),
    },
    {
      q: t('landing.faq.q5'),
      a: t('landing.faq.a5'),
    },
  ]

  const toggle = (index: number) => {
    setOpenIndex((curr) => (curr === index ? null : index))
  }

  return (
    <section id="faq" className="scroll-mt-20 border-t border-[var(--workspace-line)] bg-[var(--workspace-panel)] py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:gap-16">
        <div>
          <p className="lp-eyebrow lp-gradient-text">{t('landing.nav.faq')}</p>
          <h2 className="lp-section-title mt-3 !text-[clamp(30px,3.6vw,48px)]">
            {t('landing.faq.title')}
          </h2>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[var(--workspace-muted)]">
            {t('landing.faq.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={faq.q} className={`rounded-3xl px-5 py-5 transition-colors sm:px-7 sm:py-6 ${isOpen ? 'bg-[var(--workspace-bg)]' : 'bg-transparent ring-1 ring-inset ring-[var(--workspace-line)] hover:bg-[var(--workspace-hover)]'}`}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 text-left text-[15px] font-semibold leading-relaxed sm:text-[17px]"
                  id={`${answerId}-question-${index}`}
                  aria-controls={`${answerId}-answer-${index}`}
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0">{faq.q}</span>
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${isOpen ? 'bg-[var(--workspace-accent)] text-[var(--workspace-panel)]' : 'bg-[var(--workspace-fill)] text-[var(--workspace-muted)]'}`}>
                    <LuChevronDown
                      className={`h-4 w-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </span>
                </button>
                {isOpen && (
                  <div id={`${answerId}-answer-${index}`} role="region" aria-labelledby={`${answerId}-question-${index}`} className="mt-3 max-w-3xl pr-10 text-[15px] leading-relaxed text-[var(--workspace-muted)]">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
