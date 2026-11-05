import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from '../hooks/useTranslation'
import {
  LuLayoutGrid,
  LuUserPen,
  LuDoorOpen,
  LuCalendar,
  LuHandshake,
  LuCircleDollarSign,
  LuShoppingCart,
  LuChartLine,
  LuHeart,
  LuCircleUser,
  LuBriefcase,
  LuReceiptText,
  LuWallet,
  LuSettings,
  LuLogOut,
  LuMenu,
  LuX,
} from 'react-icons/lu'

type NavItem = { path: string; label: string }

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  '/': LuLayoutGrid,
  '/clients': LuUserPen,
  '/visits': LuDoorOpen,
  '/calendar': LuCalendar,
  '/services': LuHandshake,
  '/finance': LuCircleDollarSign,
  '/inventory': LuShoppingCart,
  '/analytics': LuChartLine,
  '/loyalty': LuHeart,
  '/employees': LuCircleUser,
  '/business': LuBriefcase,
  '/subscription': LuReceiptText,
  '/my-salary': LuWallet,
  '/settings': LuSettings,
}

export function XLogo({ className = 'h-8 w-8 text-xl' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-lg bg-brand-gradient-diag font-black text-white ${className}`}>
      <span style={{ fontFamily: 'Impact, "Arial Narrow", sans-serif' }}>X</span>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const isManager = user?.role === 'admin' || user?.role === 'business_owner'

  const primaryItems: NavItem[] = [
    { path: '/', label: t('nav.dashboard') },
    { path: '/clients', label: t('nav.clients') },
    { path: '/visits', label: t('nav.visits') },
    { path: '/calendar', label: t('nav.calendar') },
    { path: '/services', label: t('nav.services') },
    ...(isManager
      ? [
          { path: '/finance', label: t('nav.finance') },
          { path: '/inventory', label: t('nav.inventory') },
        ]
      : []),
  ]

  const manageItems: NavItem[] = isManager
    ? [
        { path: '/analytics', label: t('nav.analytics') },
        { path: '/loyalty', label: t('nav.loyalty') },
        { path: '/employees', label: t('nav.employees') },
      ]
    : []

  const systemItems: NavItem[] = [
    ...(isManager ? [{ path: '/business', label: t('nav.business') }] : []),
    ...(isManager || (user?.role === 'specialist' && !user?.employer_id)
      ? [{ path: '/subscription', label: t('nav.subscription') }]
      : []),
    ...(user?.role === 'employee' || user?.role === 'specialist'
      ? [{ path: '/my-salary', label: t('nav.my_salary') }]
      : []),
    { path: '/settings', label: t('nav.settings') },
  ]

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(path + '/')

  const renderSection = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null
    return (
      <div>
        <div className="nav-section">{title}</div>
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = iconMap[item.path]
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`nav-item touch-manipulation ${active ? 'nav-item-active' : ''}`}
              >
                <span className={`nav-icon ${active ? 'nav-icon-active' : ''}`}>
                  {Icon && <Icon className="h-4 w-4" />}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-brand-bg dark:bg-[#14121a]">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside
        className={`fixed z-50 flex h-screen w-64 flex-col overflow-hidden bg-white transition-transform duration-300 ease-in-out dark:bg-[#1c1924] ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-shrink-0 items-center justify-between px-7 pb-4 pt-8">
          <Link to="/" aria-label="Xtrix">
            <XLogo />
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-lg p-1 text-gray-600 hover:bg-brand-lavender lg:hidden"
            aria-label="Close menu"
          >
            <LuX className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-7 pb-4">
          {renderSection(t('nav.primary'), primaryItems)}
          {renderSection(t('nav.manage'), manageItems)}
          {renderSection(t('nav.system'), systemItems)}
        </nav>

        <div className="flex-shrink-0 border-t border-[#efeff3] px-7 py-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-gradient-diag text-sm font-bold text-white">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-brand-ink dark:text-white">{user?.full_name || 'User'}</div>
              {user?.role && <div className="truncate text-[11px] font-semibold capitalize text-[#6b6b76]">{user.role.replace('_', ' ')}</div>}
            </div>
            <button
              onClick={handleLogout}
              className="btn-icon border-transparent text-[#6b6b76] hover:text-[#c81e1e]"
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
            >
              <LuLogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen w-full flex-1 flex-col lg:ml-64 lg:w-auto">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-white/90 px-4 backdrop-blur lg:hidden dark:bg-[#1c1924]/90">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-brand-ink hover:bg-brand-lavender dark:text-white"
            aria-label="Open menu"
          >
            <LuMenu className="h-6 w-6" />
          </button>
          <XLogo className="h-7 w-7 text-lg" />
          <div className="w-10" />
        </header>

        <main className="flex-1 animate-fade-in overflow-y-auto px-4 py-6 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-[1100px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
