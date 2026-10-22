import { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { HiOutlineDocumentText } from 'react-icons/hi'

export default function PublicFooter() {
  const { t } = useTranslation()
  const [modalDocument, setModalDocument] = useState<'privacy' | 'terms' | null>(null)

  return (
    <footer id="contact" className="border-t border-[var(--workspace-line)] py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-lg font-semibold tracking-tight">Xtrix</span>
            <span className="text-xs leading-relaxed text-[var(--workspace-muted)]">© {new Date().getFullYear()} Xtrix. {t('landing.footer.rights')}</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-[var(--workspace-muted)]">
            <button type="button" onClick={() => setModalDocument('privacy')} className="text-left hover:text-[var(--workspace-accent)]">{t('landing.footer.privacy')}</button>
            <button type="button" onClick={() => setModalDocument('terms')} className="text-left hover:text-[var(--workspace-accent)]">{t('landing.footer.terms')}</button>
          </div>
        </div>
        <p className="mt-6 flex items-start gap-2 border-t border-[var(--workspace-line)] pt-5 text-[11px] leading-relaxed text-[var(--workspace-muted)]"><HiOutlineDocumentText className="h-4 w-4 shrink-0" aria-hidden="true" />{t('landing.footer.status_preview')}</p>
      </div>
      {modalDocument && <Modal title={modalDocument === 'privacy' ? t('landing.footer.privacy') : t('landing.footer.terms')} onClose={() => setModalDocument(null)}>
        <div className="p-5">
          <p className="rounded-md border border-[var(--workspace-line)] bg-[var(--workspace-bg)] p-3 text-xs font-medium text-[var(--workspace-muted)]">{t('landing.footer.status_preview')}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--workspace-muted)]">
            {modalDocument === 'privacy'
              ? 'Xtrix обеспечивает изоляцию данных салонов и клиентов. Персональные данные используются исключительно для предоставления услуг бронирования и ведения клиентской базы соответствующего бизнеса.'
              : 'Использование сервиса регулируется условиями подписки и правилами безопасности. Настоящий проект находится в активной разработке, коммерческие реквизиты будут опубликованы до запуска публичных платежей.'}
          </p>
          <div className="mt-6 flex justify-end"><Button variant="secondary" onClick={() => setModalDocument(null)}>{t('common.close')}</Button></div>
        </div>
      </Modal>}
    </footer>
  )
}
