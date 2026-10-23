import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import api from '../api/client'
import TrialBanner from '../components/TrialBanner'
import { renderWithProviders, resetStores } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); resetStores() })

it('keeps the CRM trial visible alongside a paid AI subscription', async () => {
  const end = new Date(Date.now() + 7 * 86400000).toISOString()
  vi.mocked(api.get).mockImplementation(async (url, config) => {
    if (url === '/subscriptions/trial/status') return { data: {
      is_trial: true, is_trial_active: true, trial_end: end, has_access: true,
    } }
    const product = (config?.params as { product?: string } | undefined)?.product
    return { data: product === 'crm' ? { is_trial: true, status: 'active' } : {
      is_trial: false, status: 'active', offer_code: 'ai_starter_czk',
    } }
  })
  renderWithProviders(<TrialBanner />)
  expect(await screen.findByText(/Trial period:/)).toBeInTheDocument()
})
