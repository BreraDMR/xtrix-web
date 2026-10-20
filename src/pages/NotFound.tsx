import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { HiOutlineExclamationCircle, HiOutlineHome, HiOutlineViewGrid } from 'react-icons/hi'

export default function NotFound() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const isAuthenticated = !!token && !!user

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16 text-center dark:bg-slate-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400">
        <HiOutlineExclamationCircle className="h-8 w-8" />
      </div>

      <span className="mt-6 text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
        404
      </span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        {t('notfound.title')}
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base text-slate-600 dark:text-slate-300">
        {t('notfound.subtitle')}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <HiOutlineHome className="h-4 w-4" />
          {t('notfound.to_home')}
        </Link>
        {isAuthenticated && (
          <Link
            to="/app"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            <HiOutlineViewGrid className="h-4 w-4" />
            {t('notfound.to_app')}
          </Link>
        )}
      </div>
    </div>
  )
}
