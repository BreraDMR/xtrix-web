import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LuCircleUser } from 'react-icons/lu'
import LanguageSwitcher from '../LanguageSwitcher'
import { useTranslation } from '../../hooks/useTranslation'

const WIDTHS = { xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl' } as const

// Xtrix mark + whatever this page is about. The logo isn't a link on purpose:
// a guest has nothing to do on the salon-owner landing page.
export function PublicBrand({ title }: { title: string }) {
  return <span className="flex min-w-0 items-center gap-2.5">
    <span aria-hidden="true" className="crm-logo h-8 w-8 shrink-0 text-[17px]">X</span>
    <span className="min-w-0">
      <span className="block text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--workspace-subtle)]">Xtrix</span>
      <span className="block truncate text-[15px] font-semibold leading-tight tracking-tight">{title}</span>
    </span>
  </span>
}

// Frame for every page a guest opens from a link (booking, manage, waitlist offer,
// questionnaire, payment, gift, unsubscribe). Same look as the visitor cabinet and its
// own way in there, never the CRM sidebar.
export default function PublicShell({ title, width = '3xl', actions, children }: {
  title: string
  width?: keyof typeof WIDTHS
  actions?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const max = WIDTHS[width]
  return <div className="crm-workspace min-h-screen bg-[var(--workspace-bg)] text-[var(--workspace-ink)]">
    <header className="sticky top-0 z-20 border-b border-[var(--workspace-hairline)] bg-[color-mix(in_srgb,var(--workspace-bg)_80%,transparent)] backdrop-blur-xl">
      <div className={`mx-auto flex ${max} items-center justify-between gap-3 px-4 py-3 sm:px-6`}>
        <PublicBrand title={title} />
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/visitor/visits" className="ui-button ui-button-quiet !min-h-9 !px-3 !text-xs">
            <LuCircleUser aria-hidden="true" />
            <span className="max-sm:sr-only">{t('visitor.cabinet')}</span>
          </Link>
          <LanguageSwitcher />
          {actions}
        </div>
      </div>
    </header>
    <main className={`mx-auto ${max} px-4 pb-16 pt-6 sm:px-6 sm:pt-10`}>{children}</main>
  </div>
}
