import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'

export default function Landing() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const isAuthenticated = !!token && !!user

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Xtrix">
          <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-gray-900 text-[25px] font-medium leading-none text-white dark:bg-white dark:text-gray-900">
            x
          </span>
          <span className="text-[25px] font-semibold tracking-[-1.2px]">Xtrix</span>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/app"
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {t('nav.dashboard')}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {t('auth.login')}
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {t('auth.register')}
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          CRM & AI Сашенька для салонов и мастеров
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Умное расписание, клиенты, аналитика и голосовой ассистент в одном удобном рабочем пространстве.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Попробовать бесплатно
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Войти
          </Link>
        </div>
      </main>
    </div>
  )
}
