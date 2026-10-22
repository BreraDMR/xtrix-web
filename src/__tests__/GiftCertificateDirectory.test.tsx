import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GiftOffers from '../components/loyalty/GiftOffers'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 1, role: 'business_owner', business_id: 1 }) })

function serve(fail = false) {
  vi.mocked(api.get).mockImplementation(url => {
    const parsed = new URL(url, 'http://test.local')
    if (parsed.pathname === '/businesses/me/gift-certificates') {
      const rows = Array.from({ length: 125 }, (_, i) => ({ id: 125 - i, status: i === 124 ? 'active' : 'exhausted',
        kind: 'money', code_last4: String(125 - i).padStart(4, '0'), currency: 'EUR',
        recipient_name: `Recipient ${125 - i}`, face_value: 20, money_balance: i === 124 ? 20 : 0,
        visits_remaining: 0, visits_total: 0, issued_at: '2026-10-01T10:00:00Z', expires_at: '2027-10-01T10:00:00Z' }))
      const offset = Number(parsed.searchParams.get('offset') ?? 0)
      const limit = Number(parsed.searchParams.get('limit') ?? 100)
      const status = parsed.searchParams.get('status')
      if (fail && offset > 0) return Promise.reject(apiError(500, 'Later certificates unavailable'))
      return Promise.resolve({ data: rows.filter(row => !status || row.status === status).slice(offset, offset + limit) })
    }
    if (parsed.pathname === '/services/') return Promise.resolve({ data: { items: [], page: 1, per_page: 100, total: 0, pages: 0 } })
    return Promise.resolve({ data: [] })
  })
}

it('includes older certificates and applies status to the complete matching directory', async () => {
  serve()
  renderWithProviders(<GiftOffers />)
  expect(await screen.findByText('Recipient 1', { exact: true })).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'All statuses' }), 'active')
  expect(await screen.findByText('Recipient 1', { exact: true })).toBeInTheDocument()
  expect(screen.queryByText('Recipient 125', { exact: true })).not.toBeInTheDocument()
})

it('offers a retry instead of showing a partial certificate directory', async () => {
  serve(true)
  renderWithProviders(<GiftOffers />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Later certificates unavailable')
  expect(screen.queryByText('Recipient 125', { exact: true })).not.toBeInTheDocument()
  serve()
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('Recipient 1', { exact: true })).toBeInTheDocument()
})
