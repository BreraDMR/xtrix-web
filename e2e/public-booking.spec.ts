import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test'
import { apiUrl, newOwner, openAs, unique, type Session } from './helpers'

const TIMEZONE = 'Europe/Prague'
const SERVICE_NAME = 'Cut and Go'
const SERVICE_PRICE = 40

interface PublicSettings {
  slug: string
  is_enabled: boolean
  has_bookable_service: boolean
  has_schedule: boolean
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
  end: string
  service_name: string
  staff_id: number
  staff_name: string
  price: number | null
  currency: string
  status: string
  timezone: string
  manage_token?: string
}

interface PublicBookingPayload {
  service_id: number
  staff_id: number
  start: string
  full_name: string
  email?: string
  marketing_consent: boolean
  processing_consent: boolean
  client_request_id: string
}

interface BookableSalon {
  owner: Session
  serviceId: number
  settings: PublicSettings
  name: string
}

async function json<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()}`).toBeTruthy()
  return (await response.json()) as T
}

function pragueDate(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
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

async function createBookableSalon(
  request: APIRequestContext,
  { enabled = false }: { enabled?: boolean } = {},
): Promise<BookableSalon> {
  const owner = await newOwner(request, { fullName: 'Bohdan Booker' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')

  const name = unique('BK Salon')
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
      price: SERVICE_PRICE,
      specialist_id: owner.user.id,
      specialist_ids: [owner.user.id],
      is_active: true,
    },
  }))

  // Leave today out so a run started in the evening still gets a stable slot tomorrow.
  const today = pragueWeekday()
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    if (weekday === today) continue
    await json(await request.post(`${apiUrl}/schedules/work`, {
      headers: owner.headers,
      data: { specialist_id: owner.user.id, weekday, start_time: '08:00', end_time: '20:00' },
    }))
  }

  let settings = await json<PublicSettings>(await request.get(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers,
  }))
  if (enabled) {
    settings = await json<PublicSettings>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
      headers: owner.headers,
      data: { is_enabled: true },
    }))
  }
  return { owner, serviceId: service.id, settings, name }
}

async function setBookingEnabled(request: APIRequestContext, owner: Session, enabled: boolean) {
  return json<PublicSettings>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers,
    data: { is_enabled: enabled },
  }))
}

async function firstPublicSlot(request: APIRequestContext, salon: BookableSalon): Promise<PublicSlot> {
  const slots = await json<PublicSlots>(await request.get(`${apiUrl}/public/booking/${salon.settings.slug}/slots`, {
    params: {
      service_id: salon.serviceId,
      date_from: pragueDate(0),
      date_to: pragueDate(13),
    },
  }))
  expect(slots.timezone).toBe(TIMEZONE)
  const day = slots.days.find((entry) => entry.slots.length > 0)
  if (!day) throw new Error('The bookable salon has no free slots')
  return day.slots[0]
}

function bookingPayload(slot: PublicSlot, salon: BookableSalon, name: string): PublicBookingPayload {
  return {
    service_id: salon.serviceId,
    staff_id: slot.staff_id,
    start: slot.start,
    full_name: name,
    email: `${unique('guest')}@example.com`,
    marketing_consent: false,
    processing_consent: true,
    client_request_id: unique('bk-request'),
  }
}

test('guest books online and the visit appears for the owner', async ({ page, request, browser }) => {
  const salon = await createBookableSalon(request)
  expect(salon.settings.is_enabled).toBe(false)
  expect(salon.settings.has_bookable_service).toBe(true)
  expect(salon.settings.has_schedule).toBe(true)

  await openAs(page, salon.owner, '/app/business')
  const card = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Online booking link' }) })
  await expect(card.getByText('Ready to accept bookings')).toBeVisible()
  const linkInput = card.getByLabel('Public link')
  await expect(linkInput).toBeVisible()
  expect(await linkInput.inputValue()).toContain(`/booking/${salon.settings.slug}`)

  await expect(card.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  const toggled = page.waitForResponse(
    (response) => response.url().endsWith('/businesses/me/public-booking') && response.request().method() === 'PUT',
  )
  await card.getByRole('switch').click()
  expect((await toggled).status()).toBe(200)
  await expect(card.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  await expect(card.getByText('Online booking is on')).toBeVisible()

  const guestName = unique('Greta Guest')
  const guestContext = await browser.newContext({
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:3170',
    locale: 'en-GB',
    timezoneId: TIMEZONE,
    viewport: { width: 1280, height: 800 },
  })
  const guest = await guestContext.newPage()
  try {
    await guest.goto(`/booking/${salon.settings.slug}`)
    await expect(guest.getByRole('heading', { name: salon.name })).toBeVisible()
    await expect(guest.getByText('No account needed')).toBeVisible()
    // this salon left no address, phone or email, so there is no empty Contacts block
    await expect(guest.getByRole('heading', { name: 'Contacts' })).toHaveCount(0)

    await guest.getByRole('button', { name: new RegExp(SERVICE_NAME) }).click()
    await guest.getByRole('button', { name: 'Continue' }).click()
    await guest.getByRole('button', { name: 'Any available master' }).click()
    await expect(guest.getByRole('heading', { name: 'Choose a date and time' })).toBeVisible()
    await expect(guest.getByText(`Salon time zone: ${TIMEZONE}`)).toBeVisible()
    const slot = guest.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
    await expect(slot).toBeVisible()
    await slot.click()

    await expect(guest.getByRole('heading', { name: 'Your details' })).toBeVisible()
    await guest.locator('input[name="full_name"]').fill(guestName)
    await guest.locator('input[name="email"]').fill(`${unique('greta')}@example.com`)
    await guest.getByRole('checkbox', { name: /I agree that the salon may process/ }).check()
    await guest.getByRole('button', { name: 'Continue' }).click()

    await expect(guest.getByRole('heading', { name: 'Check your booking' })).toBeVisible()
    await expect(guest.getByText(guestName)).toBeVisible()
    await expect(guest.getByRole('heading', { name: 'Check your booking' }).locator('xpath=..')).toContainText(SERVICE_NAME)

    const posted = guest.waitForResponse(
      (response) => response.url().endsWith('/bookings') && response.request().method() === 'POST',
    )
    await guest.getByRole('button', { name: 'Confirm booking' }).click()
    const response = await posted
    expect(response.status()).toBe(200)
    const booking = (await response.json()) as PublicBooking
    expect(booking.service_name).toBe(SERVICE_NAME)
    expect(booking.staff_name).toBe('Bohdan Booker')
    expect(booking.timezone).toBe(TIMEZONE)
    expect(booking.status).toBe('planned')

    await expect(guest.getByRole('heading', { name: 'You are booked' })).toBeVisible()
    await expect(guest.getByText(`#${booking.id}`)).toBeVisible()
    await expect(guest.getByText(SERVICE_NAME)).toBeVisible()
    await expect(guest.getByRole('link', { name: 'Manage this booking' })).toHaveAttribute(
      'href',
      /^\/manage#token=.+/,
    )
  } finally {
    await guestContext.close()
  }

  await page.goto('/app/visits')
  await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()
  const row = page.getByRole('row').filter({ hasText: guestName })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText(SERVICE_NAME)
})

test('parallel guest requests create one visit and a retry replays it', async ({ request }) => {
  const salon = await createBookableSalon(request, { enabled: true })
  const slot = await firstPublicSlot(request, salon)
  const payloadA = bookingPayload(slot, salon, 'Ada Race')
  const payloadB = bookingPayload(slot, salon, 'Boris Race')
  const url = `${apiUrl}/public/booking/${salon.settings.slug}/bookings`

  const [first, second] = await Promise.all([
    request.post(url, { data: payloadA }),
    request.post(url, { data: payloadB }),
  ])
  const attempts = [
    { response: first, payload: payloadA },
    { response: second, payload: payloadB },
  ]
  const accepted = attempts.filter((attempt) => attempt.response.status() === 200)
  const refused = attempts.filter((attempt) => attempt.response.status() === 409)
  expect(accepted).toHaveLength(1)
  expect(refused).toHaveLength(1)
  const winner = accepted[0]
  if (!winner) throw new Error('No parallel request was accepted')
  const booking = (await winner.response.json()) as PublicBooking
  expect(booking.id).toBeGreaterThan(0)

  const replay = await request.post(url, { data: winner.payload })
  expect(replay.status()).toBe(200)
  expect(((await replay.json()) as PublicBooking).id).toBe(booking.id)

  const changed = await request.post(url, {
    data: { ...winner.payload, full_name: 'Changed After Retry' },
  })
  expect(changed.status()).toBe(409)

  const visits = await json<{ items: { id: number }[] }>(await request.get(`${apiUrl}/visits/?per_page=100`, {
    headers: salon.owner.headers,
  }))
  expect(visits.items).toHaveLength(1)
  expect(visits.items[0].id).toBe(booking.id)
})

test('a disabled booking link is unavailable and refuses submissions', async ({ page, request }) => {
  const salon = await createBookableSalon(request)
  expect(salon.settings.is_enabled).toBe(false)

  await page.goto(`/booking/${salon.settings.slug}`)
  await expect(page.getByRole('heading', { name: 'Booking link is not active' })).toBeVisible()

  const payload = bookingPayload(
    { start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), staff_id: salon.owner.user.id },
    salon,
    'Nora Closed',
  )
  const url = `${apiUrl}/public/booking/${salon.settings.slug}/bookings`
  expect((await request.post(url, { data: payload })).status()).toBe(404)

  const enabled = await setBookingEnabled(request, salon.owner, true)
  expect(enabled.is_enabled).toBe(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: salon.name })).toBeVisible()
  await expect(page.getByRole('button', { name: new RegExp(SERVICE_NAME) })).toBeVisible()

  const disabled = await setBookingEnabled(request, salon.owner, false)
  expect(disabled.is_enabled).toBe(false)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Booking link is not active' })).toBeVisible()
  const late = { ...payload, client_request_id: unique('bk-late') }
  expect((await request.post(url, { data: late })).status()).toBe(404)
})
