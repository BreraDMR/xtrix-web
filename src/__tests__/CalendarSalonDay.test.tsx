import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CalendarPage from '../pages/CalendarPage'
import api from '../api/client'
import { renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
// UTC-10: at 05:00 UTC on the 23rd Prague and UTC are on the 23rd, the salon is still on the 22nd
vi.mock('../hooks/useMyBusiness', () => ({ useMyBusiness: () => ({ data: { timezone: 'Pacific/Honolulu' } }) }))
vi.mock('../components/calendar/StaffColumns', () => ({ default: () => <div>day grid</div> }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-23T05:00:00Z'))
  vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'specialist' })
  vi.mocked(api.get).mockResolvedValue({ data: { items: [], page: 1, per_page: 100, pages: 1, total: 0 } })
})
afterEach(() => { vi.useRealTimers() })

const requestedFrom = () => vi.mocked(api.get).mock.calls
  .filter(([url]) => url === '/visits/')
  .map(([, config]) => (config?.params as { date_from?: string } | undefined)?.date_from)
  .filter(Boolean)

it("opens on the salon's today, not the browser's, and Today comes back to it", async () => {
  renderWithProviders(<CalendarPage />)
  await waitFor(() => expect(requestedFrom()).toContain('2026-10-22T10:00:00.000Z'))
  expect(requestedFrom()).not.toContain('2026-10-23T10:00:00.000Z')

  await userEvent.click(screen.getByRole('button', { name: 'Next' }))
  await waitFor(() => expect(requestedFrom()).toContain('2026-10-23T10:00:00.000Z'))
  vi.mocked(api.get).mockClear()
  await userEvent.click(screen.getByRole('button', { name: 'Today' }))
  await waitFor(() => expect(requestedFrom()).toContain('2026-10-22T10:00:00.000Z'))
})

it('requests overlapping visits through the exclusive next salon midnight', async () => {
  renderWithProviders(<CalendarPage />)
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/visits/', expect.objectContaining({
    params: expect.objectContaining({
      date_from: '2026-10-22T10:00:00.000Z',
      date_to: '2026-10-23T10:00:00.000Z',
      calendar_overlap: true,
    }),
  })))
})
