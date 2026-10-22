import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalendarPage from '../pages/CalendarPage'
import api from '../api/client'
import type { operations } from '../api/schema'
import type { VisitOut, Schema } from '../api/types'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
vi.mock('../hooks/useMyBusiness', () => ({ useMyBusiness: () => ({ data: { timezone: 'UTC' } }) }))
vi.mock('../components/calendar/StaffColumns', () => ({ default: ({ visits }: { visits: VisitOut[] }) =>
  <div data-testid="day-count">{visits.length} day visits</div> }))
vi.mock('../components/SimpleCalendar', () => ({ default: ({ visits }: { visits: VisitOut[] }) =>
  <div>{visits.length} simple visits</div> }))
vi.mock('../components/Calendar', () => ({ default: ({ visits }: { visits: VisitOut[] }) =>
  <div>{visits.length} advanced visits</div> }))

const rows: VisitOut[] = Array.from({ length: 125 }, (_, index) => ({ id: index + 1, client_id: index + 1,
  client_name: `Guest ${index + 1}`, specialist_id: 7, date_start: new Date().toISOString(),
  created_at: new Date().toISOString(), status: 'planned', items: [],
}))

beforeEach(() => {
  vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'specialist' })
})

function serveVisits(failLegacy = false) {
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url !== '/visits/') return Promise.resolve({ data: [] })
    const params = config?.params as NonNullable<operations['visits_list_visits__get']['parameters']['query']> | undefined
    const page = params?.page ?? 1
    const per_page = params?.per_page ?? 20
    if (failLegacy && !params?.date_from && page > 1) return Promise.reject(apiError(500, 'Later page unavailable'))
    const data: Schema<'PaginatedResponse_VisitOut_'> = { page, per_page, total: rows.length,
      pages: Math.ceil(rows.length / per_page), items: rows.slice((page - 1) * per_page, page * per_page) }
    return Promise.resolve({ data })
  })
}

it('passes the complete history to both legacy calendar views', async () => {
  serveVisits()
  renderWithProviders(<CalendarPage />)
  expect(await screen.findByText('125 day visits')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Simple View' }))
  expect(await screen.findByText('125 simple visits')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Advanced View' }))
  expect(await screen.findByText('125 advanced visits')).toBeInTheDocument()
  expect(vi.mocked(api.get).mock.calls.some(([url]) => url === '/clients/')).toBe(false)
})

it('shows a retry instead of a plausible partial calendar when a later page fails', async () => {
  serveVisits(true)
  renderWithProviders(<CalendarPage />)
  await screen.findByText('125 day visits')
  await userEvent.click(screen.getByRole('button', { name: 'Simple View' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
  expect(screen.queryByText(/simple visits/)).not.toBeInTheDocument()
  serveVisits(false)
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('125 simple visits')).toBeInTheDocument()
})
