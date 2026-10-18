import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { apiError, renderWithProviders, resetStores } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const me = { id: 3, full_name: 'Jana Owner', role: 'business_owner' }

function renderLogin() {
  return renderWithProviders(<Routes>
    <Route path="/" element={<Login />} />
    <Route path="/home" element={<p>home page</p>} />
  </Routes>)
}

async function signInWith(email = 'jana@example.com', password = 'Str0ng!pass') {
  await userEvent.type(screen.getByLabelText(/email/i), email)
  await userEvent.type(screen.getByLabelText(/password/i), password)
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.post).mockReset()
    resetStores()
    vi.mocked(api.get).mockResolvedValue({ data: me })
  })

  it('asks for the 2FA code instead of failing, then signs in with it', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { requires_2fa: true, access_token: null, refresh_token: null } })
      .mockResolvedValueOnce({ data: { requires_2fa: false, access_token: 'a', refresh_token: 'r' } })
    renderLogin()
    await signInWith()
    expect(await screen.findByText(/enter the 6-digit code from your authenticator app/i)).toBeInTheDocument()
    expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/authentication code/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(api.post).toHaveBeenLastCalledWith('/users/login', { email: 'jana@example.com', password: 'Str0ng!pass', totp_token: '123456' })
    await vi.waitFor(() => expect(useAuthStore.getState().user).toEqual(me))
    expect(localStorage.getItem('auth_refresh_token')).toBe('r')
  })

  it('says the code is wrong when the 2FA step is refused', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { requires_2fa: true } })
      .mockRejectedValueOnce(apiError(401, 'Invalid credentials'))
    renderLogin()
    await signInWith()
    await userEvent.type(await screen.findByLabelText(/authentication code/i), '000000')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/wrong code/i)).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('shows how long to wait when sign-in is throttled', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(429, 'Account is locked', undefined, {
      headers: { 'retry-after': '45' }, type: 'LoginThrottled',
    }))
    renderLogin()
    await signInWith()
    expect(await screen.findByText('Too many failed sign-in attempts. Try again in 45 s.')).toBeInTheDocument()
  })
})
