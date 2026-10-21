import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import DayGrid, { type CalendarVisit } from '../components/calendar/DayGrid'
import StaffColumns from '../components/calendar/StaffColumns'
import { chainOverview, expandVisit, visitSegments } from '../components/calendar/chain'
import { renderWithProviders } from '../test/render'

vi.mock('../hooks/useBusinessCurrency', () => ({ useBusinessCurrency: () => 'EUR' }))

const TIME_ZONE = 'Europe/Prague'
const DAY = new Date('2030-05-06T12:00:00+02:00')

const chainVisit: CalendarVisit = {
  id: 41,
  client_id: 7,
  client_name: 'Jana Nováková',
  specialist_id: 10,
  date_start: '2030-05-06T08:00:00Z',
  date_end: '2030-05-06T09:30:00Z',
  created_at: '2030-05-01T08:00:00Z',
  price: 100,
  status: 'planned',
  service_name: 'Haircut, Coloring',
  items: [
    {
      id: 1,
      position: 1,
      service_id: 1,
      service_name: 'Haircut',
      specialist_id: 10,
      date_start: '2030-05-06T08:00:00Z',
      date_end: '2030-05-06T08:30:00Z',
      duration_minutes: 30,
      price: 40,
    },
    {
      id: 2,
      position: 2,
      service_id: 2,
      service_name: 'Coloring',
      specialist_id: 11,
      date_start: '2030-05-06T08:30:00Z',
      date_end: '2030-05-06T09:30:00Z',
      duration_minutes: 60,
      price: 60,
    },
  ],
}

describe('calendar chain segments', () => {
  it('orders items by position and keeps their master and offset', () => {
    const segments = visitSegments(chainVisit)
    expect(segments).toHaveLength(2)
    expect(segments[0]).toMatchObject({
      key: '41-0',
      staffId: 10,
      serviceName: 'Haircut',
      position: 1,
      total: 2,
      offsetMinutes: 0,
      isChain: true,
    })
    expect(segments[1]).toMatchObject({
      key: '41-1',
      staffId: 11,
      serviceName: 'Coloring',
      position: 2,
      total: 2,
      offsetMinutes: 30,
      isChain: true,
    })
    expect(segments[1].start).toBe('2030-05-06T08:30:00Z')
  })

  it('keeps one segment for a legacy visit', () => {
    const legacy = { ...chainVisit, items: undefined, service_name: 'Haircut' }
    const segments = visitSegments(legacy)
    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({ key: '41', isChain: false, position: null, total: 1 })
    expect(expandVisit(legacy)).toEqual([legacy])
    expect(chainOverview(legacy)).toBe(legacy)
  })

  it('expands a chain per item and keeps the original visit for selection', () => {
    const events = expandVisit(chainVisit)
    expect(events).toHaveLength(2)
    expect(events[1].specialist_id).toBe(11)
    expect(events[1].date_start).toBe('2030-05-06T08:30:00Z')
    expect(events[1].date_end).toBe('2030-05-06T09:30:00Z')
    expect(events[1].price).toBe(60)
    expect(events[1].items).toBeUndefined()
    expect(events[1].origin).toBe(chainVisit)
    expect(events[1].segment?.key).toBe('41-1')
  })

  it('shows the whole chain in the week grid with joined services', () => {
    const overview = chainOverview(chainVisit)
    expect(overview.date_start).toBe(chainVisit.date_start)
    expect(overview.date_end).toBe(chainVisit.date_end)
    expect(overview.segment?.serviceName).toBe('Haircut → Coloring')
    expect(overview.segment?.total).toBe(2)
    expect(overview.segment?.position).toBeNull()
  })
})

describe('calendar chain rendering', () => {
  it('puts every service in its own master column and selects the whole visit', () => {
    const onSelect = vi.fn()
    renderWithProviders(
      <StaffColumns
        day={DAY}
        visits={[chainVisit]}
        staff={[
          { id: 10, name: 'Alice' },
          { id: 11, name: 'Bob' },
        ]}
        timeZone={TIME_ZONE}
        onSelectVisit={onSelect}
      />,
    )

    expect(screen.getByTitle('Alice')).toBeInTheDocument()
    expect(screen.getByTitle('Bob')).toBeInTheDocument()
    expect(screen.getAllByText('Jana Nováková')).toHaveLength(2)
    const firstSegment = screen.getByText('1/2').closest('button')
    const secondSegment = screen.getByText('2/2').closest('button')
    expect(firstSegment).not.toBeNull()
    expect(secondSegment).not.toBeNull()
    expect(within(firstSegment as HTMLElement).getByText(/Haircut/)).toBeInTheDocument()
    expect(within(secondSegment as HTMLElement).getByText(/Coloring/)).toBeInTheDocument()

    fireEvent.click(secondSegment as HTMLElement)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      id: 41,
      date_start: '2030-05-06T08:00:00Z',
      date_end: '2030-05-06T09:30:00Z',
    })
  })

  it('drags any segment as the whole chain', () => {
    const onDrop = vi.fn()
    const event = expandVisit(chainVisit)[1]
    renderWithProviders(
      <DayGrid day={DAY} visits={[event]} timeZone={TIME_ZONE} onDropVisit={onDrop} />,
    )

    const card = screen.getByText('2/2').closest('[data-visit-id]') as HTMLElement
    const grid = card.closest('[data-calendar-grid]') as HTMLElement
    expect(grid).not.toBeNull()
    const rect = { top: 0, left: 0, right: 400, bottom: 1536, width: 400, height: 1536, x: 0, y: 0, toJSON: () => ({}) }
    card.getBoundingClientRect = () => rect as DOMRect
    grid.getBoundingClientRect = () => rect as DOMRect

    const transfer = {
      payload: '',
      setData: (_type: string, value: string) => {
        transfer.payload = value
      },
      getData: () => transfer.payload,
      effectAllowed: '',
      dropEffect: '',
    }
    const start = new MouseEvent('dragstart', { bubbles: true, clientY: 32 })
    Object.defineProperty(start, 'dataTransfer', { value: transfer })
    fireEvent(card, start)
    expect(JSON.parse(transfer.payload)).toMatchObject({ id: 41, chainOffsetMinutes: 30 })

    const drop = new MouseEvent('drop', { bubbles: true, clientY: 768 })
    Object.defineProperty(drop, 'dataTransfer', { value: transfer })
    fireEvent(grid, drop)

    expect(onDrop).toHaveBeenCalledTimes(1)
    const [id, dayKey, startMin] = onDrop.mock.calls[0]
    expect(id).toBe(41)
    expect(dayKey).toBe('2030-05-06')
    // dropped segment 2 at 12:00, grabbed 30 minutes into it, chain began 30 minutes earlier
    expect(startMin).toBeCloseTo(720 - 30 - 30, 4)
  })

  it('marks a whole chain in the week grid without hiding any service', () => {
    renderWithProviders(
      <DayGrid day={DAY} visits={[chainOverview(chainVisit)]} timeZone={TIME_ZONE} />,
    )
    expect(screen.getByText('Jana Nováková')).toBeInTheDocument()
    expect(screen.getByText('10:00–11:30', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument()
    const card = screen.getByText('×2').closest('div')
    expect(card).toHaveAttribute('title', expect.stringContaining('Haircut → Coloring'))
  })
})
