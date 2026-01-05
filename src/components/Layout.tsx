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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-blue-600 mr-4">Xtrix</span>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
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
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}

