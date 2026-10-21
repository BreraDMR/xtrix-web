import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { test, expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'
import { apiUrl, newOwner, unique, type Session } from './helpers'

const TIMEZONE = 'Europe/Prague'
const DAY_MS = 24 * 60 * 60 * 1000

interface PortalSalon {
  owner: Session
  businessName: string
  clientId: number
  clientName: string
  email: string
  slug: string
  serviceId: number
  visitId: number
  pastVisitId: number
}

interface PortalMail {
  recipient: string
  subject: string
  text: string
}

async function json<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

async function createPortalSalon(
  request: APIRequestContext,
  name: string,
  email: string,
  clientName: string,
): Promise<PortalSalon> {
  const owner = await newOwner(request, { fullName: `${name} Owner` })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')

  const businessName = `${name} Salon`
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
      name: `${name} Service`,
      duration_minutes: 30,
      price: 40,
      specialist_id: owner.user.id,
      specialist_ids: [owner.user.id],
      is_active: true,
    },
  }))

  const client = await json<{ id: number }>(await request.post(`${apiUrl}/clients/`, {
    headers: owner.headers,
    data: { full_name: clientName, contact_email: email, language: 'en' },
  }))

  const future = new Date(Date.now() + 3 * DAY_MS)
  const past = new Date(Date.now() - 5 * DAY_MS)
  const makeVisit = async (start: Date, note: string) =>
    json<{ id: number }>(await request.post(`${apiUrl}/visits/`, {
      headers: owner.headers,
      data: {
        client_id: client.id,
        specialist_id: owner.user.id,
        service_id: service.id,
        date_start: start.toISOString(),
        date_end: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
        price: 40,
        note,
        payment_method: 'cash',
      },
    }))
  const upcoming = await makeVisit(future, 'staff only note')
  const done = await makeVisit(past, 'past staff note')

  const settings = await json<{ slug: string }>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers,
    data: { is_enabled: true },
  }))

  return {
    owner,
    businessName,
    clientId: client.id,
    clientName,
    email,
    slug: settings.slug,
    serviceId: service.id,
    visitId: upcoming.id,
    pastVisitId: done.id,
  }
}

function runNotificationJob() {
  const python = process.env.API_PYTHON
  const apiDir = process.env.E2E_API_DIR
  if (!python || !apiDir) throw new Error('API_PYTHON and E2E_API_DIR are required for the capture mail test')
  // Same as the API itself: run from a scratch dir so the checkout's .env and logs/ stay untouched.
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'xtrix-e2e-jobs-'))
  try {
    execFileSync(python, [path.join(apiDir, 'scripts', 'run_jobs.py'), 'reminders'], {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
}

function readPortalMail(recipient: string): PortalMail {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file) throw new Error('CAPTURE_MAIL_FILE is not set')
  const rows = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as PortalMail)
  const message = rows.find(
    (row) => row.recipient === recipient && row.subject === 'Your Xtrix client area sign-in',
  )
  if (!message) throw new Error(`No client portal email for ${recipient} in ${file}`)
  return message
}

function portalLink(message: PortalMail): string {
  const match = message.text.match(/https?:\/\/[^\s]+\/client\/portal#token=[^\s]+/)
  if (!match) throw new Error('The client portal email has no sign-in link')
  return match[0]
}

async function requestPortalLink(page: Page, salon: PortalSalon) {
  await page.goto(`/client/portal?salon=${salon.slug}`)
  await page.getByLabel('Email').fill(salon.email)
  const requested = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/public/client-portal/${salon.slug}/request`) &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click()
  expect((await requested).status()).toBe(202)
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
}

async function openPortalFromMail(page: Page, salon: PortalSalon) {
  runNotificationJob()
  await page.goto(portalLink(readPortalMail(salon.email)))
  await expect(page.getByRole('heading', { name: salon.clientName })).toBeVisible()
  await expect(page).toHaveURL(/\/client$/)
}

async function expectPortalLanguage(page: Page, current: string, target: string, expected: string) {
  // The trigger reads "EN ▼", the dropdown entries are bare codes; the trigger comes first.
  await page.getByRole('button', { name: new RegExp(`^${current}`) }).first().click()
  await page.getByRole('button', { name: new RegExp(`^${target}$`) }).click()
  await expect(page.getByText(expected).first()).toBeVisible()
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test('two salons stay isolated, repeat booking reuses the public page and logout forgets the client', async ({ page, request }) => {
  const alpha = await createPortalSalon(
    request,
    'Alpha',
    `${unique('alpha.guest')}@example.com`,
    'Alpha Guest',
  )
  const beta = await createPortalSalon(
    request,
    'Beta',
    `${unique('beta.guest')}@example.com`,
    'Beta Guest',
  )

  await requestPortalLink(page, alpha)
  await openPortalFromMail(page, alpha)

  await expect(page.getByText('Alpha Service').first()).toBeVisible()
  await expect(page.getByText('Alpha Salon')).toBeVisible()
  await expect(page.getByText('Beta Service')).toHaveCount(0)
  await expect(page.getByText('Beta Guest')).toHaveCount(0)
  await expect(page.getByText('staff only note')).toHaveCount(0)
  await expect(page.getByText('My questionnaires')).toBeVisible()
  await expect(page.getByText('No submitted questionnaires.')).toBeVisible()

  await page.getByRole('link', { name: 'Book again' }).first().click()
  await expect(page).toHaveURL(new RegExp(`/booking/${alpha.slug}\\?service=${alpha.serviceId}$`))
  await expect(page.getByRole('heading', { name: 'Choose a master' })).toBeVisible()
  await expect(page.getByText('Alpha Service').first()).toBeVisible()

  await page.goto('/client')
  await expect(page.getByRole('heading', { name: 'Alpha Guest' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/client\/portal$/)
  await expect(page.getByRole('heading', { name: 'Sign in to your client area' })).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('client_portal_token'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('client_portal_token'))).toBeNull()

  await page.goto('/client')
  await expect(page.getByRole('heading', { name: 'Session ended' })).toBeVisible()
  await expect(page.getByText('Alpha Guest')).toHaveCount(0)
  await expect(page.getByText('Alpha Service')).toHaveCount(0)

  await requestPortalLink(page, beta)
  await openPortalFromMail(page, beta)
  await expect(page.getByText('Beta Service').first()).toBeVisible()
  await expect(page.getByText('Beta Salon')).toBeVisible()
  await expect(page.getByText('Alpha Service')).toHaveCount(0)
  await expect(page.getByText('Alpha Guest')).toHaveCount(0)
})

test('legacy QR history stays hidden until the PIN is accepted and keeps its layout', async ({ page, request }) => {
  const salon = await createPortalSalon(
    request,
    'Legacy',
    `${unique('legacy.guest')}@example.com`,
    'Legacy Guest',
  )
  const qr = await json<{ qr_code_data: string; access_password: string }>(
    await request.post(`${apiUrl}/clients/${salon.clientId}/qr-code/generate`, {
      headers: salon.owner.headers,
      data: {},
    }),
  )
  const wrongPin = qr.access_password === '9999' ? '0000' : '9999'

  await page.goto(`/client/history?qr=${encodeURIComponent(qr.qr_code_data)}`)
  await page.getByLabel('PIN').fill(wrongPin)
  await page.getByRole('button', { name: 'Show history' }).click()
  await expect(page.getByRole('alert')).toContainText('QR code or PIN is invalid')
  await expect(page.getByText('Legacy Guest')).toHaveCount(0)
  await expect(page.getByText('Legacy Service')).toHaveCount(0)

  await page.getByLabel('PIN').fill(qr.access_password)
  await page.getByRole('button', { name: 'Show history' }).click()
  await expect(page.getByText('Legacy Guest')).toBeVisible()
  await expect(page.getByText('Legacy Service').first()).toBeVisible()
  await expect(page.getByText('staff only note')).toHaveCount(0)

  await expectPortalLanguage(page, 'EN', 'CZ', 'Historie návštěv')
  await expectPortalLanguage(page, 'CZ', 'RU', 'История визитов')
  await expectPortalLanguage(page, 'RU', 'EN', 'Visit history')

  await page.evaluate(() => localStorage.setItem('theme', 'dark'))
  await page.reload()
  await page.getByLabel('PIN').fill(qr.access_password)
  await page.getByRole('button', { name: 'Show history' }).click()
  await expect(page.getByText('Legacy Guest')).toBeVisible()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.setViewportSize({ width: 375, height: 800 })
  await expect(page.getByText('Legacy Guest')).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test('the client portal and its sign-in stay readable in three languages, both themes and on mobile', async ({ page, request }) => {
  const salon = await createPortalSalon(
    request,
    'Lang',
    `${unique('lang.guest')}@example.com`,
    'Lang Guest',
  )

  await requestPortalLink(page, salon)
  await expectPortalLanguage(page, 'EN', 'RU', 'Вход в кабинет клиента')
  await expectPortalLanguage(page, 'RU', 'CZ', 'Přihlášení do klientského portálu')
  await expectPortalLanguage(page, 'CZ', 'EN', 'Sign in to your client area')
  await openPortalFromMail(page, salon)
  await expect(page.getByText('Lang Service').first()).toBeVisible()

  await expectPortalLanguage(page, 'EN', 'RU', 'Предстоящие визиты')
  await expectPortalLanguage(page, 'RU', 'CZ', 'Nadcházející návštěvy')
  await expectPortalLanguage(page, 'CZ', 'EN', 'Upcoming visits')

  await page.evaluate(() => localStorage.setItem('theme', 'dark'))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Lang Guest' })).toBeVisible()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.setViewportSize({ width: 375, height: 800 })
  await expect(page.getByRole('heading', { name: 'Lang Guest' })).toBeVisible()
  await expectNoHorizontalScroll(page)

  await page.evaluate(() => localStorage.setItem('theme', 'light'))
  await page.reload()
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.getByRole('heading', { name: 'Lang Guest' })).toBeVisible()
  await expectNoHorizontalScroll(page)
})
