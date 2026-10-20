import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi'
import api from '../api/client'
import { apiErrorMessage, apiErrorStatus } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import QueryError from '../components/QueryError'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { useMyBusiness } from '../hooks/useMyBusiness'
import { useTranslation } from '../hooks/useTranslation'
import type {
  NotificationSettingsOut,
  NotificationSettingsUpdate,
  NotificationTestOut,
} from '../api/types'

const SETTINGS_KEY = ['notification-settings']

export default function NotificationSettings() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: business } = useMyBusiness()
  const [enabled, setEnabled] = useState(false)
  const [channel, setChannel] = useState('email')
  const [reminderTime, setReminderTime] = useState('10:00')

  const settingsQuery = useQuery<NotificationSettingsOut>({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const { data } = await api.get('/businesses/me/notification-settings')
      return data
    },
    retry: false,
  })

  useEffect(() => {
    const data = settingsQuery.data
    if (!data) return
    setChannel(data.channel)
    setReminderTime(data.reminder_time)
    setEnabled(data.is_enabled)
  }, [settingsQuery.data])

  const save = useMutation({
    mutationFn: async (payload: NotificationSettingsUpdate) => {
      const { data } = await api.put<NotificationSettingsOut>(
        '/businesses/me/notification-settings',
        payload,
      )
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEY, data)
    },
  })

  const test = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<NotificationTestOut>(
        '/businesses/me/notification-settings/test',
      )
      return data
    },
  })

  if (settingsQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (settingsQuery.isError) {
    const status = apiErrorStatus(settingsQuery.error)
    if (status === 403 || status === 404) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          {status === 404 ? t('notifications.businessRequired') : t('notifications.noAccess')}
        </div>
      )
    }
    return <QueryError retry={settingsQuery.refetch} />
  }

  const settings = settingsQuery.data
  if (!settings) return null

  const available = settings.available_channels
  const providerReady = settings.provider_ready
  const canEnable = enabled || providerReady
  const channels = Array.from(new Set([...available, channel]))
  const channelLabel = (value: string) =>
    value === 'email' ? 'Email' : value.charAt(0).toUpperCase() + value.slice(1)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!reminderTime) return
    save.mutate({ channel, reminder_time: reminderTime, is_enabled: enabled })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('notifications.description')}
        </p>
      </div>

      <section
        aria-labelledby="notification-provider-title"
        className="rounded-lg bg-white p-6 shadow dark:bg-gray-800"
      >
        <h2 id="notification-provider-title" className="text-lg font-semibold">
          {t('notifications.channel')}
        </h2>
        <div className="mt-3 flex items-start gap-2 text-sm">
          {providerReady ? (
            <HiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <HiOutlineExclamationCircle
              className="h-5 w-5 shrink-0 text-amber-500"
              aria-hidden="true"
            />
          )}
          <div>
            <p
              className={
                providerReady
                  ? 'font-medium text-emerald-700 dark:text-emerald-400'
                  : 'font-medium text-amber-700 dark:text-amber-400'
              }
            >
              {providerReady
                ? t('notifications.providerReady')
                : t('notifications.providerNotReady')}
            </p>
            {!providerReady && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {t('notifications.providerNotReadyHint')}
              </p>
            )}
          </div>
        </div>

        <form className="mt-5 space-y-5" onSubmit={submit}>
          <div>
            <label htmlFor="notification-channel" className="mb-1 block text-sm font-medium">
              {t('notifications.channel')}
            </label>
            <Select
              id="notification-channel"
              value={channel}
              disabled={available.length === 0}
              onChange={(event) => {
                save.reset()
                setChannel(event.target.value)
              }}
            >
              {channels.map((value) => (
                <option key={value} value={value}>
                  {channelLabel(value)}
                  {available.includes(value)
                    ? ''
                    : ` (${t('notifications.channelNotConnected')})`}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('notifications.channelHint')}
            </p>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-gray-200 p-4 dark:border-gray-700">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t('notifications.enabled')}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('notifications.enabledHint')}
              </p>
              {!providerReady && !enabled && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  {t('notifications.providerNotReadyHint')}
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={t('notifications.enabled')}
              disabled={!canEnable || save.isPending}
              onClick={() => {
                save.reset()
                setEnabled((value) => !value)
              }}
              className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                enabled
                  ? 'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {enabled ? t('notifications.disable') : t('notifications.enable')}
            </button>
          </div>

          <div>
            <label htmlFor="notification-reminder-time" className="mb-1 block text-sm font-medium">
              {t('notifications.reminderTime')}
            </label>
            <Input
              id="notification-reminder-time"
              type="time"
              value={reminderTime}
              required
              onChange={(event) => {
                save.reset()
                setReminderTime(event.target.value)
              }}
              className="max-w-xs"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('notifications.reminderTimeHint')}{' '}
              {business?.timezone ? `${t('notifications.timezone')}: ${business.timezone}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={save.isPending || !reminderTime || (enabled && !providerReady)}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {save.isPending ? t('common.saving') : t('common.save')}
            </button>
            <span role="status" aria-live="polite" className="text-sm text-emerald-700 dark:text-emerald-400">
              {save.isSuccess ? t('notifications.saved') : ''}
            </span>
          </div>
          {save.isError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {apiErrorMessage(save.error, t('notifications.saveError'))}
            </p>
          )}
        </form>
      </section>

      <section
        aria-labelledby="notification-test-title"
        className="rounded-lg bg-white p-6 shadow dark:bg-gray-800"
      >
        <h2 id="notification-test-title" className="text-lg font-semibold">
          {t('notifications.testTitle')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('notifications.testDescription')}
        </p>
        <button
          type="button"
          disabled={test.isPending}
          onClick={() => test.mutate()}
          className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          {test.isPending ? t('notifications.testRunning') : t('notifications.testRun')}
        </button>
        {test.isError && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {apiErrorMessage(test.error, t('notifications.testError'))}
          </p>
        )}
        {test.data && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/20">
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              <HiCheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              {test.data.status === 'captured'
                ? t('notifications.testCaptured')
                : test.data.status}
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('notifications.testStatus')}</dt>
                <dd>{test.data.status}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('notifications.testProvider')}</dt>
                <dd>{test.data.provider}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('notifications.testRecipient')}</dt>
                <dd>{test.data.recipient}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('notifications.testSubject')}</dt>
                <dd>{test.data.subject}</dd>
              </div>
            </dl>
            <p className="mt-3 text-gray-500 dark:text-gray-400">{t('notifications.testPreview')}</p>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-white p-3 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-200">
              {test.data.preview}
            </pre>
          </div>
        )}
      </section>
    </div>
  )
}
