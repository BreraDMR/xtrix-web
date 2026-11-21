import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { signOut } from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import { useSyncUiLanguage } from '../hooks/useUiLanguage'
import { useMyBusiness } from '../hooks/useMyBusiness'
import { useSidebarPreference } from '../hooks/useSidebarPreference'
import AssistantLauncher from './assistant/AssistantLauncher'
import { useWorkspaceAccess, WorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import AccessNotice from './subscription/AccessNotice'
import PilotSubscription from './subscription/PilotSubscription'
import LoadingSpinner from './LoadingSpinner'
import QueryError from './QueryError'
import VisitForm from './VisitForm'
import { format } from 'date-fns'
import { cs, enUS, ru } from 'date-fns/locale'
import { useLocaleStore } from '../store/localeStore'
import type { VisitOut } from '../api/types'
import Button from '../ui/Button'
import SidePanel from '../ui/SidePanel'
import { useLabels } from '../i18n/labels'
import {
  LuBell, LuBriefcase, LuCircleCheck, LuCalendar, LuChartLine, LuChevronLeft, LuChevronRight, LuCircleDollarSign, LuCircleUser, LuClipboardList, LuClock, LuDoorOpen, LuHandshake, LuHeart, LuIdCard, LuLayoutGrid, LuLogOut, LuMegaphone, LuMenu, LuPlus, LuReceiptText, LuSettings, LuShieldCheck, LuShoppingCart, LuUpload, LuUserPen, LuUserPlus, LuWallet, LuX,
} from 'react-icons/lu'

const icons: Record<string, ComponentType<{ className?: string }>> = {
  '/app': LuLayoutGrid, '/app/clients': LuUserPen, '/app/visits': LuDoorOpen,
  '/app/calendar': LuCalendar, '/app/schedules': LuClock, '/app/services': LuHandshake,
  '/app/questionnaires': LuClipboardList, '/app/inventory': LuShoppingCart,
  '/app/finance': LuCircleDollarSign, '/app/analytics': LuChartLine, '/app/loyalty': LuHeart,
  '/app/employees': LuCircleUser, '/app/business': LuBriefcase, '/app/subscription': LuReceiptText,
  '/app/my-salary': LuWallet, '/app/settings': LuSettings,
  '/app/notifications': LuBell, '/app/waitlist': LuUserPlus,
  '/app/campaigns': LuMegaphone, '/app/audit': LuShieldCheck,
  '/app/import': LuUpload, '/app/profile': LuIdCard,
}


export default function Layout() {
  const { user } = useAuthStore()
  const accessQuery = useWorkspaceAccess()
  const access = accessQuery.data
  const { data: business } = useMyBusiness(!!user && !!access && access.crm_mode !== 'blocked')
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { role: roleLabel } = useLabels()
  const queryClient = useQueryClient()
  const [isCreatingVisit, setIsCreatingVisit] = useState(false)
  // after a visit is made from the header: say which one and offer to open it again
  const [createdVisit, setCreatedVisit] = useState<VisitOut | null>(null)
  const [openedVisit, setOpenedVisit] = useState<number | null>(null)
  const locale = useLocaleStore((state) => state.locale)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCompact, setIsCompact] = useSidebarPreference()
  const [offline, setOffline] = useState(!navigator.onLine)
  const sidebar = useRef<HTMLElement>(null)
  useSyncUiLanguage()

  // the notice belongs to the page it was made on
  useEffect(() => { setCreatedVisit(null) }, [location.pathname])

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
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
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
  const managesSchedule = managesBusiness || user?.role === 'specialist'
  const managesQuestionnaires = managesBusiness || (user?.role === 'specialist' && !user.employer_id)
  const managesWaitlist = managesBusiness || (user?.role === 'specialist' && !user.employer_id)
  const canReadAudit = managesBusiness || (user?.role === 'specialist' && !user.employer_id)
  const canImport = canReadAudit
  const primaryItems = [
    { path: '/app', label: t('nav.dashboard') },
    { path: '/app/calendar', label: t('nav.calendar') },
    { path: '/app/clients', label: t('nav.clients') },
    { path: '/app/visits', label: t('nav.visits') },
    ...(managesWaitlist ? [{ path: '/app/waitlist', label: t('nav.waitlist') }] : []),
  ]
  const manageItems = [
    { path: '/app/services', label: t('nav.services') },
    ...(managesSchedule ? [{ path: '/app/schedules', label: t('nav.schedule') }] : []),
    ...(managesQuestionnaires && !access?.pilot_mode ? [{ path: '/app/questionnaires', label: t('nav.questionnaires') }] : []),
    ...(managesBusiness ? [
      { path: '/app/employees', label: t('nav.employees') },
      { path: '/app/inventory', label: t('nav.inventory') },
      { path: '/app/loyalty', label: t('nav.loyalty') },
    ] : []),
    ...(managesBusiness && !access?.pilot_mode ? [{ path: '/app/campaigns', label: t('nav.campaigns') }] : []),
  ]
  // money and history pages people open now and then, not every day
  const reportItems = [
    ...(managesBusiness ? [
      { path: '/app/finance', label: t('nav.finance') },
      { path: '/app/analytics', label: t('nav.analytics') },
    ] : []),
    ...(canReadAudit ? [{ path: '/app/audit', label: t('nav.audit') }] : []),
  ]
  const systemItems = [
    ...(managesBusiness ? [{ path: '/app/business', label: t('nav.business') }] : []),
    ...(managesBusiness || (user?.role === 'specialist' && !user.employer_id) ? [{ path: '/app/subscription', label: t('nav.subscription') }] : []),
    ...(!access?.pilot_mode && (managesBusiness || (user?.role === 'specialist' && !user.employer_id)) ? [{ path: '/app/notifications', label: t('nav.notifications') }] : []),
    ...(canImport ? [{ path: '/app/import', label: t('nav.import') }] : []),
    // only people someone pays have a salary - a solo specialist works for themselves
    ...(user?.role === 'employee' || (user?.role === 'specialist' && user.employer_id) ? [{ path: '/app/my-salary', label: t('nav.my_salary') }] : []),
    ...(user?.role === 'specialist' ? [{ path: '/app/profile', label: t('nav.profile') }] : []),
    { path: '/app/settings', label: t('nav.settings') },
  ]
  const active = [...primaryItems, ...manageItems, ...reportItems, ...systemItems].find(({ path }) =>
    path === '/app' ? (location.pathname === '/app' || location.pathname === '/app/') : (location.pathname === path || location.pathname.startsWith(path + '/')))
  const workspaceName = business?.name || t('nav.business')
  const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const links = (items: { path: string; label: string }[]) => items.map(({ path, label }) => {
    const Icon = icons[path]
    const selected = path === '/app' ? (location.pathname === '/app' || location.pathname === '/app/') : (location.pathname === path || location.pathname.startsWith(path + '/'))
    return <Link key={path} to={path} className="crm-navlink" aria-label={label} title={label} aria-current={selected ? 'page' : undefined}
      onClick={() => setIsMobileMenuOpen(false)}>
      <span className="crm-navicon"><Icon className="h-4 w-4" /></span><span className="crm-navtext truncate">{label}</span>
    </Link>
  })

  const groups = [
    { id: 'primary', label: t('nav.primary'), items: primaryItems },
    { id: 'manage', label: t('nav.manage'), items: manageItems },
    { id: 'reports', label: t('nav.reports'), items: reportItems },
    { id: 'system', label: t('nav.system'), items: systemItems },
  ].filter(group => group.items.length > 0)

  const isBilling = location.pathname === '/app/subscription'
  // the one place a new visit starts from; calendar slots still prefill their own form
  const canCreateVisit = access?.crm_mode === 'full'
  const refreshVisits = () => {
    for (const key of ['visits', 'visits-statistics', 'profit-current-month', 'clients-statistics', 'client-visits', 'client-overview']) {
      void queryClient.invalidateQueries({ queryKey: [key] })
    }
  }
  const savedVisit = (visit?: VisitOut) => {
    setIsCreatingVisit(false)
    setCreatedVisit(visit && typeof visit.id === 'number' ? visit : null)
    refreshVisits()
  }
  const savedOpenedVisit = () => {
    setOpenedVisit(null)
    setCreatedVisit(null)
    refreshVisits()
  }
  const isUnavailable = access?.pilot_mode && ['/app/campaigns', '/app/questionnaires', '/app/notifications'].some(path => location.pathname === path || location.pathname.startsWith(path + '/'))

  return (
    <WorkspaceAccessContext.Provider value={access ?? null}>
    <div className="crm-app min-h-screen" data-sidebar-compact={isCompact}>
      {isMobileMenuOpen && <button className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px] lg:hidden"
        aria-label={t('common.close')} onClick={() => setIsMobileMenuOpen(false)} />}
      {/* closed on a phone it is only slid away, so hide it too - otherwise Tab walks through 20 links you can't see */}
      <aside ref={sidebar} id="workspace-navigation" role={isMobileMenuOpen ? 'dialog' : undefined}
        aria-modal={isMobileMenuOpen || undefined} aria-label={t('nav.primary')}
        className={`crm-sidebar fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden transition-[transform,visibility] duration-200 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible'} lg:translate-x-0`}>
        <div className="crm-brand flex h-[88px] shrink-0 items-center gap-3">
          <Link to="/app" aria-label="Xtrix" className="flex items-center gap-2.5">
            <span className="crm-logo h-8 w-8 text-[17px]">X</span>
            <span className="crm-navtext font-display text-[19px] font-semibold tracking-[-0.03em]">Xtrix</span>
          </Link>
          <button className="ml-auto p-1 text-gray-500 lg:hidden" aria-label={t('common.close')} onClick={() => setIsMobileMenuOpen(false)}><LuX className="h-5 w-5" /></button>
        </div>
        <div title={workspaceName} className="crm-business mb-2 flex shrink-0 items-center gap-2.5 rounded-xl border border-[var(--workspace-hairline)] bg-[var(--workspace-panel)] shadow-sm">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-gradient-diag text-[11px] font-semibold text-white">{initials(workspaceName)}</span>
          <div className="crm-navtext min-w-0"><p className="truncate text-xs font-semibold">{workspaceName}</p><p className="mt-0.5 truncate text-[10px] text-[var(--workspace-muted)]">{user?.role ? roleLabel(user.role) : t('nav.business')}</p></div>
        </div>
        <nav aria-label={t('nav.primary')} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5">
          {groups.map(group => <div key={group.id} role="group" aria-labelledby={`nav-group-${group.id}`}>
            <div id={`nav-group-${group.id}`} className="crm-navlabel">{group.label}</div>{links(group.items)}
          </div>)}
        </nav>
      </aside>
      <div className="crm-workspace flex min-h-screen min-w-0 flex-col">
        <header className="crm-header flex h-[60px] shrink-0 items-center justify-between gap-3 px-4 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="hidden rounded-lg p-2 text-gray-600 lg:inline-flex dark:text-gray-300"
              aria-label={t(isCompact ? 'nav.expand_menu' : 'nav.collapse_menu')}
              title={t(isCompact ? 'nav.expand_menu' : 'nav.collapse_menu')}
              aria-controls="workspace-navigation" aria-expanded={!isCompact}
              onClick={() => setIsCompact((compact) => !compact)}>
              {isCompact ? <LuChevronRight className="h-5 w-5" /> : <LuChevronLeft className="h-5 w-5" />}
            </button>
            <button className="-ml-2.5 inline-grid h-10 w-10 place-items-center rounded-lg text-gray-600 lg:hidden dark:text-gray-300"
              aria-label={t('nav.menu')} aria-controls="workspace-navigation" aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}><LuMenu className="h-5 w-5" /></button>
            <div className="min-w-0 items-center gap-2 text-xs text-gray-500 flex"><span className="max-w-28 truncate sm:max-w-40">{workspaceName}</span>{active && <><LuChevronRight className="hidden h-3 w-3 sm:block" /><span className="hidden truncate text-gray-800 sm:block dark:text-gray-200">{active.label}</span></>}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {canCreateVisit && <Button aria-label={t('visits.newVisit')} title={t('visits.newVisit')} className="max-sm:!px-2.5"
              onClick={() => setIsCreatingVisit(true)}><LuPlus aria-hidden="true" /><span className="hidden sm:inline">{t('visits.newVisit')}</span></Button>}
            {access && access.crm_mode !== 'blocked' && <AssistantLauncher />}
            <div className="flex items-center gap-2" title={user?.full_name}><span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-brand-gradient-diag text-[11px] font-semibold text-white">{initials(user?.full_name || 'U')}</span><span className="sr-only max-w-40 truncate text-[13px] font-medium xl:not-sr-only">{user?.full_name}</span></div>
            <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-[var(--workspace-muted)] transition-colors hover:bg-[var(--workspace-hover)] hover:text-[var(--workspace-ink)]" onClick={() => { signOut(); navigate('/login', { replace: true }) }}><LuLogOut aria-hidden="true" className="h-4 w-4" />{t('nav.logout')}</button>
          </div>
        </header>
        <main id="workspace-main" className="crm-main mx-auto w-full min-w-0 max-w-[1540px] flex-1 p-4 pt-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(88px+env(safe-area-inset-bottom))] lg:p-8">
          {offline && <div role="status" className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-100">{t('common.offline')}</div>}
          {createdVisit && <div role="status" aria-labelledby="visit-created-title"
            className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-4 py-2.5 text-sm shadow-sm">
            <LuCircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--tone-success)]" />
            <span id="visit-created-title" className="font-semibold">{t('visits.created')}</span>
            <span className="min-w-0 text-[var(--workspace-muted)] [overflow-wrap:anywhere]">
              {[createdVisit.client_name, createdVisit.date_start && format(new Date(createdVisit.date_start), 'PPp',
                { locale: locale === 'ru' ? ru : locale === 'cz' ? cs : enUS })].filter(Boolean).join(' · ')}
            </span>
            <span className="ml-auto flex items-center gap-1">
              {canCreateVisit && <Button variant="quiet" className="!min-h-0 !py-1" onClick={() => setOpenedVisit(createdVisit.id)}>{t('visits.openVisit')}</Button>}
              <button type="button" aria-label={t('common.close')} title={t('common.close')} onClick={() => setCreatedVisit(null)}
                className="rounded-full p-1.5 text-[var(--workspace-muted)] hover:bg-[var(--workspace-hover)] hover:text-[var(--workspace-ink)]"><LuX aria-hidden="true" className="h-4 w-4" /></button>
            </span>
          </div>}
          {accessQuery.isLoading ? <LoadingSpinner /> : accessQuery.isError ? <QueryError retry={accessQuery.refetch} /> : !access ? null
            : access.crm_mode === 'blocked' && !isBilling ? <PilotSubscription access={access} />
              : isUnavailable ? <p role="status" className="rounded-xl border border-gray-200 p-6 dark:border-gray-700">{t('pilot.unavailable')}</p>
                : <>
                  {!isBilling && <AccessNotice access={access} />}
                  {/* read-only keeps search, paging and calendar navigation working; the API refuses changes */}
                  <Outlet />
                </>}
        </main>
      </div>
      {isCreatingVisit && canCreateVisit && <SidePanel title={t('visits.newVisit')} onClose={() => setIsCreatingVisit(false)}>
        <VisitForm onSuccess={savedVisit} onCancel={() => setIsCreatingVisit(false)} />
      </SidePanel>}
      {openedVisit !== null && canCreateVisit && <SidePanel title={t('visits.editVisit')} onClose={() => setOpenedVisit(null)}>
        <VisitForm visitId={openedVisit} onSuccess={savedOpenedVisit} onCancel={() => setOpenedVisit(null)} />
      </SidePanel>}
      <nav className="crm-mobile-nav" aria-label={t('nav.quick')}>
        {links(primaryItems.filter(item => ['/app', '/app/calendar', '/app/clients'].includes(item.path)))}
        <button type="button" aria-controls="workspace-navigation" aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(true)}>
          <span className="crm-navicon"><LuMenu className="h-[18px] w-[18px]" /></span><span>{t('nav.more')}</span>
        </button>
      </nav>
    </div>
    </WorkspaceAccessContext.Provider>
  )
}
