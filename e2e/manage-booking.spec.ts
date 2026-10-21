import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test'
import { apiUrl, newOwner, openAs, unique, type Session } from './helpers'

const TIMEZONE = 'Europe/Prague'
const SERVICE_NAME = 'Manage Cut'
const DAY_MS = 24 * 60 * 60 * 1000

interface PublicSettings {
  slug: string
  is_enabled: boolean
}

interface PublicSlot {
  start: string
  staff_id: number
}

interface PublicSlots {
  timezone: string
  days: { date: string; slots: PublicSlot[] }[]
}

interface PublicBooking {
  id: number
  start: string
  service_name: string
  staff_name: string
  status: string
  timezone: string
  manage_token?: string
}

interface ManageSummary {
  booking_id: number
  status: string
  start: string
  timezone: string
  confirmed_at: string | null
}

interface BookableSalon {
  owner: Session
  serviceId: number
  slug: string
  name: string
}

async function json<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

function pragueDate(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * DAY_MS)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function pragueWeekday(): number {
  const short = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TIMEZONE }).format(new Date())
  const index = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[short]
  if (index === undefined) throw new Error(`Unknown weekday ${short}`)
  return index
}

function pragueLocalInput(iso: string): string {
  const date = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

async function createBookableSalon(
  request: APIRequestContext,
  { includeToday = false }: { includeToday?: boolean } = {},
): Promise<BookableSalon> {
  const owner = await newOwner(request, { fullName: 'Marta Manager' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')

  const name = unique('Manage Salon')
  await json(await request.put(`${apiUrl}/businesses/${businessId}`, {
    headers: owner.headers,
    data: {
      name,
      currency: 'EUR',
      timezone: TIMEZONE,
      booking_horizon_days: 14,
      booking_lead_time_minutes: 0,
    },
  }))

  const service = await json<{ id: number }>(await request.post(`${apiUrl}/services/`, {
    headers: owner.headers,
    data: {
      name: SERVICE_NAME,
      duration_minutes: 30,
      price: 40,
      specialist_id: owner.user.id,
      specialist_ids: [owner.user.id],
      is_active: true,
    },
  }))

  const today = pragueWeekday()
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    if (weekday === today && !includeToday) continue
    await json(await request.post(`${apiUrl}/schedules/work`, {
      headers: owner.headers,
      data: { specialist_id: owner.user.id, weekday, start_time: '08:00', end_time: '20:00' },
    }))
  }

  const settings = await json<PublicSettings>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers,
    data: { is_enabled: true },
  }))
  return { owner, serviceId: service.id, slug: settings.slug, name }
}

async function availableSlots(
  request: APIRequestContext,
  salon: BookableSalon,
  minAheadMs: number,
): Promise<PublicSlot[]> {
  const slots = await json<PublicSlots>(await request.get(`${apiUrl}/public/booking/${salon.slug}/slots`, {
    params: { service_id: salon.serviceId, date_from: pragueDate(0), date_to: pragueDate(13) },
  }))
  expect(slots.timezone).toBe(TIMEZONE)
  const cutoff = Date.now() + minAheadMs
  return slots.days.flatMap((day) => day.slots).filter((slot) => new Date(slot.start).getTime() > cutoff)
}

async function createBooking(
  request: APIRequestContext,
  salon: BookableSalon,
  slot: PublicSlot,
): Promise<{ booking: PublicBooking; guestName: string }> {
  const guestName = unique('Manage Guest')
  const response = await request.post(`${apiUrl}/public/booking/${salon.slug}/bookings`, {
    data: {
      service_id: salon.serviceId,
      staff_id: slot.staff_id,
      start: slot.start,
      full_name: guestName,
      email: `${unique('manage')}@example.com`,
      marketing_consent: false,
      processing_consent: true,
      client_request_id: unique('manage-request'),
    },
  })
  return { booking: await json<PublicBooking>(response), guestName }
}

function tokenHeaders(token: string) {
  return { 'X-Booking-Token': token }
}

async function readManaged(request: APIRequestContext, token: string): Promise<ManageSummary> {
  return json<ManageSummary>(await request.get(`${apiUrl}/public/booking-management`, {
    headers: tokenHeaders(token),
  }))
}

test('guest confirms, moves and cancels a booking with safe repeats', async ({ page, request, browser }) => {
  const salon = await createBookableSalon(request)
  const slots = await availableSlots(request, salon, 26 * 60 * 60 * 1000)
  if (slots.length < 2) throw new Error('The salon needs at least two slots beyond the cutoff')
  const initial = slots[0]
  const target = slots[slots.length - 1]
  const { booking, guestName } = await createBooking(request, salon, initial)
  if (!booking.manage_token) throw new Error('The public booking has no management token')
  const token = booking.manage_token

  const guestContext = await browser.newContext({
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:3170',
    locale: 'en-GB',
    timezoneId: TIMEZONE,
    viewport: { width: 1280, height: 800 },
  })
  const guest = await guestContext.newPage()
  try {
    await guest.goto(`/manage#token=${encodeURIComponent(token)}`)
    await expect(guest.getByRole('heading', { name: salon.name })).toBeVisible()
    expect(new URL(guest.url()).hash).toBe('')
    await expect(guest.getByText(`#${booking.id}`)).toBeVisible()
    await expect(guest.getByText('Planned', { exact: true })).toBeVisible()
    await expect(guest.getByText(/until 24 hours before the visit/)).toBeVisible()

    const confirmed = guest.waitForResponse(
      (response) => response.url().endsWith('/public/booking-management/confirm') && response.request().method() === 'POST',
    )
    await guest.getByRole('button', { name: 'Confirm booking' }).click()
    const confirmedResponse = await confirmed
    expect(confirmedResponse.status()).toBe(200)
    const confirmedSummary = (await confirmedResponse.json()) as ManageSummary
    expect(confirmedSummary.confirmed_at).not.toBeNull()
    await expect(guest.getByText('Your booking is confirmed.')).toBeVisible()
    await expect(guest.getByText('Confirmed', { exact: true })).toBeVisible()
    await expect(guest.getByRole('button', { name: 'Confirm booking' })).toHaveCount(0)

    const replay = await json<ManageSummary>(await request.post(`${apiUrl}/public/booking-management/confirm`, {
      headers: tokenHeaders(token),
    }))
    expect(replay.confirmed_at).toBe(confirmedSummary.confirmed_at)

    await guest.getByRole('button', { name: 'Reschedule' }).click()
    await expect(guest.getByRole('heading', { name: 'Choose a new time' })).toBeVisible()
    await guest.locator('#manage-new-start').fill(pragueLocalInput(target.start))
    const moved = guest.waitForResponse(
      (response) => response.url().endsWith('/public/booking-management/reschedule') && response.request().method() === 'POST',
    )
    await guest.getByRole('button', { name: 'Move booking' }).click()
    const movedResponse = await moved
    expect(movedResponse.status()).toBe(200)
    const movedSummary = (await movedResponse.json()) as ManageSummary
    expect(new Date(movedSummary.start).getTime()).toBe(new Date(target.start).getTime())
    expect(movedSummary.confirmed_at).toBe(confirmedSummary.confirmed_at)
    await expect(guest.getByText('Your booking has been moved.')).toBeVisible()

    const repeatedMove = await json<ManageSummary>(await request.post(`${apiUrl}/public/booking-management/reschedule`, {
      headers: tokenHeaders(token),
      data: { start: target.start },
    }))
    expect(new Date(repeatedMove.start).getTime()).toBe(new Date(target.start).getTime())

    await guest.getByRole('button', { name: 'Cancel booking' }).click()
    await expect(guest.getByText('Cancel this booking? The time will be released and cannot be restored.')).toBeVisible()
    await guest.getByRole('button', { name: 'Keep booking' }).click()
    await expect(guest.getByRole('button', { name: 'Cancel booking' })).toBeVisible()
    expect((await readManaged(request, token)).status).toBe('planned')

    await guest.getByRole('button', { name: 'Cancel booking' }).click()
    const cancelled = guest.waitForResponse(
      (response) => response.url().endsWith('/public/booking-management/cancel') && response.request().method() === 'POST',
    )
    await guest.getByRole('button', { name: 'Yes, cancel' }).click()
    const cancelledResponse = await cancelled
    expect(cancelledResponse.status()).toBe(200)
    await expect(guest.getByText('The booking is cancelled.')).toBeVisible()
    await expect(guest.getByText('Cancelled', { exact: true })).toBeVisible()
    await expect(guest.getByRole('heading', { name: 'What would you like to do?' })).toHaveCount(0)

    await guest.reload()
    await expect(guest.getByText('Cancelled', { exact: true })).toBeVisible()
    await expect(guest.getByRole('button', { name: 'Confirm booking' })).toHaveCount(0)
    await expect(guest.getByRole('button', { name: 'Reschedule' })).toHaveCount(0)

    const afterCancel = await request.post(`${apiUrl}/public/booking-management/confirm`, {
      headers: tokenHeaders(token),
    })
    expect(afterCancel.status()).toBe(409)
    const afterCancelMove = await request.post(`${apiUrl}/public/booking-management/reschedule`, {
      headers: tokenHeaders(token),
      data: { start: slots[0].start },
    })
    expect(afterCancelMove.status()).toBe(409)
    const cancelledAgain = await json<ManageSummary>(await request.post(`${apiUrl}/public/booking-management/cancel`, {
      headers: tokenHeaders(token),
    }))
    expect(cancelledAgain.status).toBe('cancelled')

    const visit = await json<{ status: string; date_start: string }>(await request.get(`${apiUrl}/visits/${booking.id}`, {
      headers: salon.owner.headers,
    }))
    expect(visit.status).toBe('cancelled')
    expect(new Date(visit.date_start).getTime()).toBe(new Date(target.start).getTime())

    await guest.goto('/manage#token=not-a-real-token')
    await guest.reload()
    await expect(guest.getByRole('heading', { name: 'This booking link is unavailable' })).toBeVisible()

    const unknown = await request.get(`${apiUrl}/public/booking-management`, {
      headers: tokenHeaders('not-a-real-token'),
    })
    expect(unknown.status()).toBe(404)
    const anonymous = await request.get(`${apiUrl}/public/booking-management`)
    expect(anonymous.status()).toBe(404)
  } finally {
    await guestContext.close()
  }

  await openAs(page, salon.owner, '/app/visits')
  await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()
  const row = page.getByRole('row').filter({ hasText: guestName })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('Cancelled')
})

test('the cutoff and an unusable token cannot be bypassed', async ({ request, browser }) => {
  const salon = await createBookableSalon(request, { includeToday: true })
  const slots = await availableSlots(request, salon, 60 * 1000)
  if (slots.length === 0) throw new Error('The salon has no future slots')
  const soon = slots[0]
  expect(new Date(soon.start).getTime() - Date.now()).toBeLessThan(DAY_MS)
  const { booking } = await createBooking(request, salon, soon)
  if (!booking.manage_token) throw new Error('The public booking has no management token')
  const token = booking.manage_token

  const guestContext = await browser.newContext({
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:3170',
    locale: 'en-GB',
    timezoneId: TIMEZONE,
    viewport: { width: 1280, height: 800 },
  })
  const guest = await guestContext.newPage()
  try {
    await guest.goto(`/manage#token=${encodeURIComponent(token)}`)
    await expect(guest.getByRole('heading', { name: salon.name })).toBeVisible()
    await expect(guest.getByText(/Online rescheduling and cancellation are closed/)).toBeVisible()
    await expect(guest.getByRole('button', { name: 'Confirm booking' })).toBeVisible()
    await expect(guest.getByRole('button', { name: 'Reschedule' })).toHaveCount(0)
    await expect(guest.getByRole('button', { name: 'Cancel booking' })).toHaveCount(0)

    const confirmed = await request.post(`${apiUrl}/public/booking-management/confirm`, {
      headers: tokenHeaders(token),
    })
    expect(confirmed.status()).toBe(200)

    const lateMove = await request.post(`${apiUrl}/public/booking-management/reschedule`, {
      headers: tokenHeaders(token),
      data: { start: slots[slots.length - 1].start },
    })
    expect(lateMove.status()).toBe(409)
    const lateCancel = await request.post(`${apiUrl}/public/booking-management/cancel`, {
      headers: tokenHeaders(token),
    })
    expect(lateCancel.status()).toBe(409)

    const summary = await readManaged(request, token)
    expect(summary.status).toBe('planned')
    expect(new Date(summary.start).getTime()).toBe(new Date(soon.start).getTime())
  } finally {
    await guestContext.close()
  }
})
