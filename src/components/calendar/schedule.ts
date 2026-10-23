import { parseISO } from 'date-fns'
import { dayTimeline, wallIntervals } from './timeline'
import type {
  BlockSlotOut,
  ScheduleExceptionOut,
  VisitOut,
  WorkScheduleOut,
} from '../../api/types'

export interface MinuteInterval {
  start: number
  end: number
}

export interface DayOverlay {
  working: MinuteInterval[]
  nonWorking: MinuteInterval[]
  blocks: (MinuteInterval & { label?: string })[]
  free: MinuteInterval[]
}

export interface StaffScheduleData {
  work: WorkScheduleOut[]
  blocks: BlockSlotOut[]
  exceptions: ScheduleExceptionOut[]
  // false when SCH could not be read, so the grid does not shade a day it knows nothing about
  complete: boolean
}

const FALLBACK_VISIT_MINUTES = 60

const toMinutes = (value: string): number => {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + (minute || 0)
}

function intervalOnDay(
  startIso: string,
  endIso: string,
  dayKey: string,
  timeZone: string,
): MinuteInterval | null {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return null
  }
  const day = dayTimeline(dayKey, timeZone)
  const startMin = (Math.max(start.getTime(), day.start) - day.start) / 60_000
  const endMin = (Math.min(end.getTime(), day.end) - day.start) / 60_000
  return endMin > startMin ? { start: startMin, end: endMin } : null
}

function mergeIntervals(intervals: MinuteInterval[]): MinuteInterval[] {
  const sorted = intervals
    .filter((interval) => interval.end > interval.start)
    .map((interval) => ({ ...interval }))
    .sort((a, b) => a.start - b.start)
  const merged: MinuteInterval[] = []
  for (const interval of sorted) {
    const last = merged[merged.length - 1]
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end)
    } else {
      merged.push(interval)
    }
  }
  return merged
}

function complement(intervals: MinuteInterval[], dayMinutes: number): MinuteInterval[] {
  const merged = mergeIntervals(intervals)
  const gaps: MinuteInterval[] = []
  let cursor = 0
  for (const interval of merged) {
    if (interval.start > cursor) gaps.push({ start: cursor, end: Math.min(interval.start, dayMinutes) })
    cursor = Math.max(cursor, interval.end)
    if (cursor >= dayMinutes) break
  }
  if (cursor < dayMinutes) gaps.push({ start: cursor, end: dayMinutes })
  return gaps
}

function subtractIntervals(base: MinuteInterval[], cuts: MinuteInterval[]): MinuteInterval[] {
  const sortedCuts = mergeIntervals(cuts)
  const result: MinuteInterval[] = []
  for (const interval of mergeIntervals(base)) {
    let cursor = interval.start
    for (const cut of sortedCuts) {
      if (cut.end <= cursor) continue
      if (cut.start >= interval.end) break
      if (cut.start > cursor) result.push({ start: cursor, end: Math.min(cut.start, interval.end) })
      cursor = Math.max(cursor, cut.end)
      if (cursor >= interval.end) break
    }
    if (cursor < interval.end) result.push({ start: cursor, end: interval.end })
  }
  return result
}

function workingIntervals(dayKey: string, data: StaffScheduleData): MinuteInterval[] {
  const exception = data.exceptions.find((item) => item.exception_date === dayKey)
  if (exception) {
    if (exception.is_closed) return []
    if (exception.start_time && exception.end_time) {
      const start = toMinutes(exception.start_time)
      const end = toMinutes(exception.end_time)
      return end > start ? [{ start, end }] : []
    }
  }
  const weekday = (parseISO(dayKey).getDay() + 6) % 7
  return data.work
    .filter((item) => item.weekday === weekday)
    .map((item) => ({ start: toMinutes(item.start_time), end: toMinutes(item.end_time) }))
}

function visitIntervals(visits: VisitOut[], dayKey: string, timeZone: string): MinuteInterval[] {
  const intervals: MinuteInterval[] = []
  for (const visit of visits) {
    const start = new Date(visit.date_start)
    if (Number.isNaN(start.getTime())) continue
    const end = visit.date_end ? new Date(visit.date_end) : null
    const endIso = end && end.getTime() > start.getTime()
      ? end.toISOString()
      : new Date(start.getTime() + FALLBACK_VISIT_MINUTES * 60_000).toISOString()
    const interval = intervalOnDay(start.toISOString(), endIso, dayKey, timeZone)
    if (interval) intervals.push(interval)
  }
  return intervals
}

export function buildDayOverlay(
  dayKey: string,
  timeZone: string,
  data: StaffScheduleData,
  visits: VisitOut[],
): DayOverlay {
  const working = mergeIntervals(wallIntervals(dayKey, timeZone, workingIntervals(dayKey, data)))
  const blocks = data.blocks.flatMap((block) => {
    const interval = intervalOnDay(block.start, block.end, dayKey, timeZone)
    return interval ? [{ ...interval, label: block.reason ?? undefined }] : []
  })
  const busy = mergeIntervals([...blocks, ...visitIntervals(visits, dayKey, timeZone)])
  return {
    working,
    nonWorking: complement(working, dayTimeline(dayKey, timeZone).minutes),
    blocks,
    free: subtractIntervals(working, busy),
  }
}
