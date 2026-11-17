import { Component, type ReactNode } from 'react'
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom'
import { LuCalendarDays, LuCircleUser } from 'react-icons/lu'
import LanguageSwitcher from '../LanguageSwitcher'
import { useTranslation } from '../../hooks/useTranslation'
import { useVisitorSession } from '../../store/visitorSession'
import { loginPath } from './links'

type Tone = 'info' | 'success' | 'warning' | 'error'
const TONES: Record<Tone, string> = {
  info: 'bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]',
  success: 'bg-[var(--tint-green)] text-[var(--tint-green-ink)]',
  warning: 'bg-[var(--tint-amber)] text-[var(--tint-amber-ink)]',
  error: 'bg-[var(--tint-red)] text-[var(--tint-red-ink)]',
}

export function Notice({ tone = 'info', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${TONES[tone]} ${className}`}>{children}</div>
}

// Signed-in cabinet frame: its own header, never the CRM sidebar.
export function VisitorShell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const { t } = useTranslation()
  const link = ({ isActive }: { isActive: boolean }) => `inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors ${isActive
    ? 'bg-[var(--workspace-panel)] text-[var(--workspace-ink)] shadow-[0_1px_2px_rgba(0,0,0,.05),0_4px_12px_rgba(0,0,0,.05)]'
    : 'text-[var(--workspace-muted)] hover:text-[var(--workspace-ink)]'}`
  return <div className="crm-workspace min-h-screen bg-[var(--workspace-bg)] text-[var(--workspace-ink)]">
    <header className="sticky top-0 z-20 border-b border-[var(--workspace-hairline)] bg-[color-mix(in_srgb,var(--workspace-bg)_80%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/visitor/visits" className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="crm-logo h-8 w-8 shrink-0 text-[17px]">X</span>
          <span className="truncate text-[15px] font-semibold tracking-tight">{t('visitor.cabinet')}</span>
        </Link>
        <LanguageSwitcher />
      </div>
      <nav aria-label={t('visitor.cabinet')} className="mx-auto flex max-w-3xl gap-1 px-3 pb-2.5 sm:px-5">
        <NavLink to="/visitor/visits" className={link}><LuCalendarDays className="h-4 w-4" aria-hidden="true" />{t('visitor.nav.visits')}</NavLink>
        <NavLink to="/visitor/profile" className={link}><LuCircleUser className="h-4 w-4" aria-hidden="true" />{t('visitor.nav.profile')}</NavLink>
      </nav>
    </header>
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </main>
  </div>
}

// Cabinet pages need a visitor session; without one they go to the visitor login and come back.
export function RequireVisitor({ children }: { children: ReactNode }) {
  const session = useVisitorSession(state => state.session)
  const location = useLocation()
  if (!session) return <Navigate to={loginPath(location.pathname)} replace />
  return <>{children}</>
}

// One broken card (odd data from one salon) must not take the rest of the screen with it.
export class Isolated extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { /* shown as the fallback */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
