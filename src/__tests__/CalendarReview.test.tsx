import { describe, expect, it, vi } from 'vitest'
import DayGrid, { type CalendarVisit } from '../components/calendar/DayGrid'
import { buildDayOverlay, type StaffScheduleData } from '../components/calendar/schedule'
import { renderWithProviders } from '../test/render'

vi.mock('../hooks/useBusinessCurrency', () => ({ useBusinessCurrency: () => 'EUR' }))

// CAL-09 review findings: short visits must not stack on top of each other, and a cancelled
// visit must not hide a free window the API would happily book.
const TIME_ZONE = 'Europe/Prague'
const DAY = new Date('2030-05-06T12:00:00+02:00')

const visit = (id: number, start: string, end: string, status = 'planned'): CalendarVisit => ({
  id,
  late_cancel: false,
  client_id: id,
  client_name: `Client ${id}`,
  specialist_id: 10,
  date_start: start,
  date_end: end,
  created_at: '2030-05-01T08:00:00Z',
  price: 20,
  status,
  service_name: 'Brows',
  items: [],
})

const px = (value: string) => Number.parseFloat(value)

describe('busy day layout', () => {
  it('puts back-to-back 15-minute visits side by side instead of on top of each other', () => {
    // 09:00-09:15 and 09:15-09:30 Prague: 16px each at 64px/hour, but cards are at least 30px tall
    const visits = [
      visit(1, '2030-05-06T07:00:00Z', '2030-05-06T07:15:00Z'),
      visit(2, '2030-05-06T07:15:00Z', '2030-05-06T07:30:00Z'),
      visit(3, '2030-05-06T07:30:00Z', '2030-05-06T07:45:00Z'),
    ]
    const { container } = renderWithProviders(<DayGrid day={DAY} visits={visits} timeZone={TIME_ZONE} />)
    const cards = visits.map((row) => container.querySelector<HTMLElement>(`[data-visit-id="${row.id}"]`)!)
    const boxes = cards.map((card) => ({
      top: px(card.style.top), bottom: px(card.style.top) + px(card.style.height),
      left: card.style.left, width: card.style.width,
    }))
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const verticalOverlap = boxes[i].top < boxes[j].bottom && boxes[j].top < boxes[i].bottom
        if (verticalOverlap) expect(boxes[i].left, `visits ${i + 1} and ${j + 1}`).not.toBe(boxes[j].left)
      }
    }
  })

  it('keeps a full-width card when visits are long enough not to touch', () => {
    const visits = [
      visit(1, '2030-05-06T07:00:00Z', '2030-05-06T07:30:00Z'),
      visit(2, '2030-05-06T07:30:00Z', '2030-05-06T08:00:00Z'),
    ]
    const { container } = renderWithProviders(<DayGrid day={DAY} visits={visits} timeZone={TIME_ZONE} />)
    for (const row of visits) {
      expect(container.querySelector<HTMLElement>(`[data-visit-id="${row.id}"]`)!.style.width).toBe('calc(100% - 4px)')
    }
  })
})

describe('free windows', () => {
  const data: StaffScheduleData = {
    work: [{ id: 1, specialist_id: 10, weekday: 0, start_time: '09:00', end_time: '12:00' }] as StaffScheduleData['work'],
    blocks: [],
    exceptions: [],
    complete: true,
  }

  it('does not count a cancelled visit as busy time', () => {
    const overlay = buildDayOverlay('2030-05-06', TIME_ZONE, data, [
      visit(1, '2030-05-06T08:00:00Z', '2030-05-06T09:00:00Z', 'cancelled'),
    ])
    // 09:00-12:00 Prague in minutes from midnight
    expect(overlay.free).toEqual([{ start: 540, end: 720 }])
  })

  it('still carves out planned visits and blocks', () => {
    const overlay = buildDayOverlay('2030-05-06', TIME_ZONE, {
      ...data,
      blocks: [{ id: 1, specialist_id: 10, start: '2030-05-06T09:00:00Z', end: '2030-05-06T09:30:00Z', reason: 'Lunch' }] as StaffScheduleData['blocks'],
    }, [visit(1, '2030-05-06T08:00:00Z', '2030-05-06T09:00:00Z')])
    // visit 10:00-11:00, block 11:00-11:30
    expect(overlay.free).toEqual([{ start: 540, end: 600 }, { start: 690, end: 720 }])
    expect(overlay.blocks).toEqual([{ start: 660, end: 690, label: 'Lunch' }])
  })

  it('a closed exception day has no working or free time', () => {
    const overlay = buildDayOverlay('2030-05-06', TIME_ZONE, {
      ...data,
      exceptions: [{ id: 1, specialist_id: 10, exception_date: '2030-05-06', is_closed: true }] as StaffScheduleData['exceptions'],
    }, [])
    expect(overlay.working).toEqual([])
    expect(overlay.free).toEqual([])
  })
})
