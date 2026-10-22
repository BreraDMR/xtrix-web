import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Card from '../ui/Card'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useLocaleStore } from '../store/localeStore'
import { useUpdateOnboarding } from '../hooks/useOnboarding'
import { apiErrorMessage } from '../api/errors'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { MY_BUSINESS_KEY, useMyBusiness } from '../hooks/useMyBusiness'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { CURRENCIES, Currency, getCurrencySymbol } from '../utils/currency'
import LoadingSpinner from '../components/LoadingSpinner'
import type { TranslationKey } from '../i18n/translations'
import type { UserPreferencesUpdate } from '../api/types'
import { PREFERENCES_KEY, usePreferences, useSetUiLanguage } from '../hooks/useUiLanguage'
import { applyTheme, isTheme } from '../utils/theme'
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

// options for a preference, typed by what the API accepts for it
type Option<K extends keyof UserPreferencesUpdate> = { value: NonNullable<UserPreferencesUpdate[K]>; label: string }

const DATE_FORMATS: Option<'date_format'>[] = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
]

const TIME_FORMATS: Option<'time_format'>[] = [
  { value: '24h', label: '24h (14:30)' },
  { value: '12h', label: '12h (2:30 PM)' },
]

const EXPORT_FORMATS: Option<'export_format'>[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'json', label: 'JSON' },
]

const THEMES: Option<'theme'>[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export default function Settings() {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const setUiLanguage = useSetUiLanguage()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const currentCurrency = useBusinessCurrency()

  const { data: business, isLoading: isLoadingBusiness } = useMyBusiness(!!user)

  const { data: preferences, isLoading: isLoadingPreferences } = usePreferences(!!user)

  const navigate = useNavigate()
  const updateOnboarding = useUpdateOnboarding()
  const [onboardingSaved, setOnboardingSaved] = useState(false)

  const updateCurrencyMutation = useMutation({
    mutationFn: async (currency: Currency) => {
      if (!business?.id) {
        throw new Error('Business not found')
      }
      const { data } = await api.put(`/businesses/${business.id}`, { currency })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_BUSINESS_KEY })
      queryClient.invalidateQueries({ queryKey: ['profit-current-month'] })
      queryClient.invalidateQueries({ queryKey: ['profit-report'] })
    },
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: UserPreferencesUpdate) => {
      const { data } = await api.put('/user-preferences/me', updates)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(PREFERENCES_KEY, data)
      if (isTheme(variables.theme)) {
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

  const handlePreferenceChange = <K extends keyof UserPreferencesUpdate>(field: K, value: UserPreferencesUpdate[K]) => {
    updatePreferencesMutation.mutate({ [field]: value })
  }

  if (isLoadingBusiness || isLoadingPreferences) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="page-toolbar">
        <div>
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[180px_minmax(0,1fr)]">
        <nav aria-label={t('settings.title')} className="flex flex-wrap gap-1 rounded-lg border border-[var(--workspace-line)] bg-[var(--workspace-panel)] p-2 xl:sticky xl:top-6 xl:flex-col">
          {[
            { id: 'language', label: 'settings.language', visible: true },
            { id: 'currency', label: 'settings.currency', visible: !!business },
            { id: 'theme', label: 'settings.theme', visible: !!preferences },
            { id: 'timezone', label: 'settings.timezone', visible: !!preferences },
            { id: 'formats', label: 'settings.date_time_format', visible: !!preferences },
            { id: 'notifications', label: 'settings.notifications', visible: !!preferences },
            { id: 'autosave', label: 'settings.auto_save', visible: !!preferences },
            { id: 'export', label: 'settings.export_format', visible: !!preferences },
            { id: 'onboarding', label: 'onboarding.settings.title', visible: true },
          ].filter(section => section.visible).map(section => <a key={section.id} href={`#settings-${section.id}`}
            className="rounded-md px-3 py-2 text-xs leading-relaxed text-[var(--workspace-muted)] hover:bg-[var(--workspace-accent-soft)] hover:text-[var(--workspace-accent)]">
            {t(section.label as TranslationKey)}
          </a>)}
        </nav>
        <div className="grid min-w-0 max-w-4xl gap-4">
        <Card id="settings-language" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.language')}</h2>
          <p className="text-xs leading-relaxed text-[var(--workspace-muted)] mb-4">{t('settings.language_description')}</p>
          <div className="grid grid-cols-3 gap-3">
            {languages.map((lang) => (
              <Button
                variant="secondary"
                key={lang.code}
                aria-pressed={locale === lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full min-w-0 flex-col !items-stretch px-3 py-3 rounded-md border transition-colors text-left ${
                  locale === lang.code
                    ? 'border-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)] text-[var(--workspace-ink)]'
                    : 'border-[var(--workspace-line)] hover:bg-[var(--workspace-bg)] text-[var(--workspace-ink)]'
                }`}
              >
                <div className="font-medium">{lang.native}</div>
              </Button>
            ))}
          </div>
        </Card>



        {business && (
        <Card id="settings-currency" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.currency')}</h2>
            <p className="text-xs leading-relaxed text-[var(--workspace-muted)] mb-4">{t('settings.currency_description')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CURRENCIES.map((currency) => (
                <Button
                  variant="secondary"
                  key={currency}
                  aria-pressed={currentCurrency === currency}
                  onClick={() => handleCurrencyChange(currency)}
                  disabled={updateCurrencyMutation.isPending}
                  className={`w-full min-w-0 flex-col !items-stretch px-3 py-3 rounded-md border transition-colors text-left ${
                    currentCurrency === currency
                      ? 'border-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)] text-[var(--workspace-ink)]'
                      : 'border-[var(--workspace-line)] hover:bg-[var(--workspace-bg)] text-[var(--workspace-ink)]'
                  } ${updateCurrencyMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-medium flex items-center justify-center gap-2">
                    <span>{getCurrencySymbol(currency)}</span>
                    <span>{currency}</span>
                  </div>
                  <div className="text-sm text-[var(--workspace-muted)] mt-1">{t(`settings.currency_${currency.toLowerCase()}` as TranslationKey)}</div>
                </Button>
              ))}
            </div>
            {updateCurrencyMutation.isPending && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--workspace-muted)]">
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
          </Card>
        )}

        {preferences && (
        <Card id="settings-theme" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.theme')}</h2>
            <p className="text-xs leading-relaxed text-[var(--workspace-muted)] mb-4">{t('settings.theme_description')}</p>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((theme) => (
                <Button
                  variant="secondary"
                  key={theme.value}
                  aria-pressed={preferences.theme === theme.value}
                  onClick={() => handlePreferenceChange('theme', theme.value)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`w-full min-w-0 flex-col !items-stretch px-3 py-3 rounded-md border transition-colors text-left ${
                    preferences.theme === theme.value
                      ? 'border-[var(--workspace-accent)] bg-[var(--workspace-accent-soft)] text-[var(--workspace-ink)]'
                      : 'border-[var(--workspace-line)] hover:bg-[var(--workspace-bg)] text-[var(--workspace-ink)]'
                  } ${updatePreferencesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div aria-hidden="true" className={`mb-3 h-16 overflow-hidden rounded-lg border border-[var(--workspace-line)] p-2 ${theme.value === 'dark' ? 'bg-[#1e2722]' : theme.value === 'system' ? 'bg-gradient-to-r from-[#f7f7f3] from-50% to-[#1e2722] to-50%' : 'bg-[#f7f7f3]'}`}>
                    <div className="flex h-full gap-2"><div className="w-1/4 rounded bg-[var(--workspace-accent)]/15" /><div className="flex-1 space-y-2 py-1"><div className="h-1.5 w-3/4 rounded bg-[var(--workspace-accent)]/40" /><div className="h-1.5 rounded bg-gray-400/30" /><div className="h-1.5 w-1/2 rounded bg-gray-400/30" /></div></div>
                  </div>
                  <div className="text-center text-sm font-medium">{t(`settings.theme_${theme.value}` as TranslationKey)}</div>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {preferences && (
        <Card id="settings-timezone" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.timezone')}</h2>
            <p className="text-xs leading-relaxed text-[var(--workspace-muted)] mb-4">{t('settings.timezone_description')}</p>
            <Select
              aria-label={t('settings.timezone')}
              value={preferences.timezone || 'UTC'}
              onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
              disabled={updatePreferencesMutation.isPending}
              className="w-full"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
          </Card>
        )}

        {preferences && (
        <Card id="settings-formats" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.date_time_format')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--workspace-ink)] mb-2">{t('settings.date_format')}</label>
                <Select
                  aria-label={t('settings.date_format')}
                  value={preferences.date_format || 'DD/MM/YYYY'}
                  onChange={(e) => handlePreferenceChange('date_format', e.target.value as Option<'date_format'>['value'])}
                  disabled={updatePreferencesMutation.isPending}
                  className="w-full"
                >
                  {DATE_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--workspace-ink)] mb-2">{t('settings.time_format')}</label>
                <Select
                  aria-label={t('settings.time_format')}
                  value={preferences.time_format || '24h'}
                  onChange={(e) => handlePreferenceChange('time_format', e.target.value as Option<'time_format'>['value'])}
                  disabled={updatePreferencesMutation.isPending}
                  className="w-full"
                >
                  {TIME_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>
        )}

        {preferences && (
        <Card id="settings-notifications" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.notifications')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-[var(--workspace-ink)]">{t('settings.email_notifications')}</label>
                  <p className="text-xs text-[var(--workspace-muted)]">{t('settings.email_notifications_description')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label={t('settings.email_notifications')}
                  aria-checked={preferences.email_notifications}
                  onClick={() => handlePreferenceChange('email_notifications', !preferences.email_notifications)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.email_notifications ? 'bg-[var(--workspace-accent)]' : 'bg-gray-300 dark:bg-gray-600'
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
                  <label className="text-sm font-medium text-[var(--workspace-ink)]">{t('settings.push_notifications')}</label>
                  <p className="text-xs text-[var(--workspace-muted)]">{t('settings.push_notifications_description')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label={t('settings.push_notifications')}
                  aria-checked={preferences.push_notifications}
                  onClick={() => handlePreferenceChange('push_notifications', !preferences.push_notifications)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.push_notifications ? 'bg-[var(--workspace-accent)]' : 'bg-gray-300 dark:bg-gray-600'
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
          </Card>
        )}

        {preferences && (
        <Card id="settings-autosave" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.auto_save')}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-[var(--workspace-ink)]">{t('settings.auto_save_enabled')}</label>
                  <p className="text-xs text-[var(--workspace-muted)]">{t('settings.auto_save_description')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-label={t('settings.auto_save_enabled')}
                  aria-checked={preferences.auto_save_enabled}
                  onClick={() => handlePreferenceChange('auto_save_enabled', !preferences.auto_save_enabled)}
                  disabled={updatePreferencesMutation.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.auto_save_enabled ? 'bg-[var(--workspace-accent)]' : 'bg-gray-300 dark:bg-gray-600'
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
                  <label className="block text-sm font-medium text-[var(--workspace-ink)] mb-2">
                    {t('settings.auto_save_interval')} ({t('settings.seconds')})
                  </label>
                  <Input
                    type="number"
                    aria-label={t('settings.auto_save_interval')}
                    min="5"
                    max="300"
                    value={preferences.auto_save_interval}
                    onChange={(e) => handlePreferenceChange('auto_save_interval', parseInt(e.target.value))}
                    disabled={updatePreferencesMutation.isPending}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {preferences && (
        <Card id="settings-export" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
            <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.export_format')}</h2>
            <p className="text-xs leading-relaxed text-[var(--workspace-muted)] mb-4">{t('settings.export_format_description')}</p>
            <Select
              aria-label={t('settings.export_format')}
              value={preferences.export_format || 'csv'}
              onChange={(e) => handlePreferenceChange('export_format', e.target.value as Option<'export_format'>['value'])}
              disabled={updatePreferencesMutation.isPending}
              className="w-full"
            >
              {EXPORT_FORMATS.map((fmt) => (
                <option key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </option>
              ))}
            </Select>
          </Card>
        )}

        <Card id="settings-onboarding" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('onboarding.settings.title')}</h2>
          <p className="text-xs leading-relaxed text-[var(--workspace-muted)] mb-4">{t('onboarding.settings.description')}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setOnboardingSaved(false)
                updateOnboarding.mutate(
                  { tour_completed: false, tour_dismissed: false, welcome_dismissed: true },
                  { onSuccess: () => { setOnboardingSaved(true); navigate('/app') } },
                )
              }}
              disabled={updateOnboarding.isPending}
            >
              {t('onboarding.settings.showTour')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setOnboardingSaved(false)
                updateOnboarding.mutate(
                  { checklist_dismissed: false, welcome_dismissed: true, dismissed_hints: [] },
                  { onSuccess: () => setOnboardingSaved(true) },
                )
              }}
              disabled={updateOnboarding.isPending}
            >
              {t('onboarding.settings.showChecklist')}
            </Button>
          </div>
          {onboardingSaved && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">{t('onboarding.settings.saved')}</p>
          )}
          {updateOnboarding.isError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{apiErrorMessage(updateOnboarding.error, t('onboarding.settings.saveError'))}</p>
          )}
        </Card>

        {updatePreferencesMutation.isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--workspace-muted)]">
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
    </div>
  )
}
