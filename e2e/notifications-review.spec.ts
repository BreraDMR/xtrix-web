import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { test, expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiUrl, newOwner, openAs, unique, type Session } from './helpers'

// MSG-12 review: the owner turns notifications on in the UI, a guest books, the real job
// renders the mail into the capture sink, and the delivery log tells the owner what happened.
// Nothing leaves the machine: the e2e stack runs the capture transport.

const TIMEZONE = 'Europe/Prague'
const SUBJECT = { en: 'Booking received', ru: 'Запись создана', cz: 'Rezervace vytvořena' } as const

type Language = 'en' | 'ru' | 'cz'

interface Salon {
  owner: Session
  name: string
  serviceId: number
  slug: string
}

interface CapturedMail {
  recipient: string
  subject: string
  text: string
  html: string | null
}

async function json<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

function pragueDate(offsetDays: number): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000))
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

async function createSalon(request: APIRequestContext): Promise<Salon> {
  const owner = await newOwner(request, { fullName: 'Nora Notify' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')
  const name = unique('MSG Salon')
  await json(await request.put(`${apiUrl}/businesses/${businessId}`, {
    headers: owner.headers,
    data: { name, currency: 'EUR', timezone: TIMEZONE, booking_horizon_days: 14, booking_lead_time_minutes: 0 },
  }))
  const service = await json<{ id: number }>(await request.post(`${apiUrl}/services/`, {
    headers: owner.headers,
    data: {
      name: 'Notify Cut', duration_minutes: 30, price: 40,
      specialist_id: owner.user.id, specialist_ids: [owner.user.id], is_active: true,
    },
  }))
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    await json(await request.post(`${apiUrl}/schedules/work`, {
      headers: owner.headers,
      data: { specialist_id: owner.user.id, weekday, start_time: '08:00', end_time: '20:00' },
    }))
  }
  const settings = await json<{ slug: string }>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers, data: { is_enabled: true },
  }))
  return { owner, name, serviceId: service.id, slug: settings.slug }
}

async function bookAsGuest(request: APIRequestContext, salon: Salon, language: Language, email: string) {
  const slots = await json<{ days: { slots: { start: string; staff_id: number }[] }[] }>(await request.get(
    `${apiUrl}/public/booking/${salon.slug}/slots`,
    { params: { service_id: salon.serviceId, date_from: pragueDate(2), date_to: pragueDate(9) } },
  ))
  const slot = slots.days.find((day) => day.slots.length > 0)?.slots[0]
  if (!slot) throw new Error('The salon has no free slot')
  await json(await request.post(`${apiUrl}/public/booking/${salon.slug}/bookings`, {
    headers: { 'Accept-Language': language },
    data: {
      service_id: salon.serviceId, staff_id: slot.staff_id, start: slot.start,
      full_name: 'Gita Guest', email, marketing_consent: false, processing_consent: true,
      client_request_id: unique('msg-request'),
    },
  }))
}

function runNotificationJob() {
  const python = process.env.API_PYTHON
  const apiDir = process.env.E2E_API_DIR
  if (!python || !apiDir) throw new Error('API_PYTHON and E2E_API_DIR are required for the capture mail test')
  // run from a scratch dir so the API checkout's .env and logs/ stay untouched
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'xtrix-e2e-jobs-'))
  try {
    execFileSync(python, [path.join(apiDir, 'scripts', 'run_jobs.py'), 'reminders'], {
      cwd, env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
    })
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
}

function capturedFor(recipient: string): CapturedMail[] {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file) throw new Error('CAPTURE_MAIL_FILE is not set')
  if (!fs.existsSync(file)) return []
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map((line) => JSON.parse(line) as CapturedMail)
    .filter((row) => row.recipient === recipient)
}

// the provider refusing a message can't be staged through the capture sink, so the fixture
// marks the captured row failed in the throwaway database
function markFailed(recipient: string) {
  const container = process.env.E2E_PG_CONTAINER
  const database = process.env.E2E_PG_DB
  if (!container || !database) throw new Error('E2E_PG_CONTAINER and E2E_PG_DB are required')
  execFileSync('docker', [
    'exec', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c',
    `UPDATE notification_outbox SET status = 'failed', last_error = 'smtp_error:SMTPServerDisconnected' ` +
      `WHERE recipient = '${recipient.replace(/'/g, "''")}' AND kind = 'booking_created'`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
}

async function noSideScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
}

const CASES: { language: Language; theme: 'light' | 'dark'; width: number }[] = [
  { language: 'en', theme: 'light', width: 1280 },
  { language: 'ru', theme: 'dark', width: 375 },
  { language: 'cz', theme: 'dark', width: 1280 },
  { language: 'en', theme: 'dark', width: 375 },
]

for (const { language, theme, width } of CASES) {
  test(`owner sees captured, failed and retried deliveries (${language}, ${theme}, ${width})`, async ({ page, request }) => {
    const t = (key: TranslationKey) => translations[key][language]
    await page.setViewportSize({ width, height: 900 })
    const salon = await createSalon(request)
    await openAs(page, salon.owner, '/app/notifications')
    await json(await request.put(`${apiUrl}/user-preferences/me`, {
      headers: salon.owner.headers, data: { theme, language },
    }))
    await page.reload()
    await expect.poll(() => page.locator('html').evaluate((el) => el.classList.contains('dark'))).toBe(theme === 'dark')
    await expect(page.getByRole('heading', { name: t('notifications.title'), level: 1 })).toBeVisible()
    await expect(page.getByText(t('notifications.providerReady'))).toBeVisible()

    // off by default; turning it on goes through the owner's own save
    const toggle = page.getByRole('switch', { name: t('notifications.enabled') })
    await expect(toggle).toHaveAttribute('aria-checked', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('button', { name: t('common.save') }).click()
    await expect(page.getByText(t('notifications.saved'))).toBeVisible()

    // the test button never reaches a mailbox and says so
    await page.getByRole('button', { name: t('notifications.testRun') }).click()
    await expect(page.getByText(t('notifications.testCaptured'))).toBeVisible()
    await noSideScroll(page)

    const email = `${unique('msg-guest')}@example.com`
    await bookAsGuest(request, salon, language, email)
    runNotificationJob()
    const mails = capturedFor(email)
    expect(mails.map((mail) => mail.subject)).toEqual([SUBJECT[language]])
    expect(mails[0].text).toMatch(/\/manage#token=\S+/)
    expect(mails[0].text).toContain(salon.name)

    // captured is shown as not delivered and is not offered for retry
    await page.reload()
    const log = page.getByRole('region', { name: t('notifications.delivery.title') })
    const created = log.getByRole('listitem').filter({ hasText: t('notifications.delivery.kind.created') })
    await expect(created).toHaveCount(1)
    await expect(created).toContainText(t('notifications.delivery.status.captured'))
    await expect(created).toContainText(`m***@example.com`)
    await expect(created.getByRole('button', { name: t('notifications.delivery.retry') })).toHaveCount(0)
    await expect(log).not.toContainText(email)
    await noSideScroll(page)

    // a refused delivery shows its error and can be queued again exactly once
    markFailed(email)
    await page.reload()
    await expect(created).toContainText(t('notifications.delivery.status.failed'))
    await expect(created).toContainText('smtp_error:SMTPServerDisconnected')
    await created.getByRole('button', { name: t('notifications.delivery.retry') }).click()
    await expect(log.getByText(t('notifications.delivery.retryQueued'))).toBeVisible()
    await expect(created).toContainText(t('notifications.delivery.status.pending'))
    await expect(created.getByRole('button', { name: t('notifications.delivery.retry') })).toHaveCount(0)
    await noSideScroll(page)
    await page.screenshot({ path: test.info().outputPath(`notifications-${language}-${theme}-${width}.png`), fullPage: true })
  })
}
