import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Settings from '../pages/Settings'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 2, role: 'specialist' })
})
afterEach(() => document.documentElement.classList.remove('dark'))

describe('appearance controls', () => {
  it('saves a theme before marking it selected and retains all three choices', async () => {
    const preferences = {
      id: 1, user_id: 2, language: 'en', theme: 'light', email_notifications: true,
      push_notifications: false, auto_save_enabled: false, auto_save_interval: 30,
    }
    vi.mocked(api.get).mockImplementation(routes({ '/user-preferences/me': preferences }))
    let finishSave!: (value: { data: typeof preferences }) => void
    vi.mocked(api.put).mockImplementation(() => new Promise(resolve => { finishSave = resolve }))
    renderWithProviders(<Settings />)
    const dark = await screen.findByRole('button', { name: 'Dark' })
    expect(dark).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(dark)
    expect(api.put).toHaveBeenCalledWith('/user-preferences/me', { theme: 'dark' })
    expect(dark).toHaveAttribute('aria-pressed', 'false')
    expect(dark).toBeDisabled()
    finishSave({ data: { ...preferences, theme: 'dark' } })
    await waitFor(() => expect(dark).toHaveAttribute('aria-pressed', 'true'))
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Light' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'System' })).toBeEnabled()
    expect(screen.getByRole('switch', { name: /email notifications/i })).toBeChecked()
  })
})
