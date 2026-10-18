import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signOut } from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import { useSyncUiLanguage } from '../hooks/useUiLanguage'
import { 
  HiOutlineViewGrid, 
  HiOutlineUsers, 
  HiOutlineOfficeBuilding, 
  HiOutlineCalendar,
  HiOutlinePaperClip,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingCart,
  HiOutlineChartBar,
  HiOutlineHeart,
  HiOutlineCog,
  HiOutlineBriefcase,
  HiOutlineDocumentText
} from 'react-icons/hi'

export default function Layout() {
  const { user } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [offline, setOffline] = useState(!navigator.onLine)
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
  useSyncUiLanguage()

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const getIcon = (path: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      '/': HiOutlineViewGrid,
      '/clients': HiOutlineUsers,
      '/visits': HiOutlineOfficeBuilding,
      '/calendar': HiOutlineCalendar,
      '/services': HiOutlinePaperClip,
      '/inventory': HiOutlineShoppingCart,
      '/finance': HiOutlineCurrencyDollar,
      '/analytics': HiOutlineChartBar,
      '/loyalty': HiOutlineHeart,
      '/employees': HiOutlineUsers,
      '/business': HiOutlineBriefcase,
      '/subscription': HiOutlineDocumentText,
      '/my-salary': HiOutlineCurrencyDollar,
      '/settings': HiOutlineCog,
    }
    return iconMap[path] || null
  }

  const primaryItems = [
    { path: '/', label: t('nav.dashboard') },
    { path: '/clients', label: t('nav.clients') },
    { path: '/visits', label: t('nav.visits') },
    { path: '/calendar', label: t('nav.calendar') },
    { path: '/services', label: t('nav.services') },
    ...(user?.role === 'admin' || user?.role === 'business_owner'
      ? [
          { path: '/inventory', label: t('nav.inventory') },
          { path: '/finance', label: t('nav.finance') },
        ]
      : []),
  ]

  const manageItems = [
    ...(user?.role === 'admin' || user?.role === 'business_owner'
      ? [
          { path: '/analytics', label: t('nav.analytics') },
          { path: '/loyalty', label: t('nav.loyalty') },
          { path: '/employees', label: t('nav.employees') },
        ]
      : []),
  ]

  const systemItems = [
    ...(user?.role === 'admin' || user?.role === 'business_owner'
      ? [{ path: '/business', label: t('nav.business') }]
      : []),
    ...(user?.role === 'admin' || user?.role === 'business_owner' || (user?.role === 'specialist' && !user?.employer_id)
      ? [{ path: '/subscription', label: t('nav.subscription') }]
      : []),
    ...((user?.role === 'employee' || user?.role === 'specialist')
      ? [{ path: '/my-salary', label: t('nav.my_salary') }]
      : []),
    { path: '/settings', label: t('nav.settings') },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {}
      <aside
        className={`w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex flex-col fixed h-screen z-50 transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 overflow-hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center justify-center flex-1">
            <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded flex items-center justify-center">
              <span className="text-xl font-bold text-white">X</span>
            </div>
          </div>
          {}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {}
        <nav 
          className="flex-1 overflow-y-auto py-4 overscroll-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
          }}
        >
          {}
          {primaryItems.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-800 z-10">{t('nav.primary')}</div>
              {primaryItems.map((item) => {
                const Icon = getIcon(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-all rounded-lg mx-2 touch-manipulation ${
                      location.pathname === item.path
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 mr-3 flex-shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}

          {}
          {manageItems.length > 0 && (
            <>
              <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-800 z-10">{t('nav.manage')}</div>
              {manageItems.map((item) => {
                const Icon = getIcon(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-all rounded-lg mx-2 touch-manipulation ${
                      location.pathname === item.path
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 mr-3 flex-shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}

          {}
          {systemItems.length > 0 && (
            <>
              <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 bg-white dark:bg-gray-800 z-10">{t('nav.system')}</div>
              {systemItems.map((item) => {
                const Icon = getIcon(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-all rounded-lg mx-2 touch-manipulation ${
                      location.pathname === item.path
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 mr-3 flex-shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
            </>
          )}
          
          {}
          <div className="h-4 lg:h-8"></div>
        </nav>
      </aside>

      {}
      <div className="min-w-0 flex-1 lg:ml-64 flex flex-col w-full lg:w-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
        {}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 sm:px-6">
          {}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1"></div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
              <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">{user?.full_name || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all font-medium"
            >
              {t('nav.logout')}
            </button>
          </div>
        </header>

        {}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          {offline && <div role="status" className="mb-4 rounded bg-amber-100 p-3 text-amber-900">{t('common.offline')}</div>}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

