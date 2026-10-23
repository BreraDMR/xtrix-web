import { describe, expect, it } from 'vitest'
import { addCalendarDays, calendarDate, dayTimeline, timelineIso, timelineLabel, wallIntervals } from '../components/calendar/timeline'
import { zonedDayKey } from '../utils/dates'

const zone = 'Europe/Prague'
describe('calendar elapsed timeline', () => {
  it('keeps both copies of the autumn hour distinct', () => {
    const day = dayTimeline('2026-10-25', zone)
    expect(day.minutes).toBe(1500)
    expect(new Date(day.start).toISOString()).toBe('2026-10-24T22:00:00.000Z')
    expect(timelineIso('2026-10-25', 225, zone)).toBe('2026-10-25T01:45:00.000Z')
    expect(timelineLabel('2026-10-25T00:45:00Z', zone, true)).toContain('GMT+2')
    expect(timelineLabel('2026-10-25T01:15:00Z', zone, true)).toContain('GMT+1')
    expect(wallIntervals('2026-10-25', zone, [{ start: 120, end: 150 }])).toEqual([
      { start: 120, end: 150 }, { start: 180, end: 210 },
    ])
  })
  it('skips the spring gap and keeps date-only navigation stable', () => {
    expect(dayTimeline('2026-03-29', zone).minutes).toBe(1380)
    expect(wallIntervals('2026-03-29', zone, [{ start: 120, end: 180 }])).toEqual([])
    expect(addCalendarDays('2026-10-25', 1)).toBe('2026-10-26')
    for (const key of ['2026-10-25', '2026-07-25']) {
      expect(zonedDayKey(calendarDate(key, zone), zone)).toBe(key)
    }
  })
  it('allows a clipped tail to keep its origin on the preceding day', () => {
    expect(timelineIso('2026-10-25', -30, zone)).toBe('2026-10-24T21:30:00.000Z')
    expect(timelineIso('2026-10-25', 1500, zone)).toBe('2026-10-25T23:00:00.000Z')
  })
})
