import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import api from '../api/client'
import CalendarPage from '../pages/CalendarPage'
import DayGrid from '../components/calendar/DayGrid'
import VisitDetailsDialog from '../components/calendar/VisitDetailsDialog'
import { offscreenVisits, openingMinute } from '../components/calendar/viewport'
import { calendarDate } from '../components/calendar/timeline'
import { renderWithProviders, resetStores, signIn } from '../test/render'
import type { CalendarVisit } from '../components/calendar/DayGrid'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
// the page test only needs the view switch, not the salon grid
vi.mock('../components/calendar/StaffColumns', () => ({ default: () => <div>day grid</div> }))
vi.mock('../hooks/useMyBusiness', () => ({ useMyBusiness: () => ({ data: { timezone: 'Europe/Prague' } }) }))

const ZONE = 'Europe/Prague'
const visit = (patch: Partial<CalendarVisit> = {}): CalendarVisit => ({
  id: 5,
  client_id: 1,
  client_name: 'Anna Novak',
  specialist_id: 7,
  status: 'completed',
  price: 500,
  service_name: 'Haircut',
  date_start: '2030-05-06T08:00:00Z',
  date_end: '2030-05-06T09:00:00Z',
  created_at: '2030-05-01T08:00:00Z',
  items: [],
  ...patch,
} as CalendarVisit)

beforeEach(() => {
  vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'specialist' })
  vi.mocked(api.get).mockResolvedValue({ data: { items: [], page: 1, per_page: 100, pages: 1, total: 0 } })
})
afterEach(() => { vi.useRealTimers() })

describe('visit details dialog', () => {
  const open = (props: Partial<Parameters<typeof VisitDetailsDialog>[0]> = {}) => {
    const handlers = { onClose: vi.fn(), onMoved: vi.fn(), onEdit: vi.fn() }
    renderWithProviders(<VisitDetailsDialog visit={visit()} name="Anna Novak" staffName="Eva Master"
      timeZone={ZONE} canManage {...handlers} {...props} />)
    return handlers
  }

  it('shows who, what, when and the status before any action', () => {
    open()
    const dialog = screen.getByRole('dialog', { name: 'Visit details' })
    expect(within(dialog).getByText('Anna Novak')).toBeInTheDocument()
    expect(within(dialog).getByText('Haircut')).toBeInTheDocument()
    expect(within(dialog).getByText('Eva Master')).toBeInTheDocument()
    expect(within(dialog).getByText('Completed')).toBeInTheDocument()
    expect(within(dialog).getByText(/10:00–11:00/)).toBeInTheDocument()
    expect(within(dialog).getByText(ZONE)).toBeInTheDocument()
  })

  it('lists every service of a chain in order', () => {
    open({ visit: visit({ items: [
      { id: 2, position: 2, service_name: 'Colour', date_start: '2030-05-06T09:00:00Z', date_end: '2030-05-06T10:00:00Z', duration_minutes: 60 },
      { id: 1, position: 1, service_name: 'Wash', date_start: '2030-05-06T08:00:00Z', date_end: '2030-05-06T09:00:00Z', duration_minutes: 60 },
    ] }) })
    const services = within(screen.getByRole('list', { name: 'Services' })).getAllByRole('listitem')
    expect(services.map(item => item.textContent)).toEqual([
      expect.stringContaining('Wash'), expect.stringContaining('Colour'),
    ])
  })

  it('confirms the move from the old time to the new one, and only after a change', async () => {
    open()
    const dialog = screen.getByRole('dialog', { name: 'Visit details' })
    const move = within(dialog).getByRole('button', { name: 'Move' })
    expect(move).toBeDisabled()
    const time = dialog.querySelector('input[type="time"]') as HTMLInputElement
    await userEvent.clear(time)
    await userEvent.type(time, '16:00')
    expect(within(dialog).getByText(/2030-05-06 10:00 → 2030-05-06 16:00/)).toBeInTheDocument()
    expect(move).toBeEnabled()
  })

  it('opens the full edit form from the details', async () => {
    const { onEdit } = open()
    await userEvent.click(screen.getByRole('button', { name: 'Edit visit' }))
    expect(onEdit).toHaveBeenCalledWith(5)
  })

  it('offers no move or edit in a read-only workspace', () => {
    open({ canManage: false })
    const dialog = screen.getByRole('dialog', { name: 'Visit details' })
    expect(within(dialog).queryByRole('button', { name: 'Move' })).toBeNull()
    expect(within(dialog).queryByRole('button', { name: 'Edit visit' })).toBeNull()
    expect(dialog.querySelector('input[type="time"]')).toBeNull()
  })
})

describe('grid viewport', () => {
  it('opens at the working morning, or earlier for an early visit', () => {
    expect(openingMinute([])).toBe(450)
    expect(openingMinute([600])).toBe(450)
    expect(openingMinute([60, 600])).toBe(30)
  })

  it('counts visits hidden above and below the visible hours', () => {
    const ranges = [{ start: 60, end: 120 }, { start: 600, end: 660 }, { start: 1320, end: 1380 }]
    // 64px an hour, the box shows 09:00–18:00
    const hidden = offscreenVisits(ranges, 9 * 64, 9 * 64, 64)
    expect(hidden.earlier).toEqual([{ start: 60, end: 120 }])
    expect(hidden.later).toEqual([{ start: 1320, end: 1380 }])
    // nothing measured yet - nothing is reported as hidden
    expect(offscreenVisits(ranges, 0, 0, 64)).toEqual({ earlier: [], later: [] })
  })
})

describe('day grid', () => {
  it('draws a now line only on the salon today', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2030-05-06T08:30:00Z'))
    const { unmount } = renderWithProviders(<DayGrid day={calendarDate('2030-05-06', ZONE)} visits={[]} timeZone={ZONE} />)
    const line = document.querySelector('[data-now-line]') as HTMLElement
    expect(line).not.toBeNull()
    // 10:30 Prague on a 64px hour
    expect(line.style.top).toBe(`${10.5 * 64}px`)
    unmount()
    renderWithProviders(<DayGrid day={calendarDate('2030-05-07', ZONE)} visits={[]} timeZone={ZONE} />)
    expect(document.querySelector('[data-now-line]')).toBeNull()
  })

  it('marks a status by shape as well as colour', () => {
    renderWithProviders(<DayGrid day={calendarDate('2030-05-06', ZONE)} timeZone={ZONE} visits={[
      visit({ id: 1, status: 'completed' }),
      visit({ id: 2, status: 'cancelled', date_start: '2030-05-06T10:00:00Z', date_end: '2030-05-06T11:00:00Z' }),
      visit({ id: 3, status: 'in_progress', date_start: '2030-05-06T12:00:00Z', date_end: '2030-05-06T13:00:00Z' }),
    ]} />)
    const mark = (id: number) => document.querySelector(`[data-visit-id="${id}"] [data-status-mark]`)?.textContent
    expect(new Set([mark(1), mark(2), mark(3)]).size).toBe(3)
    expect(document.querySelector('[data-visit-id="1"]')).toHaveAttribute('data-status', 'completed')
  })
})

it('names the calendar views by what they show', async () => {
  renderWithProviders(<CalendarPage />)
  const view = screen.getByRole('combobox', { name: 'Calendar view' })
  await waitFor(() => expect(within(view).getAllByRole('option').map(option => option.textContent)).toEqual([
    'Day', 'Week', 'Month · day list', 'Month · grid',
  ]))
})
