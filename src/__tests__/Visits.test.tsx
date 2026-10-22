import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { formatCurrency } from '../utils/currency'
import Visits from '../pages/Visits'
import api from '../api/client'
import type { operations } from '../api/schema'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

const visits = [
  { id: 1, client_id: 3, client_name: 'Jana Nováková', specialist_id: 7, date_start: '2026-10-18T10:00:00Z', status: 'planned', price: 20 },
  { id: 2, client_id: 99, specialist_id: 7, date_start: '2026-10-19T10:00:00Z', status: 'planned', price: 30 },
]
type VisitQuery = NonNullable<operations['visits_list_visits__get']['parameters']['query']>

function visitRoutes(rows = visits) {
  return ((url, config) => {
    if (url !== '/visits/') return routes({ '/businesses/me': { currency: 'EUR' } })(url, config)
    const params = (config?.params as VisitQuery | undefined) ?? {}
    const query = String(params.q ?? '').toLowerCase()
    const found = rows.filter(row => !query || row.client_name?.toLowerCase().includes(query))
    const page = params.page ?? 1
    const per_page = params.per_page ?? 20
    return Promise.resolve({ data: { items: found.slice((page - 1) * per_page, page * per_page),
      total: found.length, page, per_page, pages: Math.ceil(found.length / per_page) } })
  }) as typeof api.get
}

describe('Visits client names', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(visitRoutes())
  })

  it('shows names included in visit rows and searches them on the server', async () => {
    renderWithProviders(<Visits />)
    expect(await screen.findByRole('columnheader', { name: /client/i })).toBeInTheDocument()
    const cell = await screen.findByRole('cell', { name: 'Jana Nováková' })
    expect(within(cell.closest('tr')!).getByText(formatCurrency(20, 'EUR'))).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(3)
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'nová')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(vi.mocked(api.get).mock.calls.map(call => call[0]).every(url => ['/visits/', '/businesses/me'].includes(url))).toBe(true)
  })

  it('keeps visits visible when their client is unavailable', async () => {
    vi.mocked(api.get).mockImplementation(visitRoutes(visits.map(row => ({ ...row, client_name: undefined }))))
    renderWithProviders(<Visits />)
    await screen.findByText(formatCurrency(20, 'EUR'))
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('columnheader', { name: /client/i })).toBeInTheDocument()
  })

  it('uses server totals and finds a client beyond the first hundred visits', async () => {
    const rows = Array.from({ length: 125 }, (_, index) => ({ ...visits[0], id: index + 1,
      client_name: `Guest ${String(index + 1).padStart(3, '0')}` }))
    vi.mocked(api.get).mockImplementation(visitRoutes(rows))
    renderWithProviders(<Visits />)
    expect(await screen.findByText(/of 125/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '2' }))
    expect(await screen.findByText('Guest 021')).toBeInTheDocument()
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'Guest 125')
    expect(await screen.findByText('Guest 125')).toBeInTheDocument()
    expect(screen.queryByText('Guest 021')).not.toBeInTheDocument()
  })
})
