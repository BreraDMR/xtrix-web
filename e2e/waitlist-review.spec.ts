import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

import { test, expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiUrl, newOwner, openAs, unique, type Session } from './helpers'

// WAIT-09 review: the whole guest path in every language/theme/width - no free time on the
// public page, join the waitlist through the form, the salon frees the time, the offer mail
// arrives and the guest books from it - plus the salon's own list. A second test checks the
// time comes back to the person who lost the race once the winner cancels.

type Language = 'en' | 'ru' | 'cz'

const TIMEZONE = 'Europe/Prague'
const SERVICE = 'Review Wait Cut'
const DAY_MS = 24 * 60 * 60 * 1000

interface Salon {
  owner: Session
  name: string
  slug: string
  serviceId: number
  slot: { start: string; end: string }
}

interface Mail {
  recipient: string
  text: string
}

async function ok<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

function pragueDate(offsetDays: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date(Date.now() + offsetDays * DAY_MS))
}

function pragueWeekday(offsetDays: number): number {
  const short = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TIMEZONE })
    .format(new Date(Date.now() + offsetDays * DAY_MS))
  return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[short] ?? 0
}

// One bookable slot in the whole horizon: tomorrow 12:00-13:00 UTC, and a visit sits on it.
async function fullSalon(request: APIRequestContext): Promise<Salon> {
  const owner = await newOwner(request, { fullName: 'Wendy Review' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')
  const name = unique('Wait Review Salon')
  await ok(await request.put(`${apiUrl}/businesses/${businessId}`, {
    headers: owner.headers,
    data: { name, currency: 'EUR', timezone: TIMEZONE, booking_horizon_days: 3, booking_lead_time_minutes: 0 },
  }))
  const service = await ok<{ id: number }>(await request.post(`${apiUrl}/services/`, {
    headers: owner.headers,
    data: { name: SERVICE, duration_minutes: 60, price: 30, specialist_id: owner.user.id },
  }))
  const day = pragueDate(1)
  const start = new Date(`${day}T12:00:00Z`)
  const startLocal = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' }).format(start)
  const endLocal = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })
    .format(new Date(start.getTime() + 60 * 60 * 1000))
  await ok(await request.post(`${apiUrl}/schedules/work`, {
    headers: owner.headers,
    data: { specialist_id: owner.user.id, weekday: pragueWeekday(1), start_time: startLocal, end_time: endLocal },
  }))
  const settings = await ok<{ slug: string }>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers, data: { is_enabled: true },
  }))
  await ok(await request.put(`${apiUrl}/businesses/me/notification-settings`, {
    headers: owner.headers, data: { channel: 'email', is_enabled: true },
  }))
  return {
    owner, name, slug: settings.slug, serviceId: service.id,
    slot: { start: start.toISOString(), end: new Date(start.getTime() + 60 * 60 * 1000).toISOString() },
  }
}

async function occupy(request: APIRequestContext, salon: Salon): Promise<number> {
  const client = await ok<{ id: number }>(await request.post(`${apiUrl}/clients/`, {
    headers: salon.owner.headers,
    data: { full_name: 'Slot Holder', contact_email: `${unique('holder')}@example.com` },
  }))
  return (await ok<{ id: number }>(await request.post(`${apiUrl}/visits/`, {
    headers: salon.owner.headers,
    data: {
      client_id: client.id, specialist_id: salon.owner.user.id, service_id: salon.serviceId,
      date_start: salon.slot.start, date_end: salon.slot.end, price: 30, payment_method: 'cash',
    },
  }))).id
}

async function cancelVisit(request: APIRequestContext, salon: Salon, visitId: number) {
  await ok(await request.put(`${apiUrl}/visits/${visitId}`, { headers: salon.owner.headers, data: { status: 'cancelled' } }))
}

function runNotificationJob() {
  const python = process.env.API_PYTHON
  const apiDir = process.env.E2E_API_DIR
  if (!python || !apiDir) throw new Error('API_PYTHON and E2E_API_DIR are required for the capture mail test')
  execFileSync(python, ['scripts/run_jobs.py', 'reminders'], { cwd: apiDir, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
}

// newest offer link for this guest; a second offer for the same person comes as a new mail
function offerLinks(recipient: string): string[] {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file) throw new Error('CAPTURE_MAIL_FILE is not set')
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map((line) => JSON.parse(line) as Mail)
    .filter((row) => row.recipient === recipient)
    .map((row) => row.text.match(/https?:\/\/[^\s]+\/waitlist\/offer#token=[^\s]+/)?.[0])
    .filter((link): link is string => Boolean(link))
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
}

const CASES: { language: Language; theme: 'light' | 'dark'; width: number }[] = [
  { language: 'en', theme: 'light', width: 1280 },
  { language: 'ru', theme: 'dark', width: 375 },
  { language: 'cz', theme: 'light', width: 375 },
  { language: 'cz', theme: 'dark', width: 1280 },
  { language: 'ru', theme: 'light', width: 1280 },
  { language: 'en', theme: 'dark', width: 375 },
]

for (const { language, theme, width } of CASES) {
  test(`guest waits, gets the freed time and books it (${language}, ${theme}, ${width})`, async ({ page, browser, request }, info) => {
    const t = (key: TranslationKey) => translations[key][language]
    const salon = await fullSalon(request)
    const visitId = await occupy(request, salon)
    const guest = { name: 'Vera Waiting', email: `${unique('vera')}@example.com` }

    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(([lang, mode]) => {
      localStorage.setItem('app_locale', lang)
      localStorage.setItem('theme', mode)
    }, [language, theme])

    await page.goto(`/booking/${salon.slug}`)
    await expect(page.getByRole('heading', { name: salon.name })).toBeVisible()
    await expect.poll(() => page.locator('html').evaluate((el) => el.classList.contains('dark'))).toBe(theme === 'dark')
    await page.getByRole('button', { name: new RegExp(SERVICE) }).click()
    await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
    await page.getByRole('button', { name: t('booking.anyMaster'), exact: true }).click()
    await expect(page.getByText(t('booking.noSlots'), { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /^\d{2}:\d{2}$/ })).toHaveCount(0)
    await page.getByRole('button', { name: t('booking.waitlist.cta'), exact: true }).click()

    // the form says plainly that this is not a booking, before anything is sent
    await expect(page.getByRole('heading', { name: t('booking.waitlist.title'), exact: true })).toBeVisible()
    await expect(page.getByText(t('booking.waitlist.notBooking'), { exact: true })).toBeVisible()
    await page.getByRole('textbox', { name: t('clientForm.fullName') }).fill(guest.name)
    await page.getByRole('textbox', { name: t('clients.email') }).fill(guest.email)
    await page.getByRole('button', { name: t('booking.waitlist.join'), exact: true }).click()
    await expect(page.getByText(t('booking.processingConsentRequired'), { exact: true })).toBeVisible()
    await page.getByRole('checkbox', { name: t('booking.waitlist.processingConsent') }).check()
    await noOverflow(page)
    await page.screenshot({ path: info.outputPath('form.png'), fullPage: true })
    await page.getByRole('button', { name: t('booking.waitlist.join'), exact: true }).click()
    await expect(page.getByRole('heading', { name: t('booking.waitlist.joinedTitle'), exact: true })).toBeVisible()
    await expect(page.getByText(t('booking.waitlist.notBooking'), { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: t('booking.waitlist.leave'), exact: true })).toBeVisible()
    await noOverflow(page)
    await page.screenshot({ path: info.outputPath('joined.png'), fullPage: true })

    // the salon frees the time; the offer goes out through the capture mail
    await cancelVisit(request, salon, visitId)
    runNotificationJob()
    const links = offerLinks(guest.email)
    expect(links).toHaveLength(1)

    // the salon signs in from its own browser, not from the guest's tab storage
    const staffContext = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: { width, height: 900 } })
    const staff = await staffContext.newPage()
    await openAs(staff, salon.owner, '/app/waitlist')
    const prefs = await request.put(`${apiUrl}/user-preferences/me`, { headers: salon.owner.headers, data: { theme, language } })
    expect(prefs.ok(), await prefs.text()).toBeTruthy()
    await staff.reload()
    await expect(staff.getByRole('heading', { name: t('waitlist.title'), exact: true })).toBeVisible()
    await expect(staff.getByText(guest.email)).toBeVisible()
    await expect(staff.getByText(t('waitlist.offer.pending'), { exact: true })).toBeVisible()
    await expect.poll(() => staff.locator('html').evaluate((el) => el.classList.contains('dark'))).toBe(theme === 'dark')
    await noOverflow(staff)
    await staff.screenshot({ path: info.outputPath('salon-list.png'), fullPage: true })

    await page.goto(links[0])
    await expect(page.getByRole('heading', { name: salon.name })).toBeVisible()
    await expect(page.getByText(t('waitlistOffer.notReserved'), { exact: true })).toBeVisible()
    await noOverflow(page)
    await page.screenshot({ path: info.outputPath('offer.png'), fullPage: true })
    const accepted = page.waitForResponse((r) => r.url().endsWith('/public/waitlist/offer/accept') && r.request().method() === 'POST')
    await page.getByRole('button', { name: t('waitlistOffer.accept'), exact: true }).click()
    expect((await accepted).status()).toBe(200)
    await expect(page.getByRole('heading', { name: t('waitlistOffer.acceptedTitle'), exact: true })).toBeVisible()
    await page.screenshot({ path: info.outputPath('booked.png'), fullPage: true })

    await staff.locator('label').filter({ has: staff.getByText(t('waitlist.filter.status'), { exact: true }) })
      .locator('select').selectOption('fulfilled')
    await expect(staff.getByText(guest.email)).toBeVisible()
    await expect(staff.getByText(t('waitlist.offer.accepted'), { exact: true })).toBeVisible()
    await staffContext.close()
  })
}

test('the person who lost the race gets the same time once the winner cancels', async ({ page, context, request }) => {
  const salon = await fullSalon(request)
  const visitId = await occupy(request, salon)
  const winner = `${unique('win')}@example.com`
  const loser = `${unique('lose')}@example.com`
  for (const [name, email] of [['Wanda Winner', winner], ['Larry Loser', loser]]) {
    await ok(await request.post(`${apiUrl}/public/waitlist/${salon.slug}/join`, {
      data: {
        service_id: salon.serviceId, staff_id: salon.owner.user.id, preferred_date_from: pragueDate(0),
        preferred_date_to: pragueDate(2), time_preference: 'any', full_name: name, email, processing_consent: true,
      },
    }))
  }
  await cancelVisit(request, salon, visitId)
  runNotificationJob()
  const [winnerLink] = offerLinks(winner)
  const [loserLink] = offerLinks(loser)

  await page.goto(winnerLink)
  await page.getByRole('button', { name: 'Book this time' }).click()
  await expect(page.getByRole('heading', { name: 'You are booked' })).toBeVisible()
  const lost = await context.newPage()
  await lost.goto(loserLink)
  await expect(lost.getByRole('button', { name: 'Book this time' })).toHaveCount(0)
  await lost.close()

  // the winner's visit goes away: the time is free again for the one still waiting
  const visits = await ok<{ items?: { id: number; status: string }[] } | { id: number; status: string }[]>(
    await request.get(`${apiUrl}/visits/?per_page=100`, { headers: salon.owner.headers }),
  )
  const rows = Array.isArray(visits) ? visits : visits.items ?? []
  const booked = rows.find((row) => row.status !== 'cancelled')
  if (!booked) throw new Error('The waitlist booking is not in the salon journal')
  await cancelVisit(request, salon, booked.id)
  runNotificationJob()
  const loserLinks = offerLinks(loser)
  expect(loserLinks).toHaveLength(2)

  await page.goto(loserLinks[1])
  await page.getByRole('button', { name: 'Book this time' }).click()
  await expect(page.getByRole('heading', { name: 'You are booked' })).toBeVisible()
})
