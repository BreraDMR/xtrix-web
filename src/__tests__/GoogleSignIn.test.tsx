import { beforeEach, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import GoogleSignIn from '../components/auth/GoogleSignIn'
import api from '../api/client'
import { loadGoogleIdentity, type GoogleIdentity } from '../utils/googleIdentity'
import { apiError, renderWithProviders, resetStores, routes } from '../test/render'
import { useAuthStore } from '../store/authStore'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../utils/googleIdentity', () => ({ loadGoogleIdentity: vi.fn() }))
let callback: (answer: { credential: string }) => void
const identity = { initialize: vi.fn<GoogleIdentity['initialize']>(), renderButton: vi.fn(), cancel: vi.fn() }
function mount() { return renderWithProviders(<Routes><Route path="/" element={<GoogleSignIn />} /><Route path="/app" element={<h1>Workspace</h1>} /></Routes>) }
async function googleReturnsCredential() {
  await waitFor(() => expect(identity.renderButton).toHaveBeenCalled())
  await act(async () => callback({ credential: 'signed-google-credential' }))
}
beforeEach(() => {
  vi.clearAllMocks(); resetStores()
  identity.initialize.mockImplementation(options => { callback = options.callback })
  vi.mocked(loadGoogleIdentity).mockResolvedValue(identity)
  vi.mocked(api.get).mockImplementation(routes({ '/auth/google/config': { enabled: true, client_id: 'client.apps.googleusercontent.com' }, '/users/me': { id: 9, full_name: 'Jane', role: 'business_owner' } }))
  vi.mocked(api.post).mockImplementation(async url => url === '/auth/google/nonce' ? { data: { nonce: 'server-nonce', expires_in: 600 } } : { data: { requires_2fa: false, access_token: 'access', refresh_token: 'refresh' } })
})
it('uses a server nonce and Google credential, then loads the normal session', async () => {
  mount(); await googleReturnsCredential()
  expect(identity.initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client.apps.googleusercontent.com', nonce: 'server-nonce', auto_select: false }))
  expect(api.post).toHaveBeenCalledWith('/auth/google/login', { credential: 'signed-google-credential', nonce: 'server-nonce', role: 'business_owner' })
  expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
  expect(useAuthStore.getState().user?.id).toBe(9)
  expect(localStorage.getItem('auth_refresh_token')).toBe('refresh')
})
it('does not load Google or create challenges when Google login is disabled', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/auth/google/config': { enabled: false, client_id: null } }))
  mount(); await waitFor(() => expect(api.get).toHaveBeenCalled())
  expect(loadGoogleIdentity).not.toHaveBeenCalled(); expect(api.post).not.toHaveBeenCalled()
})
it('requires explicit consent and the existing password before linking matching emails', async () => {
  vi.mocked(api.post).mockImplementation(async (url, body) => {
    if (url === '/auth/google/nonce') return { data: { nonce: 'server-nonce', expires_in: 600 } }
    if (!(body as { link_existing?: boolean })?.link_existing) throw apiError(409, 'Connect the existing account', 'google_account_link_required')
    return { data: { requires_2fa: false, access_token: 'access', refresh_token: 'refresh' } }
  })
  mount(); await googleReturnsCredential()
  const link = await screen.findByRole('button', { name: 'Connect Google to my account' })
  expect(link).toBeDisabled()
  await userEvent.type(screen.getByLabelText('Your Xtrix account password'), 'existing-password')
  expect(link).toBeDisabled()
  await userEvent.click(screen.getByRole('checkbox'))
  await userEvent.click(link)
  expect(api.post).toHaveBeenLastCalledWith('/auth/google/login', { credential: 'signed-google-credential', nonce: 'server-nonce', role: 'business_owner', link_existing: true, password: 'existing-password' })
  expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
})
it('keeps the nonce through the existing account two-factor step', async () => {
  vi.mocked(api.post).mockImplementation(async (url, body) => {
    if (url === '/auth/google/nonce') return { data: { nonce: 'server-nonce', expires_in: 600 } }
    const payload = body as { link_existing?: boolean; totp_token?: string }
    if (!payload.link_existing) throw apiError(409, 'Connect the existing account')
    return payload.totp_token ? { data: { requires_2fa: false, access_token: 'access', refresh_token: 'refresh' } } : { data: { requires_2fa: true } }
  })
  mount(); await googleReturnsCredential()
  await userEvent.type(await screen.findByLabelText('Your Xtrix account password'), 'existing-password')
  await userEvent.click(screen.getByRole('checkbox')); await userEvent.click(screen.getByRole('button', { name: 'Connect Google to my account' }))
  await userEvent.type(await screen.findByLabelText('Authentication code'), '123456')
  await userEvent.click(screen.getByRole('button', { name: 'Connect Google to my account' }))
  expect(api.post).toHaveBeenLastCalledWith('/auth/google/login', expect.objectContaining({ nonce: 'server-nonce', totp_token: '123456', link_existing: true }))
  expect(await screen.findByRole('heading', { name: 'Workspace' })).toBeInTheDocument()
})
it('keeps the session empty if the signed-in profile cannot be loaded', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/auth/google/config': { enabled: true, client_id: 'client.apps.googleusercontent.com' } }))
  mount(); await googleReturnsCredential()
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(useAuthStore.getState().token).toBeNull()
  expect(localStorage.getItem('auth_refresh_token')).toBeNull()
})
