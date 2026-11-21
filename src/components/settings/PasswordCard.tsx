import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import api from '../../api/client'
import { apiErrorMessage, apiFormErrors } from '../../api/errors'
import type { TokenResponse, UserMeOut } from '../../api/types'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
import Button from '../../ui/Button'
import Card from '../../ui/Card'
import Input from '../../ui/Input'
import FormError from '../FormError'

const ACCOUNT_ME_KEY = ['account-me'] as const

const EMPTY = { current: '', next: '', repeat: '' }

export default function PasswordCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const renewTokens = useAuthStore((state) => state.renewTokens)
  const me = useQuery<UserMeOut>({
    queryKey: ACCOUNT_ME_KEY,
    queryFn: async () => (await api.get<UserMeOut>('/users/me')).data,
    retry: false,
  })
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [changed, setChanged] = useState(false)

  if (!me.data) return null
  const account = me.data

  const sendLink = async () => {
    setBusy(true)
    setError('')
    try {
      await api.post('/users/me/password/setup')
      setSentTo(account.email ?? '')
    } catch (err) {
      setError(apiErrorMessage(err, t('settings.password.linkFailed')))
    } finally {
      setBusy(false)
    }
  }

  const change = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    setChanged(false)
    if (form.next !== form.repeat) {
      setError(t('register.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      const { data } = await api.post<TokenResponse>('/users/me/password', {
        current_password: form.current,
        new_password: form.next,
      })
      // the server signed out every session, this one keeps going with the new pair
      renewTokens(data.access_token, data.refresh_token)
      setForm(EMPTY)
      setChanged(true)
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_ME_KEY })
    } catch (err) {
      const parsed = apiFormErrors(err, ['current_password', 'new_password'], t('settings.password.failed'))
      setFieldErrors(parsed.fields)
      setError(parsed.general)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card id="settings-password" className="scroll-mt-6 p-5 sm:p-6 target:border-[var(--workspace-accent)]">
      <h2 className="text-[15px] font-semibold tracking-tight text-[var(--workspace-ink)] mb-3">{t('settings.password.title')}</h2>
      {!account.has_password ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--workspace-muted)]">{t('settings.password.googleOnly')}</p>
          {sentTo !== null ? (
            <p role="status" className="rounded-lg bg-[var(--tint-green)] p-3 text-sm text-[var(--tint-green-ink)]">
              {t('settings.password.linkSent').replace('{email}', sentTo)}
            </p>
          ) : (
            <Button variant="secondary" disabled={busy} onClick={() => void sendLink()}>
              {busy ? t('settings.password.sending') : t('settings.password.set')}
            </Button>
          )}
        </div>
      ) : (
        <form onSubmit={change} className="grid max-w-md gap-3">
          <p className="text-sm text-[var(--workspace-muted)]">{t('settings.password.changeHint')}</p>
          <label className="grid gap-1 text-sm">
            <span>{t('settings.password.current')}</span>
            <Input type="password" autoComplete="current-password" required value={form.current}
              aria-invalid={fieldErrors.current_password ? true : undefined}
              onChange={(event) => setForm({ ...form, current: event.target.value })} />
            {fieldErrors.current_password && <FormError message={fieldErrors.current_password} />}
          </label>
          <label className="grid gap-1 text-sm">
            <span>{t('settings.password.new')}</span>
            <Input type="password" autoComplete="new-password" required minLength={8} value={form.next}
              aria-invalid={fieldErrors.new_password ? true : undefined}
              onChange={(event) => setForm({ ...form, next: event.target.value })} />
            {fieldErrors.new_password && <FormError message={fieldErrors.new_password} />}
          </label>
          <p className="-mt-2 text-xs text-[var(--workspace-muted)]">{t('register.passwordHint')}</p>
          <label className="grid gap-1 text-sm">
            <span>{t('settings.password.confirm')}</span>
            <Input type="password" autoComplete="new-password" required minLength={8} value={form.repeat}
              onChange={(event) => setForm({ ...form, repeat: event.target.value })} />
          </label>
          {changed && <p role="status" className="text-sm text-[var(--tint-green-ink)]">{t('settings.password.changed')}</p>}
          <div>
            <Button type="submit" disabled={busy}>
              {busy ? t('settings.password.saving') : t('settings.password.change')}
            </Button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-[var(--tint-red-ink)]">{error}</p>}
    </Card>
  )
}
