import { useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LuMailOpen } from 'react-icons/lu'

import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import PublicShell from '../components/public/PublicShell'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation } from '../hooks/useTranslation'
import type { PublicUnsubscribeOut } from '../api/types'

function readToken(): string {
  const tryParams = (value: string) => {
    try {
      return new URLSearchParams(value.replace(/^[#?]/, '')).get('token') ?? ''
    } catch {
      return ''
    }
  }
  return tryParams(window.location.hash) || tryParams(window.location.search)
}

function Frame({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  return <PublicShell title={t('unsubscribe.title')} width="xl">{children}</PublicShell>
}

function subscribeToLink(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

export default function Unsubscribe() {
  // Router navigation and native fragment links both need to select the new contact.
  useLocation()
  const token = useSyncExternalStore(subscribeToLink, readToken)
  return <UnsubscribePage key={token} token={token} />
}

function UnsubscribePage({ token }: { token: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const previewQuery = useQuery<PublicUnsubscribeOut>({
    queryKey: ['unsubscribe', token],
    retry: false,
    enabled: Boolean(token),
    queryFn: async () => {
      const { data } = await api.get<PublicUnsubscribeOut>('/public/campaigns/unsubscribe', {
        params: { token },
      })
      return data
    },
  })

  const unsubscribe = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<PublicUnsubscribeOut>('/public/campaigns/unsubscribe', {
        token,
      })
      return data
    },
    onSuccess: (data) => {
      setActionError(null)
      queryClient.setQueryData(['unsubscribe', token], data)
    },
    onError: () => setActionError(t('unsubscribe.error')),
  })

  if (!token) {
    return (
      <Frame>
        <section className="ui-card p-8 text-center">
          <h1 className="text-xl font-semibold">{t('unsubscribe.title')}</h1>
          <p className="mt-3 text-sm text-[var(--workspace-muted)]">{t('unsubscribe.missing')}</p>
          <Link
            to="/"
            className="mt-6 inline-block ui-button ui-button-primary"
          >
            {t('unsubscribe.home')}
          </Link>
        </section>
      </Frame>
    )
  }

  if (previewQuery.isLoading) {
    return (
      <Frame>
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-[var(--workspace-muted)]">
          <LoadingSpinner size="lg" />
          <p>{t('unsubscribe.loading')}</p>
        </div>
      </Frame>
    )
  }

  if (previewQuery.isError) {
    const status = apiErrorStatus(previewQuery.error)
    return (
      <Frame>
        <section className="ui-card p-8 text-center">
          <h1 className="text-xl font-semibold">{t('unsubscribe.title')}</h1>
          <p className="mt-3 text-sm text-[var(--workspace-muted)]">
            {status === 400 || status === 404 ? t('unsubscribe.invalid') : t('unsubscribe.error')}
          </p>
          {status !== 400 && status !== 404 && (
            <button
              type="button"
              onClick={() => void previewQuery.refetch()}
              className="mt-6 ui-button ui-button-secondary"
            >
              {t('common.retry')}
            </button>
          )}
          <Link to="/" className="mt-6 block text-sm text-[var(--workspace-accent)] hover:underline">
            {t('unsubscribe.home')}
          </Link>
        </section>
      </Frame>
    )
  }

  const data = previewQuery.data
  if (!data) return null
  const unsubscribed = data.status === 'unsubscribed'

  return (
    <Frame>
      <section className="ui-card p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <LuMailOpen className="mt-0.5 h-7 w-7 shrink-0 text-[var(--workspace-accent)]" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold">{t('unsubscribe.title')}</h1>
            <p className="mt-2 text-sm text-[var(--workspace-muted)]">
              {unsubscribed ? t('unsubscribe.unsubscribed') : t('unsubscribe.subscribed')}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 rounded-xl border border-[var(--workspace-line)] p-4 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-[var(--workspace-muted)]">{t('unsubscribe.business')}</dt>
            <dd className="font-medium">{data.business_name}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-[var(--workspace-muted)]">{t('unsubscribe.address')}</dt>
            <dd className="font-medium break-all">{data.email}</dd>
          </div>
        </dl>

        {actionError && (
          <p role="alert" className="mt-4 text-sm text-[var(--tint-red-ink)]">
            {actionError}
          </p>
        )}

        {unsubscribed ? (
          <p className="mt-6 rounded-lg bg-[var(--tint-green)] p-4 text-sm text-[var(--tint-green-ink)]">
            {unsubscribe.isSuccess ? t('unsubscribe.done') : t('unsubscribe.already')}
          </p>
        ) : (
          <button
            type="button"
            disabled={unsubscribe.isPending}
            onClick={() => unsubscribe.mutate()}
            className="mt-6 w-full ui-button ui-button-primary disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {unsubscribe.isPending ? t('unsubscribe.working') : t('unsubscribe.action')}
          </button>
        )}

        <p className="mt-5 text-xs text-[var(--workspace-muted)]">{t('unsubscribe.hint')}</p>
      </section>
    </Frame>
  )
}
