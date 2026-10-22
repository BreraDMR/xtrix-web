import { useId, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { HiOutlineChevronDown } from 'react-icons/hi'

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
    <section id="faq" className="scroll-mt-24 border-t border-[var(--workspace-line)] bg-[var(--workspace-panel)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-16">
          <h2 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {t('landing.faq.title')}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--workspace-muted)] sm:text-base">
            {t('landing.faq.subtitle')}
          </p>
        </div>

        <div className="mt-10 divide-y divide-[var(--workspace-line)] border-y border-[var(--workspace-line)]">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={faq.q} className="py-5 sm:py-6">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-start justify-between gap-4 text-left text-sm font-semibold leading-relaxed hover:text-[var(--workspace-accent)] sm:text-base"
                  id={`${answerId}-question-${index}`}
                  aria-controls={`${answerId}-answer-${index}`}
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0">{faq.q}</span>
                  <span className="flex h-6 shrink-0 items-center">
                    <HiOutlineChevronDown
                      className={`h-5 w-5 transform transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[var(--workspace-accent)]' : 'text-[var(--workspace-muted)]'
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </button>
                {isOpen && (
                  <div id={`${answerId}-answer-${index}`} role="region" aria-labelledby={`${answerId}-question-${index}`} className="mt-3 max-w-4xl pr-9 text-sm leading-relaxed text-[var(--workspace-muted)]">
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
