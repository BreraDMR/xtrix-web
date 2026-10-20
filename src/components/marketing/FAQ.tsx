import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { HiOutlineChevronDown } from 'react-icons/hi'

export default function FAQ() {
  const { t } = useTranslation()
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
    <section id="faq" className="scroll-mt-16 py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('landing.faq.title')}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            {t('landing.faq.subtitle')}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-slate-200/80 dark:divide-slate-800">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={faq.q} className="py-5">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-start justify-between text-left text-base font-semibold text-slate-900 transition hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                  aria-expanded={isOpen}
                >
                  <span className="pr-4">{faq.q}</span>
                  <span className="ml-4 flex h-7 items-center">
                    <HiOutlineChevronDown
                      className={`h-5 w-5 transform transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </button>
                {isOpen && (
                  <div className="mt-3 pr-12 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
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
