import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import api from '../api/client'
import VisitDetailsDialog from '../components/calendar/VisitDetailsDialog'
import { renderWithProviders, resetStores, signIn } from '../test/render'
import type { CalendarVisit } from '../components/calendar/DayGrid'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

const hourAgo = () => new Date(Date.now() - 3600_000).toISOString()
const inTwoDays = () => new Date(Date.now() + 2 * 86400_000).toISOString()

const visit = (patch: Partial<CalendarVisit> = {}): CalendarVisit => ({
  id: 5, client_id: 1, client_name: 'Anna Novak', specialist_id: 7, status: 'planned', price: 500,
  service_name: 'Haircut', date_start: hourAgo(), date_end: null, created_at: hourAgo(), items: [],
  late_cancel: false, ...patch,
} as CalendarVisit)

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 1, role: 'business_owner', business_id: 1 })
  vi.mocked(api.put).mockResolvedValue({ data: {} })
})

describe('attendance on the visit', () => {
  const open = (value: CalendarVisit) => {
    const handlers = { onClose: vi.fn(), onMoved: vi.fn(), onEdit: vi.fn() }
    renderWithProviders(<VisitDetailsDialog visit={value} name="Anna Novak" timeZone="Europe/Prague" canManage {...handlers} />)
    return handlers
  }

  it('marks a started visit as a no-show and refreshes the calendar', async () => {
    const handlers = open(visit())
    await userEvent.click(screen.getByRole('button', { name: "Client didn't come" }))
    expect(api.put).toHaveBeenCalledWith('/visits/5', { status: 'no_show' })
    await waitFor(() => expect(handlers.onMoved).toHaveBeenCalled())
  })

  it('undoes a no-show back to planned', async () => {
    open(visit({ status: 'no_show' }))
    expect(within(screen.getByRole('dialog')).getByText('No-show')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Undo no-show' }))
    expect(api.put).toHaveBeenCalledWith('/visits/5', { status: 'planned' })
  })

  it('lets staff waive a late cancellation', async () => {
    open(visit({ status: 'cancelled', late_cancel: true }))
    expect(screen.getByText(/Late cancellation/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Not a late cancellation' }))
    expect(api.put).toHaveBeenCalledWith('/visits/5', { late_cancel: false })
  })

  it('offers no no-show button before the visit starts', () => {
    open(visit({ date_start: inTwoDays() }))
    expect(screen.queryByRole('button', { name: "Client didn't come" })).not.toBeInTheDocument()
    expect(screen.getByText('You can mark a no-show once the visit has started.')).toBeInTheDocument()
  })

  it('shows the API reason when the server refuses', async () => {
    const { apiError } = await import('../test/render')
    vi.mocked(api.put).mockRejectedValueOnce(apiError(422, 'Only a planned or ongoing visit can be marked as a no-show'))
    const handlers = open(visit())
    await userEvent.click(screen.getByRole('button', { name: "Client didn't come" }))
    expect(await screen.findByText('Only a planned or ongoing visit can be marked as a no-show')).toBeInTheDocument()
    expect(handlers.onMoved).not.toHaveBeenCalled()
  })
})
