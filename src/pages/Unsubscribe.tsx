import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiOutlineMailOpen } from 'react-icons/hi'

import api from '../api/client'
import { apiErrorStatus } from '../api/errors'
import LanguageSwitcher from '../components/LanguageSwitcher'
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
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-gray-900 dark:text-gray-100">
      <header className="border-b border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-slate-500 dark:text-gray-400">Xtrix</span>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-8 sm:py-14">{children}</main>
    </div>
  )
}

export default function Unsubscribe() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const token = useMemo(readToken, [])
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
        <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <h1 className="text-xl font-semibold">{t('unsubscribe.title')}</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-gray-300">{t('unsubscribe.missing')}</p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
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
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-slate-500 dark:text-gray-400">
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
        <section className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
          <h1 className="text-xl font-semibold">{t('unsubscribe.title')}</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-gray-300">
            {status === 400 || status === 404 ? t('unsubscribe.invalid') : t('unsubscribe.error')}
          </p>
          {status !== 400 && status !== 404 && (
            <button
              type="button"
              onClick={() => void previewQuery.refetch()}
              className="mt-6 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {t('common.retry')}
            </button>
          )}
          <Link to="/" className="mt-6 block text-sm text-primary-600 hover:underline dark:text-primary-400">
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
      <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <HiOutlineMailOpen className="mt-0.5 h-7 w-7 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold">{t('unsubscribe.title')}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
              {unsubscribed ? t('unsubscribe.unsubscribed') : t('unsubscribe.subscribed')}
            </p>
          </div>
        </div>

        <dl className="mt-6 space-y-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-gray-700">
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-slate-500 dark:text-gray-400">{t('unsubscribe.business')}</dt>
            <dd className="font-medium">{data.business_name}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-slate-500 dark:text-gray-400">{t('unsubscribe.address')}</dt>
            <dd className="font-medium break-all">{data.email}</dd>
          </div>
        </dl>

        {actionError && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {actionError}
          </p>
        )}

        {unsubscribed ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {unsubscribe.isSuccess ? t('unsubscribe.done') : t('unsubscribe.already')}
          </p>
        ) : (
          <button
            type="button"
            disabled={unsubscribe.isPending}
            onClick={() => unsubscribe.mutate()}
            className="mt-6 w-full rounded-md bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {unsubscribe.isPending ? t('unsubscribe.working') : t('unsubscribe.action')}
          </button>
        )}

        <p className="mt-5 text-xs text-slate-500 dark:text-gray-400">{t('unsubscribe.hint')}</p>
      </section>
    </Frame>
  )
}
