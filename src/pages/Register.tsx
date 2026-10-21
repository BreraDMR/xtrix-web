import GoogleSignIn from '../components/auth/GoogleSignIn'
import QueryError from '../components/QueryError'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { apiFormErrors } from '../api/errors'
import type { Schema } from '../api/types'
import FormError from '../components/FormError'
import LoadingSpinner from '../components/LoadingSpinner'
import SpecialistTypeSelector from '../components/SpecialistTypeSelector'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useTranslation } from '../hooks/useTranslation'
import { useOffers } from '../hooks/useOffers'
import { logger } from '../utils/logger'
import { useLabels } from '../i18n/labels'

// The only roles the API lets you pick at signup (anything else is a 403). Admins are
// made by hand, employees are created by their business owner.
const SIGNUP_ROLES = ['specialist', 'business_owner'] as const
type SignupRole = (typeof SIGNUP_ROLES)[number]

const SIGNUP_FIELDS = ['full_name', 'email', 'phone', 'password', 'role', 'specialist_type']

export default function Register() {
  const { t } = useTranslation()
  const offers = useOffers()
  const navigate = useNavigate()
  const labels = useLabels()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'specialist' as SignupRole,
    specialist_type: '',
  })
  // Invited pilot accounts are salons first; a solo specialist picks it explicitly.
  const [pilotRole, setPilotRole] = useState<SignupRole>('business_owner')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { setAuth, startSession } = useAuthStore()

  useEffect(() => {
    if (useAuthStore.getState().token && useAuthStore.getState().user) navigate('/app', { replace: true })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordMismatch'))
      setLoading(false)
      return
    }

    if (!formData.email && !formData.phone) {
      setError(t('register.contactRequired'))
      setLoading(false)
      return
    }

    let accountCreated = false
    try {
      logger.log('[Register] Attempting registration', { email: formData.email, phone: formData.phone })
      
      if (formData.role === 'specialist' && !formData.specialist_type) {
        setError(t('register.specialistTypeRequired'))
        setLoading(false)
        return
      }

      const userDataPayload: Schema<'UserCreate'> = {
        full_name: formData.full_name,
        password: formData.password,
        role: formData.role,
      }
      
      if (formData.email && formData.email.trim()) {
        userDataPayload.email = formData.email.trim()
      }
      
      if (formData.phone && formData.phone.trim()) {
        userDataPayload.phone = formData.phone.trim()
      }
      
      if (formData.role === 'specialist' && formData.specialist_type) {
        userDataPayload.specialist_type = formData.specialist_type
      }

      await api.post('/users/', userDataPayload)

      accountCreated = true
      logger.log('[Register] User created successfully')

      const { data: loginData } = await api.post('/users/login', {
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
      })

      if (!loginData.access_token) {
        throw new Error('No access token received')
      }

      startSession(loginData.access_token, loginData.refresh_token)
      const { data: user } = await api.get('/users/me')
      const token = useAuthStore.getState().token
      if (!token) throw new Error('Session expired')
      setAuth(token, user)
      navigate('/app', { replace: true })
    } catch (err) {
      if (accountCreated) {
        useAuthStore.getState().logout()
        navigate('/login', { replace: true, state: { accountCreated: true } })
        return
      }
      const { fields, general } = apiFormErrors(err, SIGNUP_FIELDS, t('register.failed'))
      setFieldErrors(fields)
      setError(general)
    } finally {
      setLoading(false)
    }
  }

  if (offers.isLoading) return <LoadingSpinner />
  if (offers.isError) return <QueryError retry={offers.refetch} />
  if (offers.data?.pilot_mode) return <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-16 dark:bg-gray-900">
    <div className="absolute right-4 top-4"><LanguageSwitcher /></div>
    <div className="ui-card w-full max-w-md space-y-6 p-8">
      <h1 className="text-center text-3xl font-semibold">Xtrix</h1>
      <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">{t('pilot.invitation')}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('pricing.trial')}</p>
      <label className="block text-sm font-medium">{t('register.role')}
        <select value={pilotRole} onChange={event => setPilotRole(event.target.value as SignupRole)} className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
          <option value="business_owner">{labels.role('business_owner')}</option>
          <option value="specialist">{labels.role('specialist')}</option>
        </select>
      </label>
      <GoogleSignIn role={pilotRole} registration />
      <Link to="/login" className="block text-center text-sm font-medium text-blue-600 dark:text-blue-400">{t('login.signIn')}</Link>
    </div>
  </main>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5 py-16 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="ui-card max-w-md w-full space-y-8 p-8 sm:p-10">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-[-1.5px] text-gray-900 dark:text-white mb-3">Xtrix</h2>
          <p className="text-gray-600 dark:text-gray-300">{t('register.title')}</p>
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-left text-xs text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
            <div className="font-semibold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              {t('register.trial_badge')}
            </div>
            <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-300">
              {t('register.trial_desc')}
            </p>
            <p className="mt-1.5 pt-1.5 border-t border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-500 dark:text-slate-400">
              {t('register.ai_bonus')}
            </p>
          </div>
        </div>
        {offers.data?.registration_requires_invitation && <p role="status" className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/40 dark:text-blue-100">{t('pilot.invitation')}</p>}
        <GoogleSignIn role={formData.role} />
          <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('register.fullName')} *
            </label>
            <input
              aria-invalid={fieldErrors.full_name ? true : undefined}
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t('register.namePlaceholder')}
            />
            {fieldErrors.full_name && <FormError message={fieldErrors.full_name} />}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              {t('register.email')}
            </label>
            <input
              aria-invalid={fieldErrors.email ? true : undefined}
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
            {fieldErrors.email && <FormError message={fieldErrors.email} />}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              {t('register.phone')}
            </label>
            <input
              aria-invalid={fieldErrors.phone ? true : undefined}
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="+1234567890"
            />
            {fieldErrors.phone && <FormError message={fieldErrors.phone} />}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">{t('register.contactRequired')}</p>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              {t('register.password')} *
            </label>
            <input
              aria-invalid={fieldErrors.password ? true : undefined}
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
            {fieldErrors.password && <FormError message={fieldErrors.password} />}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('register.passwordHint')}
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              {t('register.confirmPassword')} *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
              {t('register.role')} *
            </label>
            <select
              aria-invalid={fieldErrors.role ? true : undefined}
              id="role"
              name="role"
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as SignupRole
                setFormData({ 
                  ...formData, 
                  role: newRole,
                  specialist_type: newRole !== 'specialist' ? '' : formData.specialist_type,
                })
              }}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {SIGNUP_ROLES.map((role) => (
                <option key={role} value={role}>{labels.role(role)}</option>
              ))}
            </select>
            {fieldErrors.role && <FormError message={fieldErrors.role} />}
          </div>

          {formData.role === 'specialist' && (
            <div>
              <label htmlFor="specialist_type" className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                {t('register.specialistType')} *
              </label>
              <SpecialistTypeSelector
                value={formData.specialist_type}
                onChange={(value) => setFormData({ ...formData, specialist_type: value })}
                required
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm animate-slide-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>{t('register.creating')}</span>
              </>
            ) : (
              t('register.createAccount')
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              {t('register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


