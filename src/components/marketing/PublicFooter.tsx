import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../hooks/useTranslation'
import Modal from '../../ui/Modal'
import Button from '../../ui/Button'
import { LuFileText } from 'react-icons/lu'

export default function PublicFooter() {
  const { t } = useTranslation()
  const [modalDocument, setModalDocument] = useState<'privacy' | 'terms' | null>(null)
  const { token, user } = useAuthStore()
  const isAuthenticated = !!token && !!user
  const product = [
    ['#features', t('landing.nav.features')], ['#assistant', t('landing.ai.eyebrow')], ['#tour', t('landing.nav.tour')],
    ['#pricing', t('landing.nav.pricing')], ['#faq', t('landing.nav.faq')],
  ]

  return (
    <footer id="contact" className="border-t border-[var(--workspace-line)] bg-[var(--workspace-panel)] pb-10 pt-14 sm:pt-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-xs">
            <p className="flex items-center gap-2.5"><span className="crm-logo h-8 w-8 text-[17px]" aria-hidden="true">X</span><span className="text-lg font-semibold tracking-tight">Xtrix</span></p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--workspace-muted)]">{t('landing.footer.tagline')}</p>
          </div>
          <nav aria-label={t('landing.footer.product')}>
            <h2 className="text-xs font-semibold text-[var(--workspace-ink)]">{t('landing.footer.product')}</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[var(--workspace-muted)]">
              {product.map(([href, label]) => <li key={href}><a href={href} className="hover:text-[var(--workspace-ink)]">{label}</a></li>)}
            </ul>
          </nav>
          <div>
            <h2 className="text-xs font-semibold text-[var(--workspace-ink)]">{t('landing.footer.account')}</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[var(--workspace-muted)]">
              {isAuthenticated
                ? <li><Link to="/app" className="hover:text-[var(--workspace-ink)]">{t('landing.cta.open')}</Link></li>
                : <>
                  <li><Link to="/login" className="hover:text-[var(--workspace-ink)]">{t('landing.hero.cta_login')}</Link></li>
                  <li><Link to="/register" className="hover:text-[var(--workspace-ink)]">{t('landing.cta.start')}</Link></li>
                </>}
              <li><Link to="/visitor/visits" className="hover:text-[var(--workspace-ink)]">{t('landing.nav.clientCabinet')}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[var(--workspace-ink)]">{t('landing.footer.legal')}</h2>
            <ul className="mt-4 grid gap-3 text-sm text-[var(--workspace-muted)]">
              <li><button type="button" onClick={() => setModalDocument('privacy')} className="text-left hover:text-[var(--workspace-ink)]">{t('landing.footer.privacy')}</button></li>
              <li><button type="button" onClick={() => setModalDocument('terms')} className="text-left hover:text-[var(--workspace-ink)]">{t('landing.footer.terms')}</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--workspace-line)] pt-6 text-xs leading-relaxed text-[var(--workspace-muted)] sm:flex-row sm:items-start sm:justify-between">
          <span>© {new Date().getFullYear()} Xtrix. {t('landing.footer.rights')}</span>
          <p className="flex items-start gap-2 sm:max-w-md sm:text-right"><LuFileText className="h-4 w-4 shrink-0" aria-hidden="true" />{t('landing.footer.status_preview')}</p>
        </div>
      </div>
      {modalDocument && <Modal title={modalDocument === 'privacy' ? t('landing.footer.privacy') : t('landing.footer.terms')} onClose={() => setModalDocument(null)}>
        <div className="p-5">
          <p className="rounded-md border border-[var(--workspace-line)] bg-[var(--workspace-bg)] p-3 text-xs font-medium text-[var(--workspace-muted)]">{t('landing.footer.status_preview')}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--workspace-muted)]">
            {t(modalDocument === 'privacy' ? 'landing.footer.privacy_preview' : 'landing.footer.terms_preview')}
          </p>
          <div className="mt-6 flex justify-end"><Button variant="secondary" onClick={() => setModalDocument(null)}>{t('common.close')}</Button></div>
        </div>
      </Modal>}
    </footer>
  )
}
