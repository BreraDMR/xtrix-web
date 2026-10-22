import { Link } from 'react-router-dom'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { HiOutlineExclamationCircle, HiOutlineHome, HiOutlineViewGrid } from 'react-icons/hi'

export default function NotFound() {
  const { t } = useTranslation()
  const { token, user } = useAuthStore()
  const isAuthenticated = !!token && !!user

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--workspace-bg)] px-6 py-16 text-center text-[var(--workspace-ink)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]">
        <HiOutlineExclamationCircle className="h-8 w-8" />
      </div>

      <span className="mt-6 text-sm font-semibold uppercase tracking-wider text-[var(--workspace-muted)]">
        404
      </span>
      <h1 className="page-title mt-2">
        {t('notfound.title')}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-[var(--workspace-muted)]">
        {t('notfound.subtitle')}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          to="/"
          className={`ui-button ${isAuthenticated ? 'ui-button-secondary' : 'ui-button-primary'}`}
        >
          <HiOutlineHome className="h-4 w-4" />
          {t('notfound.to_home')}
        </Link>
        {isAuthenticated && (
          <Link
            to="/app"
            className="ui-button ui-button-primary"
          >
            <HiOutlineViewGrid className="h-4 w-4" />
            {t('notfound.to_app')}
          </Link>
        )}
      </div>
    </div>
  )
}
