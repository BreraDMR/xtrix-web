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
