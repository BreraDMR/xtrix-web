import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useLocaleStore } from '../store/localeStore'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { CURRENCIES, Currency, getCurrencySymbol } from '../utils/currency'
import LoadingSpinner from '../components/LoadingSpinner'
import type { TranslationKey } from '../i18n/translations'
import type { UserPreferencesUpdate } from '../api/types'
import { PREFERENCES_KEY, usePreferences, useSetUiLanguage } from '../hooks/useUiLanguage'
import type { Locale } from '../store/localeStore'


const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/Prague', label: 'Europe/Prague (CET/CEST)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow (MSK)' },
  { value: 'Europe/Kiev', label: 'Europe/Kiev (EET/EEST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
]

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const TIME_FORMATS = [
  { value: '24h', label: '24 hour (14:30)' },
  { value: '12h', label: '12 hour (2:30 PM)' },
]

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'json', label: 'JSON' },
]

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export default function Settings() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const setUiLanguage = useSetUiLanguage()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const currentCurrency = useBusinessCurrency()

  const { data: business, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['user-business'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/businesses/me')
        return data
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: !!user,
    retry: false,
  })

  const { data: preferences, isLoading: isLoadingPreferences } = usePreferences(!!user)

  const updateCurrencyMutation = useMutation({
    mutationFn: async (currency: Currency) => {
      if (!business?.id) {
        throw new Error('Business not found')
      }
      const { data } = await api.put(`/businesses/${business.id}`, { currency })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-business'] })
      queryClient.invalidateQueries({ queryKey: ['profit-current-month'] })
      queryClient.invalidateQueries({ queryKey: ['profit-report'] })
    },
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: UserPreferencesUpdate) => {
      const { data } = await api.put('/user-preferences/me', updates)
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY })
      if (variables.theme) {
        applyTheme(variables.theme)
      }
    },
  })

  const languages: { code: Locale; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ru', label: 'Russian', native: 'Русский' },
    { code: 'cz', label: 'Czech', native: 'Čeština' },
  ]

  // saved to the account, not just this browser - e-mails to you use it as well
  const handleLanguageChange = (langCode: Locale) => {
    setUiLanguage(langCode)
  }

  const handleCurrencyChange = (currency: Currency) => {
    if (business?.id) {
      updateCurrencyMutation.mutate(currency)
    }
  }

  const handlePreferenceChange = (field: keyof UserPreferencesUpdate, value: any) => {
    updatePreferencesMutation.mutate({ [field]: value })
  }

  const applyTheme = (theme: string) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  useEffect(() => {
    if (preferences?.theme) {
      applyTheme(preferences.theme)
    } else {
      const savedTheme = localStorage.getItem('theme') || 'light'
      applyTheme(savedTheme)
    }
  }, [preferences?.theme])

  useEffect(() => {
    if (!preferences) {
      const savedTheme = localStorage.getItem('theme') || 'light'
      applyTheme(savedTheme)
    }
  }, [preferences])

  if (isLoadingBusiness || isLoadingPreferences) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('settings.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('settings.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.language')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('settings.language_description')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  locale === lang.code
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 text-blue-900 dark:text-blue-100'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-medium">{lang.native}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{lang.label}</div>
              </button>
            ))}
          </div>
        </div>

        {}
        {business && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.currency')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('settings.currency_description')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {CURRENCIES.map((currency) => (
                <button
                  key={currency}
                  onClick={() => handleCurrencyChange(currency)}
                  disabled={updateCurrencyMutation.isPending}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    currentCurrency === currency
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 text-blue-900 dark:text-blue-100'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  } ${updateCurrencyMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium flex items-center gap-2">
                    <span>{getCurrencySymbol(currency)}</span>
                    <span>{currency}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t(`settings.currency_${currency.toLowerCase()}` as TranslationKey)}</div>
                </button>
              ))}
            </div>
            {updateCurrencyMutation.isPending && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <LoadingSpinner size="sm" />
                <span>{t('settings.saving')}</span>
              </div>
            )}
            {updateCurrencyMutation.isSuccess && (
              <div className="mt-4 text-sm text-green-600 dark:text-green-400">{t('settings.saved')}</div>
            )}
            {updateCurrencyMutation.isError && (
              <div className="mt-4 text-sm text-red-600 dark:text-red-400">{t('settings.error_saving')}</div>
            )}
          </div>
        )}

        {}
        {preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.theme')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('settings.theme_description')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => handlePreferenceChange('theme', theme.value)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    preferences.theme === theme.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 text-blue-900 dark:text-blue-100'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium">{t(`settings.theme_${theme.value}` as TranslationKey)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {}
        {preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.timezone')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('settings.timezone_description')}</p>
            <select
              value={preferences.timezone || 'UTC'}
              onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
              disabled={updatePreferencesMutation.isPending}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {}
        {preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.date_time_format')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.date_format')}</label>
                <select
                  value={preferences.date_format || 'DD/MM/YYYY'}
                  onChange={(e) => handlePreferenceChange('date_format', e.target.value)}
                  disabled={updatePreferencesMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DATE_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('settings.time_format')}</label>
                <select
                  value={preferences.time_format || '24h'}
                  onChange={(e) => handlePreferenceChange('time_format', e.target.value)}
                  disabled={updatePreferencesMutation.isPending}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIME_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {}
        {preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.notifications')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.email_notifications')}</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.email_notifications_description')}</p>
                </div>
                <button
                  onClick={() => handlePreferenceChange('email_notifications', !preferences.email_notifications)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.email_notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.email_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.push_notifications')}</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.push_notifications_description')}</p>
                </div>
                <button
                  onClick={() => handlePreferenceChange('push_notifications', !preferences.push_notifications)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.push_notifications ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.push_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {}
        {preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.auto_save')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('settings.auto_save_enabled')}</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('settings.auto_save_description')}</p>
                </div>
                <button
                  onClick={() => handlePreferenceChange('auto_save_enabled', !preferences.auto_save_enabled)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.auto_save_enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences.auto_save_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {preferences.auto_save_enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('settings.auto_save_interval')} ({t('settings.seconds')})
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={preferences.auto_save_interval}
                    onChange={(e) => handlePreferenceChange('auto_save_interval', parseInt(e.target.value))}
                    disabled={updatePreferencesMutation.isPending}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{t('settings.export_format')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('settings.export_format_description')}</p>
            <select
              value={preferences.export_format || 'csv'}
              onChange={(e) => handlePreferenceChange('export_format', e.target.value)}
              disabled={updatePreferencesMutation.isPending}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {EXPORT_FORMATS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {updatePreferencesMutation.isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <LoadingSpinner size="sm" />
            <span>{t('settings.saving')}</span>
          </div>
        )}
        {updatePreferencesMutation.isSuccess && (
          <div className="text-center text-sm text-green-600 dark:text-green-400">{t('settings.saved')}</div>
        )}
        {updatePreferencesMutation.isError && (
          <div className="text-center text-sm text-red-600 dark:text-red-400">{t('settings.error_saving')}</div>
        )}
      </div>
    </div>
  )
}
