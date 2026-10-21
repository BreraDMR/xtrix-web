import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import PublicFeatureGate from '../components/subscription/PublicFeatureGate'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); resetStores() })
it.each(['email', 'payments', 'forms'] as const)('does not mount the disabled %s flow in pilot mode', async feature => {
  vi.mocked(api.get).mockImplementation(routes({ '/offers': { offers: [], version: 'pilot', pilot_mode: true, email_available: false } }))
  renderWithProviders(<PublicFeatureGate feature={feature}><h1>Disabled feature</h1></PublicFeatureGate>)
  expect(await screen.findByRole('status')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Disabled feature' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/login')
})
it('does not mount sensitive flows if configuration cannot be checked', async () => {
  vi.mocked(api.get).mockRejectedValue(apiError(503, 'Unavailable'))
  renderWithProviders(<PublicFeatureGate feature="payments"><h1>Checkout</h1></PublicFeatureGate>)
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Checkout' })).not.toBeInTheDocument()
})
it('keeps configured features available outside the pilot', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/offers': { offers: [], version: 'paid', pilot_mode: false, email_available: true } }))
  renderWithProviders(<PublicFeatureGate feature="email"><h1>Reset password</h1></PublicFeatureGate>)
  expect(await screen.findByRole('heading', { name: 'Reset password' })).toBeInTheDocument()
})
