import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import api from '../api/client'
import PasswordCard from '../components/settings/PasswordCard'
import { useAuthStore } from '../store/authStore'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const me = {
  id: 2, full_name: 'Owner', email: 'owner@example.com', role: 'business_owner', phone: null,
  is_2fa_enabled: false, has_password: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 2, role: 'business_owner' })
})

describe('password card', () => {
  it('offers a set-password link to a Google-only account', async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/users/me': me }) as never)
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'sent' } })
    renderWithProviders(<PasswordCard />)
    await userEvent.click(await screen.findByRole('button', { name: 'Set password' }))
    expect(api.post).toHaveBeenCalledWith('/users/me/password/setup')
    expect(await screen.findByRole('status')).toHaveTextContent('owner@example.com')
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument()
  })

  it('changes the password and keeps this device signed in with the new pair', async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/users/me': { ...me, has_password: true } }) as never)
    vi.mocked(api.post).mockResolvedValue({ data: { access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'bearer' } })
    renderWithProviders(<PasswordCard />)
    await userEvent.type(await screen.findByLabelText('Current password'), 'Old!Pass-word1')
    await userEvent.type(screen.getByLabelText('New password'), 'New!Pass-word2')
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'New!Pass-word2')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(api.post).toHaveBeenCalledWith('/users/me/password', {
      current_password: 'Old!Pass-word1', new_password: 'New!Pass-word2',
    })
    expect(await screen.findByText('Password changed.')).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBe('new-access')
    expect(localStorage.getItem('auth_refresh_token')).toBe('new-refresh')
    expect(useAuthStore.getState().user?.id).toBe(2)
  })

  it('does not send mismatched passwords and shows the server error', async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/users/me': { ...me, has_password: true } }) as never)
    renderWithProviders(<PasswordCard />)
    await userEvent.type(await screen.findByLabelText('Current password'), 'Old!Pass-word1')
    await userEvent.type(screen.getByLabelText('New password'), 'New!Pass-word2')
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'Other!Pass-word3')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(api.post).not.toHaveBeenCalled()

    vi.mocked(api.post).mockRejectedValue(apiError(400, 'The current password is wrong'))
    await userEvent.clear(screen.getByLabelText('Repeat new password'))
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'New!Pass-word2')
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The current password is wrong')
    expect(useAuthStore.getState().token).toBe('test-token')
  })
})
