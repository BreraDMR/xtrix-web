import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Visits from '../pages/Visits'
import { formatCurrency } from '../utils/currency'
import api from '../api/client'
import type { operations } from '../api/schema'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'
import { dayEnd, dayStart, localDay, showDay, today } from '../utils/dates'

// New York is behind UTC, so mixing up UTC and local dates moves things to the wrong day here
vi.stubEnv('TZ', 'America/New_York')
afterAll(() => { vi.unstubAllEnvs() })

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

describe('local calendar days', () => {
  it('turns a picked day into the local start and end of that day', () => {
    expect(dayStart('2026-10-18')).toBe('2026-10-18T04:00:00.000Z')
    expect(dayEnd('2026-10-18')).toBe('2026-10-19T03:59:59.999Z')
  })

  it('reads API times (UTC with Z) as the local day', () => {
    expect(localDay('2026-10-18T02:00:00Z')).toBe('2026-10-17')
    expect(today(new Date('2026-10-18T02:00:00Z'))).toBe('2026-10-17')
  })

  it('shows date-only fields as the same day, not the UTC midnight before it', () => {
    expect(showDay('2026-10-18')).toBe(new Date(2026, 9, 18).toLocaleDateString())
    expect(showDay(null)).toBe('-')
  })
})

describe('visits date filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    const rows = [
      { id: 1, client_id: 3, client_name: 'Jana Nováková', specialist_id: 7, date_start: '2026-10-18T01:00:00Z', status: 'planned', price: 20 },
      { id: 2, client_id: 3, client_name: 'Jana Nováková', specialist_id: 7, date_start: '2026-10-18T15:00:00Z', status: 'planned', price: 30 },
    ]
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/visits/') return routes({ '/businesses/me': { currency: 'EUR' } })(url, config)
      const params = config?.params as NonNullable<operations['visits_list_visits__get']['parameters']['query']> | undefined
      const items = rows.filter(row => (!params?.date_from || row.date_start >= params.date_from) &&
        (!params?.date_to || row.date_start <= params.date_to))
      return Promise.resolve({ data: { items, page: 1, per_page: 20, total: items.length, pages: 1 } })
    })
  })

  it('keeps only visits on the picked local day', async () => {
    const { container } = renderWithProviders(<Visits />)
    await screen.findAllByRole('cell', { name: 'Jana Nováková' })
    expect(screen.getAllByRole('row')).toHaveLength(3)
    const [from, to] = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
    await userEvent.type(from, '2026-10-18')
    await userEvent.type(to, '2026-10-18')
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2))
    expect(api.get).toHaveBeenCalledWith('/visits/', expect.objectContaining({ params: expect.objectContaining({
      date_from: '2026-10-18T04:00:00.000Z', date_to: '2026-10-19T03:59:59.999Z',
    }) }))
    expect(screen.getByText(formatCurrency(30, 'EUR'))).toBeInTheDocument()
    expect(screen.queryByText(formatCurrency(20, 'EUR'))).not.toBeInTheDocument()
  })
})
