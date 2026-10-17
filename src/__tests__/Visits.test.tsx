import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatCurrency } from '../utils/currency'
import Visits from '../pages/Visits'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

const visits = [
  { id: 1, client_id: 3, specialist_id: 7, date_start: '2026-10-18T10:00:00Z', status: 'planned', price: 20 },
  { id: 2, client_id: 99, specialist_id: 7, date_start: '2026-10-19T10:00:00Z', status: 'planned', price: 30 },
]

describe('Visits client names', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(routes({
      '/visits/': visits, '/clients/': [{ id: 3, full_name: 'Jana Nováková' }], '/businesses/me': { currency: 'EUR' },
    }) as any)
  })

  it('shows names from the client list and filters by them', async () => {
    renderWithProviders(<Visits />)
    expect(await screen.findByRole('columnheader', { name: /client/i })).toBeInTheDocument()
    const cell = await screen.findByRole('cell', { name: 'Jana Nováková' })
    expect(within(cell.closest('tr')!).getByText(formatCurrency(20, 'EUR'))).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(3)
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'nová')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(vi.mocked(api.get).mock.calls.map(call => call[0]).every(url => ['/visits/', '/clients/', '/businesses/me'].includes(url))).toBe(true)
  })

  it('keeps visits visible when their client is unavailable', async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/visits/': visits, '/clients/': [], '/businesses/me': {} }) as any)
    renderWithProviders(<Visits />)
    await screen.findByText(formatCurrency(20, 'EUR'))
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('columnheader', { name: /client/i })).toBeInTheDocument()
  })
})
