import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LanguageSwitcher from './LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: '📊' },
    { path: '/clients', label: t('nav.clients'), icon: '👥' },
    { path: '/visits', label: t('nav.visits'), icon: '📅' },
    { path: '/calendar', label: t('nav.calendar'), icon: '🗓️' },
    { path: '/services', label: t('nav.services'), icon: '💆' },
    ...(user?.role === 'specialist' ? [{ path: '/profile', label: t('nav.profile'), icon: '👤' }] : []),
    ...(user?.role === 'admin' || user?.role === 'business_owner'
      ? [
          { path: '/business', label: 'Business', icon: '🏢' },
          { path: '/employees', label: t('nav.employees'), icon: '👷' },
          { path: '/inventory', label: t('nav.inventory'), icon: '📦' },
          { path: '/finance', label: t('nav.finance'), icon: '💰' },
          { path: '/subscription', label: t('nav.subscription'), icon: '💳' },
        ]
      : []),
    ...(user?.role === 'specialist' && !user?.employer_id
      ? [{ path: '/subscription', label: t('nav.subscription'), icon: '💳' }]
      : []),
    ...(user?.role === 'employee'
      ? [{ path: '/my-salary', label: t('nav.my_salary'), icon: '💰' }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-xl font-bold text-white">X</span>
            </div>
          </div>
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
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.full_name || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all font-medium"
            >
              {t('nav.logout')}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

