import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signOut } from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import { useSyncUiLanguage } from '../hooks/useUiLanguage'
import { useMyBusiness } from '../hooks/useMyBusiness'
import AssistantLauncher from './assistant/AssistantLauncher'
import {
  HiOutlineViewGrid, HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineCalendar,
  HiOutlinePaperClip, HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineChartBar,
  HiOutlineHeart, HiOutlineCog, HiOutlineBriefcase, HiOutlineDocumentText,
  HiOutlineMenuAlt2, HiOutlineX, HiOutlineChevronRight, HiOutlineChevronLeft,
} from 'react-icons/hi'

const icons: Record<string, ComponentType<{ className?: string }>> = {
  '/': HiOutlineViewGrid, '/clients': HiOutlineUsers, '/visits': HiOutlineOfficeBuilding,
  '/calendar': HiOutlineCalendar, '/services': HiOutlinePaperClip, '/inventory': HiOutlineShoppingCart,
  '/finance': HiOutlineCurrencyDollar, '/analytics': HiOutlineChartBar, '/loyalty': HiOutlineHeart,
  '/employees': HiOutlineUsers, '/business': HiOutlineBriefcase, '/subscription': HiOutlineDocumentText,
  '/my-salary': HiOutlineCurrencyDollar, '/settings': HiOutlineCog,
}

export default function Layout() {
  const { user } = useAuthStore()
  const { data: business } = useMyBusiness(!!user)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)
  const sidebar = useRef<HTMLElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  useSyncUiLanguage()

  useEffect(() => {
    const online = () => setOffline(false)
    const offline = () => setOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname])
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const trigger = menuButton.current
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const controls = () => Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a,button') || [])
      .filter((el) => el.getClientRects().length > 0)
    controls()[0]?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
      if (event.key !== 'Tab') return
      const nodes = controls()
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', keydown)
      trigger?.focus()
    }
  }, [isMobileMenuOpen])

  const managesBusiness = user?.role === 'admin' || user?.role === 'business_owner'
  const primaryItems = [
    { path: '/', label: t('nav.dashboard') }, { path: '/clients', label: t('nav.clients') },
    { path: '/visits', label: t('nav.visits') }, { path: '/calendar', label: t('nav.calendar') },
    { path: '/services', label: t('nav.services') },
    ...(managesBusiness ? [{ path: '/inventory', label: t('nav.inventory') }, { path: '/finance', label: t('nav.finance') }] : []),
  ]
  const manageItems = managesBusiness ? [
    { path: '/analytics', label: t('nav.analytics') }, { path: '/loyalty', label: t('nav.loyalty') },
    { path: '/employees', label: t('nav.employees') },
  ] : []
  const systemItems = [
    ...(managesBusiness ? [{ path: '/business', label: t('nav.business') }] : []),
    ...(managesBusiness || (user?.role === 'specialist' && !user.employer_id) ? [{ path: '/subscription', label: t('nav.subscription') }] : []),
    ...(user?.role === 'employee' || user?.role === 'specialist' ? [{ path: '/my-salary', label: t('nav.my_salary') }] : []),
    { path: '/settings', label: t('nav.settings') },
  ]
  const active = [...primaryItems, ...manageItems, ...systemItems].find(({ path }) =>
    path === '/' ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + '/'))
  const workspaceName = business?.name || t('nav.business')
  const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const links = (items: { path: string; label: string }[]) => items.map(({ path, label }) => {
    const Icon = icons[path]
    const selected = path === '/' ? location.pathname === path : location.pathname === path || location.pathname.startsWith(path + '/')
    return <Link key={path} to={path} className="crm-navlink" aria-current={selected ? 'page' : undefined}
      onClick={() => setIsMobileMenuOpen(false)}>
      <Icon className="h-[18px] w-[18px] shrink-0" /><span className="crm-navtext truncate">{label}</span>
    </Link>
  })

  return (
    <div className="crm-app min-h-screen" data-sidebar-compact={isCompact}>
      {isMobileMenuOpen && <button className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px] lg:hidden"
        aria-label={t('common.close')} onClick={() => setIsMobileMenuOpen(false)} />}
      <aside ref={sidebar} id="workspace-navigation" role={isMobileMenuOpen ? 'dialog' : undefined}
        aria-modal={isMobileMenuOpen || undefined} aria-label={t('nav.primary')}
        className={`crm-sidebar fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden transition-transform duration-200 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="crm-brand flex h-[90px] shrink-0 items-center gap-3 px-8">
          <Link to="/" aria-label="Xtrix" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-gray-900 text-[25px] font-medium leading-none text-white dark:bg-white dark:text-gray-900">x</span>
            <span className="crm-navtext text-[25px] font-semibold tracking-[-1.2px]">Xtrix</span>
          </Link>
          <button className="ml-auto p-1 text-gray-500 lg:hidden" aria-label={t('common.close')} onClick={() => setIsMobileMenuOpen(false)}><HiOutlineX className="h-5 w-5" /></button>
        </div>
        <div className="crm-business mx-[18px] mb-2 flex shrink-0 items-center gap-2.5 rounded-[14px] border border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{initials(workspaceName)}</span>
          <div className="crm-navtext min-w-0"><p className="truncate text-xs font-semibold">{workspaceName}</p><p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{t('nav.business')}</p></div>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5">
          <div className="crm-navlabel">{t('nav.primary')}</div>{links(primaryItems)}
          {manageItems.length > 0 && <><div className="crm-navlabel">{t('nav.manage')}</div>{links(manageItems)}</>}
          <div className="crm-navlabel">{t('nav.system')}</div>{links(systemItems)}
        </nav>
      </aside>
      <div className="crm-workspace flex min-h-screen min-w-0 flex-col">
        <header className="crm-header flex h-16 shrink-0 items-center justify-between gap-3 px-5 lg:h-[76px] lg:px-11">
          <div className="flex min-w-0 items-center gap-3">
            <button className="hidden rounded-lg p-2 text-gray-600 lg:inline-flex dark:text-gray-300"
              aria-label={t(isCompact ? 'nav.expand_menu' : 'nav.collapse_menu')}
              aria-controls="workspace-navigation" aria-expanded={!isCompact}
              onClick={() => setIsCompact((compact) => !compact)}>
              {isCompact ? <HiOutlineChevronRight className="h-5 w-5" /> : <HiOutlineChevronLeft className="h-5 w-5" />}
            </button>
            <button ref={menuButton} className="-ml-1 p-1 text-gray-600 lg:hidden dark:text-gray-300"
              aria-label={t('nav.primary')} aria-controls="workspace-navigation" aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}><HiOutlineMenuAlt2 className="h-5 w-5" /></button>
            <div className="hidden min-w-0 items-center gap-2 text-xs text-gray-500 sm:flex"><span className="max-w-40 truncate">{workspaceName}</span><HiOutlineChevronRight className="h-3 w-3" /><span className="truncate text-gray-800 dark:text-gray-200">{active?.label}</span></div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <AssistantLauncher />
            <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-gray-200 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{initials(user?.full_name || 'U')}</span><span className="hidden max-w-40 truncate text-xs sm:inline">{user?.full_name}</span></div>
            <button className="rounded-lg px-2 py-2 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => { signOut(); navigate('/login', { replace: true }) }}>{t('nav.logout')}</button>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1540px] flex-1 p-5 pt-8 lg:p-11">
          {offline && <div role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">{t('common.offline')}</div>}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
