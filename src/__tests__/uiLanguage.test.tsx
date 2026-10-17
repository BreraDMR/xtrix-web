import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from '../pages/Settings'
import { useSyncUiLanguage } from '../hooks/useUiLanguage'
import api from '../api/client'
import { useLocaleStore } from '../store/localeStore'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const preferences = (language: string | null) => ({
  id: 1, user_id: 2, language, theme: 'light', email_notifications: true, push_notifications: false,
  auto_save_enabled: true, auto_save_interval: 30, created_at: '2026-10-01T10:00:00', updated_at: '2026-10-01T10:00:00',
})

function SyncProbe() {
  useSyncUiLanguage()
  return null
}

describe('UI language', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 2, role: 'specialist' })
    vi.mocked(api.put).mockImplementation(((_url: string, body: { language: string }) =>
      Promise.resolve({ data: preferences(body.language) })) as any)
  })

  it('applies the language saved in the account after login', async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/user-preferences/me': preferences('ru') }) as any)
    renderWithProviders(<SyncProbe />)
    await waitFor(() => expect(useLocaleStore.getState().locale).toBe('ru'))
    expect(api.put).not.toHaveBeenCalled()
  })

  it('saves the login-page language for an account without one', async () => {
    useLocaleStore.setState({ locale: 'cz' })
    vi.mocked(api.get).mockImplementation(routes({ '/user-preferences/me': preferences(null) }) as any)
    renderWithProviders(<SyncProbe />)
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/user-preferences/me', { language: 'cz' }))
  })

  it('switching language in Settings saves it to the account', async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/user-preferences/me': preferences('en') }) as any)
    renderWithProviders(<Settings />)

    await userEvent.click(await screen.findByRole('button', { name: /čeština/i }))

    expect(useLocaleStore.getState().locale).toBe('cz')
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/user-preferences/me', { language: 'cz' }))
  })
})
