import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Register from '../pages/Register'
import api from '../api/client'
import { renderWithProviders, resetStores, routes } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); resetStores() })
it('offers invited Google registration instead of an unverified password signup', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/offers': { offers: [], version: 'pilot', pilot_mode: true, registration_requires_invitation: true }, '/auth/google/config': { enabled: false, client_id: null } }))
  renderWithProviders(<Register />)
  expect(await screen.findByText(/sign in with google using your invited email/i)).toBeInTheDocument()
  expect(await screen.findByText(/pilot registration is not open yet/i)).toBeInTheDocument()
  expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
  expect(screen.getByRole('combobox')).toHaveValue('business_owner')
  expect(api.post).not.toHaveBeenCalled()
})

it('drops the invitation notice when the pilot is open to every Google account', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/offers': { offers: [], version: 'pilot', pilot_mode: true, registration_requires_invitation: false }, '/auth/google/config': { enabled: false, client_id: null } }))
  renderWithProviders(<Register />)
  expect(await screen.findByRole('combobox')).toHaveValue('business_owner')
  expect(screen.queryByText(/invited email/i)).not.toBeInTheDocument()
  expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
})
