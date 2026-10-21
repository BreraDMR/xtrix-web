import { endOfDay, format, parseISO, startOfDay } from 'date-fns'

// The API sends times as UTC with a Z and takes ISO with Z or an offset back.
// A naive time would be read as UTC by the API, so we always send toISOString().
// Days the user picks ('yyyy-MM-dd' from a date input) are days in their own time zone.

// parseISO reads 'yyyy-MM-dd' as local midnight; new Date('yyyy-MM-dd') would take UTC midnight
export const dayStart = (day: string) => startOfDay(parseISO(day)).toISOString()
export const dayEnd = (day: string) => endOfDay(parseISO(day)).toISOString()
// for single-day fields like an expense date: midday keeps the day in any nearby time zone
export const dayNoon = (day: string) => new Date(`${day}T12:00:00`).toISOString()

export const today = (now = new Date()) => format(now, 'yyyy-MM-dd')
export const localDay = (iso: string) => format(new Date(iso), 'yyyy-MM-dd')

// date-only fields (birth date, promotion dates) carry no time zone, show the same day
export const showDay = (day?: string | null) => (day ? parseISO(day).toLocaleDateString() : '-')

const zonedParts = (value: Date, timeZone: string): Record<string, string> =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(value).map((part) => [part.type, part.value]),
  )

const zoneOffsetMs = (utcMs: number, timeZone: string): number => {
  const parts = zonedParts(new Date(utcMs), timeZone)
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  )
  return asUtc - utcMs
}

// the form collects a wall-clock time in the business time zone, the API stores UTC
export function zonedWallTimeToIso(day: string, time: string, timeZone: string): string {
  const [year, month, date] = day.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const wallAsUtc = Date.UTC(year, month - 1, date, hour, minute)
  let utc = wallAsUtc - zoneOffsetMs(wallAsUtc, timeZone)
  utc = wallAsUtc - zoneOffsetMs(utc, timeZone)
  return new Date(utc).toISOString()
}

export function isoToZonedWallTime(iso: string, timeZone: string): { day: string; time: string } {
  const parts = zonedParts(new Date(iso), timeZone)
  return { day: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

export const showZonedDateTime = (iso: string, timeZone: string): string =>
  new Intl.DateTimeFormat(undefined, { timeZone, dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(iso))

export const isValidTimeWindow = (start: string, end: string, minMinutes = 60): boolean => {
  if (!start || !end) return false
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  return (endHour * 60 + endMinute) - (startHour * 60 + startMinute) >= minMinutes
}

// the business time zone decides which calendar day an instant belongs to
export function zonedDayKey(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${pick('year')}-${pick('month')}-${pick('day')}`
}
