import { isoToZonedWallTime, zonedWallTimeToIso } from '../../utils/dates'

export function addCalendarDays(key: string, count: number): string {
  const date = new Date(`${key}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

export const calendarDate = (key: string, zone: string): Date =>
  new Date(zonedWallTimeToIso(key, '12:00', zone))

export function dayTimeline(key: string, zone: string) {
  const start = Date.parse(zonedWallTimeToIso(key, '00:00', zone))
  const end = Date.parse(zonedWallTimeToIso(addCalendarDays(key, 1), '00:00', zone))
  return { start, end, minutes: (end - start) / 60_000 }
}

export const timelineIso = (key: string, minute: number, zone: string): string =>
  new Date(dayTimeline(key, zone).start + minute * 60_000).toISOString()

export function timelineLabel(iso: string, zone: string, offsets = false): string {
  if (!offsets) return isoToZonedWallTime(iso, zone).time
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset',
  }).format(new Date(iso))
}

// Schedule wall times may occur twice. Keep both copies on the elapsed-time axis.
export function wallIntervals(key: string, zone: string, windows: { start: number; end: number }[]) {
  const day = dayTimeline(key, zone)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
  })
  const result: { start: number; end: number }[] = []
  for (let minute = 0; minute < day.minutes; minute++) {
    const [hour, part] = formatter.format(new Date(day.start + minute * 60_000)).split(':').map(Number)
    const wall = hour * 60 + part
    if (!windows.some(window => wall >= window.start && wall < window.end)) continue
    const last = result[result.length - 1]
    if (last?.end === minute) last.end++
    else result.push({ start: minute, end: minute + 1 })
  }
  return result
}
