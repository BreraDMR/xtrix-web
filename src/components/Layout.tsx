import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const navItems = [
    { path: '/', label: t('nav.dashboard') },
    { path: '/clients', label: t('nav.clients') },
    { path: '/visits', label: t('nav.visits') },
    { path: '/calendar', label: t('nav.calendar') },
    { path: '/services', label: t('nav.services') },
    ...(user?.role === 'specialist' ? [{ path: '/profile', label: t('nav.profile') }] : []),
    ...(user?.role === 'admin' || user?.role === 'business_owner'
      ? [
          { path: '/business', label: t('nav.business') },
          { path: '/employees', label: t('nav.employees') },
          { path: '/inventory', label: t('nav.inventory') },
          { path: '/finance', label: t('nav.finance') },
          { path: '/analytics', label: t('nav.analytics') },
          { path: '/loyalty', label: t('nav.loyalty') },
          { path: '/subscription', label: t('nav.subscription') },
        ]
      : []),
    ...(user?.role === 'specialist' && !user?.employer_id
      ? [{ path: '/subscription', label: t('nav.subscription') }]
      : []),
    ...(user?.role === 'employee'
      ? [{ path: '/my-salary', label: t('nav.my_salary') }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`w-64 bg-gray-800 text-white flex flex-col fixed h-screen z-50 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center justify-center flex-1">
            <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-xl font-bold text-white">X</span>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col w-full lg:w-auto">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6">
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1"></div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1 bg-gray-100 rounded-full">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700">{user?.full_name || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-2 sm:px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all font-medium"
            >
              {t('nav.logout')}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

