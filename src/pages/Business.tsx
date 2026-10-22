import { useTranslation } from '../hooks/useTranslation'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HiCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi'
import api from '../api/client'
import { apiErrorMessage, apiErrorStatus } from '../api/errors'
import BusinessForm from '../components/BusinessForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import { useLabels } from '../i18n/labels'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import type { BusinessOut, PublicBookingSettingsOut } from '../api/types'
import { effectiveAssistant } from '../i18n/assistant'

export default function Business() {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const labels = useLabels()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const queryClient = useQueryClient()

  const { data: business, isLoading } = useQuery<BusinessOut | null>({
    queryKey: ['business', 'me'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/businesses/me')
        return data
      } catch (error) {
        if (apiErrorStatus(error) === 404) {
          return null
        }
        throw error
      }
    },
    enabled: user?.role === 'admin' || user?.role === 'business_owner',
  })

  const handleSuccess = async () => {
    setShowForm(false)
    setEditingId(undefined)
    // a new business changes the user's business_id, and nearly every page depends on it -
    // refresh the stored user and drop all cached answers (they were fetched without a business)
    try {
      const { data } = await api.get('/users/me')
      const { token } = useAuthStore.getState()
      if (token) useAuthStore.getState().setAuth(token, data)
    } catch (error) {
      console.error('Failed to refresh the user after saving the business:', error)
    }
    queryClient.invalidateQueries()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-title">{t('business.title')}</h1>
        {!showForm && !business && (user?.role === 'admin' || user?.role === 'business_owner') && (
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {t('business.create')}
          </button>
        )}
        {!showForm && business && (
          <button
            onClick={() => {
              setEditingId(business.id)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {t('business.edit')}
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow dark:bg-gray-800">
          <BusinessForm
            businessId={editingId}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingId(undefined)
            }}
          />
        </div>
      ) : business ? (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">{t('business.name')}</label>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{business.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">{t('business.type')}</label>
                <p className="text-gray-900 dark:text-gray-100">{labels.businessType(business.business_type)}</p>
              </div>
              {business.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">{t('business.address')}</label>
                  <p className="text-gray-900 dark:text-gray-100">{business.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {business.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">{t('clients.phone')}</label>
                    <p className="text-gray-900 dark:text-gray-100">{business.phone}</p>
                  </div>
                )}
                {business.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">{t('clients.email')}</label>
                    <p className="text-gray-900 dark:text-gray-100">{business.email}</p>
                  </div>
                )}
              </div>
              {business.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">{t('business.description')}</label>
                  <p className="text-gray-900 dark:text-gray-100">{business.description}</p>
                </div>
              )}
              <AssistantInfo business={business} />
            </div>
          </div>
          <PublicBookingCard />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center dark:bg-gray-800">
          <p className="text-gray-500 mb-4 dark:text-gray-400">{t('business.empty')}</p>
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {t('business.create')}
          </button>
        </div>
      )}
    </div>
  )
}

function AssistantInfo({ business }: { business: BusinessOut }) {
  const { t, locale } = useTranslation()
  const { name, gender, isDefault } = effectiveAssistant(business, locale)
  return (
    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">{t('business.assistantName')}</label>
        <p className="text-gray-900 dark:text-gray-100">{isDefault ? `${name} (${t('business.assistantDefault')})` : name}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1 dark:text-gray-400">{t('business.assistantGender')}</label>
        <p className="text-gray-900 dark:text-gray-100">{t(`business.assistantGender.${gender}`)}</p>
      </div>
    </div>
  )
}

function PublicBookingCard() {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [depositType, setDepositType] = useState<'none' | 'fixed' | 'percentage'>('none')
  const [depositValue, setDepositValue] = useState('0')
  const [holdMinutes, setHoldMinutes] = useState('30')
  const [depositSaved, setDepositSaved] = useState(false)

  const settingsQuery = useQuery<PublicBookingSettingsOut>({
    queryKey: ['public-booking-settings'],
    queryFn: async () => {
      const { data } = await api.get('/businesses/me/public-booking')
      return data
    },
    retry: false,
  })

  const toggle = useMutation({
    mutationFn: async (isEnabled: boolean) => {
      const { data } = await api.put<PublicBookingSettingsOut>('/businesses/me/public-booking', {
        is_enabled: isEnabled,
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData<PublicBookingSettingsOut>(['public-booking-settings'], data)
      setCopied(false)
      setCopyError(false)
    },
  })

  const depositMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put<PublicBookingSettingsOut>('/businesses/me/public-booking', {
        deposit_type: depositType,
        deposit_value: depositType === 'none' ? 0 : Number(depositValue),
        deposit_hold_minutes: Number(holdMinutes),
      })
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData<PublicBookingSettingsOut>(['public-booking-settings'], data)
      setDepositSaved(true)
    },
  })

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  const settings = settingsQuery.data

  useEffect(() => {
    if (!settings) return
    setDepositType(settings.deposit_type ?? 'none')
    setDepositValue(String(settings.deposit_value ?? 0))
    setHoldMinutes(String(settings.deposit_hold_minutes ?? 30))
  }, [settings])

  const depositNumber = Number(depositValue)
  const holdNumber = Number(holdMinutes)
  const depositValid = depositType === 'none'
    || (Number.isFinite(depositNumber)
      && (depositType === 'fixed'
        ? depositNumber > 0
        : depositNumber >= 1 && depositNumber <= 100))
  const holdValid = Number.isInteger(holdNumber) && holdNumber >= 5 && holdNumber <= 1440
  const publicUrl = settings ? `${window.location.origin}/booking/${settings.slug}` : ''
  const ready = Boolean(settings?.has_bookable_service && settings?.has_schedule)

  const copyLink = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  return (
    <section aria-labelledby="public-booking-title" className="bg-white shadow rounded-lg p-6 dark:bg-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="public-booking-title" className="text-lg font-semibold">
            {t('business.publicBooking.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('business.publicBooking.description')}</p>
        </div>
        {settings && (
          <button
            type="button"
            role="switch"
            aria-checked={settings.is_enabled}
            disabled={toggle.isPending}
            onClick={() => toggle.mutate(!settings.is_enabled)}
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
              settings.is_enabled
                ? 'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {toggle.isPending
              ? t('business.publicBooking.saving')
              : settings.is_enabled
                ? t('business.publicBooking.disable')
                : t('business.publicBooking.enable')}
          </button>
        )}
      </div>

      {settingsQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : settingsQuery.isError ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
        >
          <p>{t('common.loadError')}</p>
          <button
            type="button"
            onClick={() => void settingsQuery.refetch()}
            className="mt-2 rounded-md border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : settings ? (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={publicUrl}
              aria-label={t('business.publicBooking.link')}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
            />
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {copied ? t('business.publicBooking.copied') : t('business.publicBooking.copy')}
            </button>
          </div>
          <span className="sr-only" aria-live="polite">
            {copied ? t('business.publicBooking.copied') : ''}
          </span>
          {copyError && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {t('business.publicBooking.copyError')}
            </p>
          )}

          <p
            className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              settings.is_enabled
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {settings.is_enabled ? t('business.publicBooking.enabled') : t('business.publicBooking.disabled')}
          </p>
          {!settings.is_enabled && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('business.publicBooking.disabledHint')}</p>
          )}

          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              {settings.has_bookable_service ? (
                <HiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <HiOutlineExclamationCircle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
              )}
              {/* text and link wrap next to the icon instead of dropping below it on a phone */}
              <span className="min-w-0">
                <span className={settings.has_bookable_service ? '' : 'text-amber-700 dark:text-amber-400'}>
                  {t(
                    settings.has_bookable_service
                      ? 'business.publicBooking.servicesReady'
                      : 'business.publicBooking.servicesMissing',
                  )}
                </span>
                {!settings.has_bookable_service && (
                  <>
                    {' '}
                    <Link to="/app/services" className="text-primary-600 hover:underline dark:text-primary-400">
                      {t('business.publicBooking.setupServices')}
                    </Link>
                  </>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              {settings.has_schedule ? (
                <HiCheckCircle className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <HiOutlineExclamationCircle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />
              )}
              {/* text and link wrap next to the icon instead of dropping below it on a phone */}
              <span className="min-w-0">
                <span className={settings.has_schedule ? '' : 'text-amber-700 dark:text-amber-400'}>
                  {t(
                    settings.has_schedule
                      ? 'business.publicBooking.scheduleReady'
                      : 'business.publicBooking.scheduleMissing',
                  )}
                </span>
                {!settings.has_schedule && (
                  <>
                    {' '}
                    <Link to="/app/schedules" className="text-primary-600 hover:underline dark:text-primary-400">
                      {t('business.publicBooking.setupSchedule')}
                    </Link>
                  </>
                )}
              </span>
            </li>
          </ul>

          <p
            className={`mt-3 text-sm font-medium ${
              ready ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            {ready ? t('business.publicBooking.ready') : t('business.publicBooking.notReady')}
          </p>
          {settings.is_enabled && !ready && (
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              {t('business.publicBooking.enabledNotReady')}
            </p>
          )}

          <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-700">
            <h3 className="text-base font-semibold">{t('business.publicBooking.depositTitle')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('business.publicBooking.depositHint')}
            </p>
            {!settings.payments_available && (
              <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {t('business.publicBooking.depositUnavailable')}
              </p>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="block text-sm font-medium">
                {t('business.publicBooking.depositType')}
                <select
                  value={depositType}
                  onChange={(event) => {
                    setDepositType(event.target.value as 'none' | 'fixed' | 'percentage')
                    setDepositSaved(false)
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="none">{t('business.publicBooking.depositNone')}</option>
                  <option value="fixed">{t('business.publicBooking.depositFixed')}</option>
                  <option value="percentage">{t('business.publicBooking.depositPercentage')}</option>
                </select>
              </label>

              {depositType !== 'none' && (
                <label className="block text-sm font-medium">
                  {t('business.publicBooking.depositValue')}
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min={depositType === 'fixed' ? 0.01 : 1}
                      max={depositType === 'percentage' ? 100 : undefined}
                      step={depositType === 'fixed' ? 0.01 : 1}
                      value={depositValue}
                      onChange={(event) => {
                        setDepositValue(event.target.value)
                        setDepositSaved(false)
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {depositType === 'percentage' ? '%' : currency}
                    </span>
                  </div>
                </label>
              )}

              <label className="block text-sm font-medium">
                {t('business.publicBooking.depositHold')}
                <input
                  type="number"
                  min={5}
                  max={1440}
                  step={1}
                  value={holdMinutes}
                  onChange={(event) => {
                    setHoldMinutes(event.target.value)
                    setDepositSaved(false)
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={depositMutation.isPending || !depositValid || !holdValid}
                onClick={() => depositMutation.mutate()}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {depositMutation.isPending
                  ? t('business.publicBooking.depositSaving')
                  : t('business.publicBooking.depositSave')}
              </button>
              {depositSaved && (
                <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
                  {t('business.publicBooking.depositSaved')}
                </span>
              )}
              {(!depositValid || !holdValid) && (
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  {t('business.publicBooking.depositInvalid')}
                </span>
              )}
            </div>
            {depositMutation.isError && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                {apiErrorMessage(depositMutation.error, t('business.publicBooking.depositInvalid'))}
              </p>
            )}
          </div>

          {toggle.isError && (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {apiErrorMessage(toggle.error, t('business.publicBooking.saveError'))}
            </p>
          )}
        </>
      ) : null}
    </section>
  )
}
