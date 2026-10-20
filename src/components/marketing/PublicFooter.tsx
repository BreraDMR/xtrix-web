import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { HiOutlineDocumentText, HiOutlineMail, HiOutlineX } from 'react-icons/hi'

export default function PublicFooter() {
  const { t } = useTranslation()
  const [modalDocument, setModalDocument] = useState<'privacy' | 'terms' | null>(null)

  return (
    <footer id="contact" className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-slate-900 text-[20px] font-semibold leading-none text-white dark:bg-white dark:text-slate-900">
              x
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Xtrix
            </span>
            <span className="ml-3 text-xs text-slate-500">
              © {new Date().getFullYear()} Xtrix. {t('landing.footer.rights')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setModalDocument('privacy')}
              className="transition hover:text-slate-900 dark:hover:text-white"
            >
              {t('landing.footer.privacy')}
            </button>
            <button
              type="button"
              onClick={() => setModalDocument('terms')}
              className="transition hover:text-slate-900 dark:hover:text-white"
            >
              {t('landing.footer.terms')}
            </button>
            <span className="flex items-center gap-1.5 text-slate-500">
              <HiOutlineMail className="h-4 w-4" />
              <span>{t('landing.footer.contact_support')}: support@xtrix.app</span>
            </span>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center text-[11px] text-slate-400 dark:border-slate-900">
          <span>{t('landing.footer.status_preview')}</span>
        </div>
      </div>

      {/* Document Preview Modal */}
      {modalDocument && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HiOutlineDocumentText className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold">
                  {modalDocument === 'privacy'
                    ? t('landing.footer.privacy')
                    : t('landing.footer.terms')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDocument(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                aria-label={t('common.close')}
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 font-medium">
                {t('landing.footer.status_preview')}
              </div>
              <p>
                {modalDocument === 'privacy'
                  ? 'Xtrix обеспечивает изоляцию данных салонов и клиентов. Персональные данные используются исключительно для предоставления услуг бронирования и ведения клиентской базы соответствующего бизнеса.'
                  : 'Использование сервиса регулируется условиями подписки и правилами безопасности. Настоящий проект находится в активной разработке, коммерческие реквизиты будут опубликованы до запуска публичных платежей.'}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalDocument(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
