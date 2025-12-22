import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/visits', label: 'Visits', icon: '📅' },
    { path: '/calendar', label: 'Calendar', icon: '🗓️' },
    { path: '/services', label: 'Services', icon: '💆' },
    ...(user?.role === 'specialist' ? [{ path: '/profile', label: 'Profile', icon: '👤' }] : []),
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
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.full_name || 'User'}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all font-medium"
              >
                Logout
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

