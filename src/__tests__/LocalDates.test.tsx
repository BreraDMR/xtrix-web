import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Visits from '../pages/Visits'
import { formatCurrency } from '../utils/currency'
import api from '../api/client'
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
    vi.mocked(api.get).mockImplementation(routes({
      '/visits/': [
        // 9 pm on the 17th in New York
        { id: 1, client_id: 3, specialist_id: 7, date_start: '2026-10-18T01:00:00Z', status: 'planned', price: 20 },
        { id: 2, client_id: 3, specialist_id: 7, date_start: '2026-10-18T15:00:00Z', status: 'planned', price: 30 },
      ],
      '/clients/': [{ id: 3, full_name: 'Jana Nováková' }], '/businesses/me': { currency: 'EUR' },
    }))
  })

  it('keeps only visits on the picked local day', async () => {
    const { container } = renderWithProviders(<Visits />)
    await screen.findAllByRole('cell', { name: 'Jana Nováková' })
    expect(screen.getAllByRole('row')).toHaveLength(3)
    const [from, to] = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
    await userEvent.type(from, '2026-10-18')
    await userEvent.type(to, '2026-10-18')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText(formatCurrency(30, 'EUR'))).toBeInTheDocument()
    expect(screen.queryByText(formatCurrency(20, 'EUR'))).not.toBeInTheDocument()
  })
})
