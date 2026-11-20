import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface MinuteRange {
  start: number
  end: number
}

const WORK_MORNING = 8 * 60
const LEAD_IN = 30

// Where a time grid opens: the working morning, or a bit before an earlier visit/shift.
// All 24 hours stay in the grid, this only picks the first thing you see.
export function openingMinute(starts: number[]): number {
  return Math.max(0, Math.min(WORK_MORNING, ...starts) - LEAD_IN)
}

// Visits that sit completely above or below the visible part of a scrolled grid.
// An unmeasured box (height 0) reports nothing, so we never shout "hidden" by mistake.
export function offscreenVisits(ranges: MinuteRange[], scrollTop: number, height: number, hourHeight: number) {
  if (height <= 0) return { earlier: [] as MinuteRange[], later: [] as MinuteRange[] }
  const top = scrollTop / hourHeight * 60
  const bottom = (scrollTop + height) / hourHeight * 60
  return {
    earlier: ranges.filter(range => range.end <= top),
    later: ranges.filter(range => range.start >= bottom),
  }
}

// Scroll state for a day/week grid: opens once per anchor (a day or a week) near work
// and tells which visits are out of view, with a jump to the nearest one.
// `starts` may add more opening hints than the visits themselves (a shift that starts early).
export function useGridViewport(anchor: string, ranges: MinuteRange[], hourHeight: number, starts: number[] = [], ready = true) {
  const box = useRef<HTMLDivElement>(null)
  const opened = useRef('')
  const [view, setView] = useState({ top: 0, height: 0 })
  const first = openingMinute([...ranges.map(range => range.start), ...starts])

  const measure = useCallback(() => {
    const element = box.current
    if (!element) return
    // the sticky header row sits on top of the hours, so the hours start below it
    const grid = element.querySelector('[data-calendar-grid]')
    const header = grid ? grid.getBoundingClientRect().top - element.getBoundingClientRect().top + element.scrollTop : 0
    setView({ top: element.scrollTop, height: element.clientHeight - header })
  }, [])

  useLayoutEffect(() => {
    if (!box.current || opened.current === anchor) return
    box.current.scrollTop = first / 60 * hourHeight
    opened.current = anchor
    measure()
  }, [anchor, first, hourHeight, measure, ready])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const hidden = offscreenVisits(ranges, view.top, view.height, hourHeight)
  const jumpTo = (minute: number) => {
    const element = box.current
    if (!element) return
    element.scrollTop = Math.max(0, minute - LEAD_IN) / 60 * hourHeight
    measure()
  }
  return {
    box,
    onScroll: measure,
    earlier: hidden.earlier.length,
    later: hidden.later.length,
    // the closest hidden visit, so one press always shows something new
    showEarlier: () => jumpTo(Math.max(...hidden.earlier.map(range => range.start))),
    showLater: () => jumpTo(Math.min(...hidden.later.map(range => range.start))),
  }
}
