import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test'
import { apiUrl, newOwner, openAs, unique, type Session } from './helpers'

const TIMEZONE = 'Europe/Prague'
const DAY_MS = 24 * 60 * 60 * 1000
const SERVICE_NAME = 'Waitlist Cut'
const SERVICE_PRICE = 40

interface WaitlistSalon {
  owner: Session
  businessName: string
  serviceId: number
  staffId: number
  slug: string
}

interface WaitlistMail {
  recipient: string
  subject: string
  text: string
}

interface Slot {
  date: string
  start: string
  end: string
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

function tomorrowSlot(): Slot {
  const date = pragueDate(1)
  // noon UTC is early afternoon in Prague all year and inside the fixture's 08:00-20:00 day
  const start = new Date(`${date}T12:00:00Z`)
  return {
    date,
    start: start.toISOString(),
    end: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
  }
}

async function createSalon(request: APIRequestContext): Promise<WaitlistSalon> {
  const owner = await newOwner(request, { fullName: 'Wanda Waitlist' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')

  const businessName = unique('Waitlist Salon')
  await json(await request.put(`${apiUrl}/businesses/${businessId}`, {
    headers: owner.headers,
    data: {
      name: businessName,
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

  // tomorrow is never today's weekday, so its schedule below always exists
  const today = pragueWeekday()
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    if (weekday === today) continue
    await json(await request.post(`${apiUrl}/schedules/work`, {
      headers: owner.headers,
      data: { specialist_id: owner.user.id, weekday, start_time: '08:00', end_time: '20:00' },
    }))
  }

  const settings = await json<{ slug: string }>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers,
    data: { is_enabled: true },
  }))
  if (!settings.slug) throw new Error('The public booking settings have no slug')

  // capture transport stays active; the synthetic SMTP pair only makes the email channel selectable
  await json(await request.put(`${apiUrl}/businesses/me/notification-settings`, {
    headers: owner.headers,
    data: { channel: 'email', is_enabled: true },
  }))

  return { owner, businessName, serviceId: service.id, staffId: owner.user.id, slug: settings.slug }
}

async function joinWaitlist(
  request: APIRequestContext,
  salon: WaitlistSalon,
  slot: Slot,
  fullName: string,
  email: string,
) {
  return json(await request.post(`${apiUrl}/public/waitlist/${salon.slug}/join`, {
    data: {
      service_id: salon.serviceId,
      staff_id: salon.staffId,
      preferred_date_from: slot.date,
      preferred_date_to: slot.date,
      time_preference: 'any',
      full_name: fullName,
      email,
      processing_consent: true,
      marketing_consent: false,
    },
  }))
}

async function createVisit(request: APIRequestContext, salon: WaitlistSalon, slot: Slot) {
  const client = await json<{ id: number }>(await request.post(`${apiUrl}/clients/`, {
    headers: salon.owner.headers,
    data: { full_name: 'Slot Holder', contact_email: `${unique('slot')}@example.com` },
  }))
  return json<{ id: number }>(await request.post(`${apiUrl}/visits/`, {
    headers: salon.owner.headers,
    data: {
      client_id: client.id,
      specialist_id: salon.staffId,
      service_id: salon.serviceId,
      date_start: slot.start,
      date_end: slot.end,
      price: SERVICE_PRICE,
      payment_method: 'cash',
    },
  }))
}

function runNotificationJob() {
  const python = process.env.API_PYTHON
  const apiDir = process.env.E2E_API_DIR
  if (!python || !apiDir) throw new Error('API_PYTHON and E2E_API_DIR are required for the capture mail test')
  execFileSync(python, ['scripts/run_jobs.py', 'reminders'], {
    cwd: apiDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function readOfferMail(recipient: string): WaitlistMail {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file) throw new Error('CAPTURE_MAIL_FILE is not set')
  const rows = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as WaitlistMail)
  const message = rows.find(
    (row) => row.recipient === recipient && /\/waitlist\/offer#token=/.test(row.text),
  )
  if (!message) throw new Error(`No waitlist offer email for ${recipient} in ${file}`)
  return message
}

function offerLink(message: WaitlistMail): string {
  const match = message.text.match(/https?:\/\/[^\s]+\/waitlist\/offer#token=[^\s]+/)
  if (!match) throw new Error('The waitlist email has no offer link')
  return match[0]
}

// the offer TTL is a wall-clock deadline, so the fixture moves it into the past the same
// way the worker would see it - through the throwaway database, never a running app
function expirePendingOffers(businessName: string) {
  const container = process.env.E2E_PG_CONTAINER
  const database = process.env.E2E_PG_DB
  if (!container || !database) {
    throw new Error('E2E_PG_CONTAINER and E2E_PG_DB are required for the TTL fixture')
  }
  const escaped = businessName.replace(/'/g, "''")
  execFileSync('docker', [
    'exec', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c',
    `UPDATE waitlist_offers SET expires_at = (now() AT TIME ZONE 'utc') - interval '1 minute' ` +
      `WHERE status = 'pending' AND business_id = (SELECT id FROM businesses WHERE name = '${escaped}')`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
}

test('a freed slot is offered by email and only the first confirmation books it', async ({ page, context, request }) => {
  const salon = await createSalon(request)
  const slot = tomorrowSlot()
  const guestA = { name: 'Alice Waitlist', email: `${unique('wait-a')}@example.com` }
  const guestB = { name: 'Boris Waitlist', email: `${unique('wait-b')}@example.com` }

  await joinWaitlist(request, salon, slot, guestA.name, guestA.email)
  await joinWaitlist(request, salon, slot, guestB.name, guestB.email)
  const visit = await createVisit(request, salon, slot)
  await json(await request.put(`${apiUrl}/visits/${visit.id}`, {
    headers: salon.owner.headers,
    data: { status: 'cancelled' },
  }))

  runNotificationJob()
  const linkA = offerLink(readOfferMail(guestA.email))
  const linkB = offerLink(readOfferMail(guestB.email))

  const staffPage = await context.newPage()
  await openAs(staffPage, salon.owner, '/app/waitlist')
  await expect(staffPage.getByText(guestA.email)).toBeVisible()
  await expect(staffPage.getByText(guestB.email)).toBeVisible()
  await expect(staffPage.getByText('Offer waiting').first()).toBeVisible()
  await staffPage.close()

  await page.goto(linkA)
  await expect(page.getByRole('heading', { name: salon.businessName })).toBeVisible()
  await expect(page.getByText(
    'This time is not reserved for you. It stays open to everyone until you accept the offer.',
  )).toBeVisible()
  await expect(page.getByText('Offer valid until')).toBeVisible()

  // both guests opened their offers while the time was still free
  const otherPage = await context.newPage()
  await otherPage.goto(linkB)
  await expect(otherPage.getByRole('button', { name: 'Book this time' })).toBeVisible()

  const accepted = page.waitForResponse(
    (response) => response.url().endsWith('/public/waitlist/offer/accept') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Book this time' }).click()
  expect((await accepted).status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'You are booked' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Manage this booking' })).toBeVisible()

  // the stale page still offers the button; the server refuses and the page shows the conflict
  const conflicted = otherPage.waitForResponse(
    (response) => response.url().endsWith('/public/waitlist/offer/accept') && response.request().method() === 'POST',
  )
  await otherPage.getByRole('button', { name: 'Book this time' }).click()
  expect((await conflicted).status()).toBe(409)
  await expect(otherPage.getByRole('heading', { name: 'Time is already taken' })).toBeVisible()
  await expect(otherPage.getByText('This offer can no longer be accepted. Ask the salon if you would like to join the waitlist again.')).toBeVisible()
  await expect(otherPage.getByRole('button', { name: 'Book this time' })).toHaveCount(0)
  await otherPage.close()
})

test('an offer that passed its TTL can no longer be booked', async ({ page, request }) => {
  const salon = await createSalon(request)
  const slot = tomorrowSlot()
  const guest = { name: 'Cyril Waitlist', email: `${unique('wait-c')}@example.com` }

  await joinWaitlist(request, salon, slot, guest.name, guest.email)
  const visit = await createVisit(request, salon, slot)
  await json(await request.put(`${apiUrl}/visits/${visit.id}`, {
    headers: salon.owner.headers,
    data: { status: 'cancelled' },
  }))

  runNotificationJob()
  const link = offerLink(readOfferMail(guest.email))
  expirePendingOffers(salon.businessName)

  await page.goto(link)
  await expect(page.getByRole('heading', { name: 'Offer expired' })).toBeVisible()
  await expect(page.getByText(
    'This offer can no longer be accepted. Ask the salon if you would like to join the waitlist again.',
  )).toBeVisible()
  await expect(page.getByRole('button', { name: 'Book this time' })).toHaveCount(0)
})
