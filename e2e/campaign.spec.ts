import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

import { test, expect, type APIRequestContext, type APIResponse, type Page } from '@playwright/test'
import { apiUrl, newOwner, openAs, unique, type Session } from './helpers'

const TIMEZONE = 'Europe/Prague'
const DAY_MS = 24 * 60 * 60 * 1000
const SERVICE_NAME = 'Winback Cut'
const SERVICE_PRICE = 40
const INACTIVE_DAYS = 60

interface CampaignSalon {
  owner: Session
  businessName: string
  serviceId: number
  staffId: number
  slug: string
}

interface Guest {
  name: string
  email: string
}

interface ClientRow {
  id: number
  contact_email: string | null
}

interface CampaignRow {
  id: number
  name: string
  status: string
  recipient_count: number
  queued_count: number
  audience_hash: string | null
}

interface CampaignStats {
  status: string
  audience: number
  queued: number
  captured: number
  cancelled: number
  unsubscribed: number
}

interface CapturedMail {
  recipient: string
  subject: string
  text: string
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

async function createSalon(request: APIRequestContext): Promise<CampaignSalon> {
  const owner = await newOwner(request, { fullName: 'Cora Campaign' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')

  const businessName = unique('Campaign Salon')
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

  // capture transport never dials out; the synthetic SMTP pair only makes email selectable
  await json(await request.put(`${apiUrl}/businesses/me/notification-settings`, {
    headers: owner.headers,
    data: { channel: 'email', is_enabled: true },
  }))

  return { owner, businessName, serviceId: service.id, staffId: owner.user.id, slug: settings.slug }
}

// the guest gives explicit marketing consent in the same public booking that creates the client
async function bookGuest(request: APIRequestContext, salon: CampaignSalon, utcHour: number, guest: Guest) {
  const date = pragueDate(1)
  const start = new Date(`${date}T${String(utcHour).padStart(2, '0')}:00:00Z`)
  return json(await request.post(`${apiUrl}/public/booking/${salon.slug}/bookings`, {
    data: {
      service_id: salon.serviceId,
      staff_id: salon.staffId,
      start: start.toISOString(),
      full_name: guest.name,
      email: guest.email,
      processing_consent: true,
      marketing_consent: true,
      client_request_id: unique('booking'),
    },
  }))
}

// the segment looks at the relation age, so the fixture moves it into the past in the
// throwaway database instead of waiting two months
function ageClientRelations(businessName: string) {
  const container = process.env.E2E_PG_CONTAINER
  const database = process.env.E2E_PG_DB
  if (!container || !database) {
    throw new Error('E2E_PG_CONTAINER and E2E_PG_DB are required for the segment fixture')
  }
  const escaped = businessName.replace(/'/g, "''")
  execFileSync('docker', [
    'exec', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c',
    `UPDATE client_business_relations SET created_at = (now() AT TIME ZONE 'utc') - interval '200 days' ` +
      `WHERE business_id = (SELECT id FROM businesses WHERE name = '${escaped}')`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
}

async function findClient(request: APIRequestContext, owner: Session, email: string): Promise<ClientRow> {
  const page = await json<{ items: ClientRow[] }>(await request.get(
    `${apiUrl}/clients/?per_page=100`,
    { headers: owner.headers },
  ))
  const client = page.items.find((row) => row.contact_email === email)
  if (!client) throw new Error(`No client with ${email}`)
  return client
}

async function createDraftThroughUi(page: Page, data: { name: string; subject: string; body: string }) {
  await page.getByRole('button', { name: 'New campaign' }).click()
  const form = page.getByRole('dialog')
  await form.getByLabel('Campaign name').fill(data.name)
  await form.getByLabel('Email subject').fill(data.subject)
  await form.getByLabel('Message text').fill(data.body)
  await form.getByLabel('No visits for').fill(String(INACTIVE_DAYS))

  const created = page.waitForResponse(
    (response) => response.url().endsWith('/businesses/me/campaigns') && response.request().method() === 'POST',
  )
  await form.getByRole('button', { name: 'Save draft' }).click()
  const response = await created
  expect(response.status()).toBe(201)
  return (await response.json()) as CampaignRow
}

function runCampaignJob() {
  const python = process.env.API_PYTHON
  const apiDir = process.env.E2E_API_DIR
  if (!python || !apiDir) throw new Error('API_PYTHON and E2E_API_DIR are required for the capture mail test')
  execFileSync(python, ['scripts/run_jobs.py', 'campaigns'], {
    cwd: apiDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function capturedMail(): CapturedMail[] {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file || !fs.existsSync(file)) return []
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CapturedMail)
}

function unsubscribeLink(mail: CapturedMail): string {
  const match = mail.text.match(/https?:\/\/[^\s]+\/unsubscribe#token=[^\s]+/)
  if (!match) throw new Error('The campaign email has no unsubscribe link')
  return match[0]
}

test('a confirmed campaign reaches only consented clients and revocation wins', async ({ page, request }) => {
  test.slow()
  const salon = await createSalon(request)
  const keep: Guest = { name: 'Keeper Guest', email: `${unique('keeper')}@example.com` }
  const leave: Guest = { name: 'Leaver Guest', email: `${unique('leaver')}@example.com` }
  await bookGuest(request, salon, 12, keep)
  await bookGuest(request, salon, 13, leave)
  ageClientRelations(salon.businessName)

  const keepClient = await findClient(request, salon.owner, keep.email)
  const leaveClient = await findClient(request, salon.owner, leave.email)
  const consent = await json<{ status: string; source: string }>(await request.get(
    `${apiUrl}/businesses/me/clients/${keepClient.id}/marketing-consent`,
    { headers: salon.owner.headers },
  ))
  expect(consent.status).toBe('subscribed')
  expect(consent.source).toBe('public_booking')

  const name = unique('Winback')
  await openAs(page, salon.owner, '/app/campaigns')
  await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible()
  const campaign = await createDraftThroughUi(page, {
    name,
    subject: 'We miss you, {name}',
    body: '{name}, it has been a while. Book with {business} again.',
  })

  await expect(page.getByText('Will receive: 2').first()).toBeVisible()
  await expect(page.getByText('k***@example.com')).toBeVisible()
  await expect(page.getByText('l***@example.com')).toBeVisible()
  await expect(page.getByText('Live audience. It is recalculated until you confirm the campaign.')).toBeVisible()

  await page.getByRole('button', { name: 'Confirm audience and text' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click()
  const titleBlock = page.locator('h2', { hasText: name }).locator('..')
  await expect(titleBlock.getByText('Confirmed', { exact: true })).toBeVisible()

  // confirming again with an unchanged segment keeps the same frozen audience
  const frozen = await json<CampaignRow>(await request.get(
    `${apiUrl}/businesses/me/campaigns/${campaign.id}`,
    { headers: salon.owner.headers },
  ))
  const repeated = await json<CampaignRow>(await request.post(
    `${apiUrl}/businesses/me/campaigns/${campaign.id}/confirm`,
    { headers: salon.owner.headers },
  ))
  expect(repeated.recipient_count).toBe(2)
  expect(repeated.audience_hash).toBe(frozen.audience_hash)

  const revoked = await json<{ status: string }>(await request.post(
    `${apiUrl}/businesses/me/clients/${leaveClient.id}/marketing-consent/revoke`,
    { headers: salon.owner.headers },
  ))
  expect(revoked.status).toBe('unsubscribed')

  await page.reload()
  await expect(page.getByText('Audience frozen at confirmation.')).toBeVisible()
  await expect(page.getByText('Excluded after confirmation (unsubscribed): 1')).toBeVisible()
  await expect(page.getByText('Will receive: 2').first()).toBeVisible()
  const sendButton = page.getByRole('button', { name: 'Send campaign' })
  await expect(sendButton).toBeEnabled()

  const sent = page.waitForResponse(
    (response) => response.url().endsWith(`/campaigns/${campaign.id}/send`) && response.request().method() === 'POST',
  )
  await sendButton.click()
  await page.getByRole('dialog').getByRole('button', { name: 'Send', exact: true }).click()
  expect((await sent).status()).toBe(200)
  await expect(titleBlock.getByText('Sending', { exact: true })).toBeVisible()

  // a second press while the campaign is already queued must not add recipients
  const again = await json<CampaignRow>(await request.post(
    `${apiUrl}/businesses/me/campaigns/${campaign.id}/send`,
    { headers: salon.owner.headers },
  ))
  expect(again.queued_count).toBe(1)

  runCampaignJob()
  runCampaignJob()

  // the booking confirmation is captured by the same job, so pick the campaign message by its footer
  const campaignMail = (row: CapturedMail) => row.text.includes('/unsubscribe#token=')
  const mail = capturedMail().filter((row) => row.recipient === keep.email && campaignMail(row))
  expect(mail).toHaveLength(1)
  expect(mail[0].subject).toBe('We miss you, Keeper Guest')
  expect(mail[0].text).toContain('Keeper Guest, it has been a while')
  expect(mail[0].text).toContain(salon.businessName)
  expect(capturedMail().filter((row) => row.recipient === leave.email && campaignMail(row))).toHaveLength(0)

  await page.reload()
  await expect(titleBlock.getByText('Sent', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Delivery summary')).toBeVisible()
  await expect(page.locator('dl > div', { hasText: 'Captured locally' }).locator('dd')).toHaveText('1')

  // the footer link is signed, idempotent and unsubscribes exactly this contact
  const unsubscribe = await page.context().newPage()
  await unsubscribe.goto(unsubscribeLink(mail[0]))
  await expect(unsubscribe.getByRole('heading', { name: 'Email preferences' })).toBeVisible()
  await expect(unsubscribe.getByText(salon.businessName)).toBeVisible()
  await expect(unsubscribe.getByText('k***@example.com')).toBeVisible()
  await expect(unsubscribe.getByText('This address is subscribed to marketing emails.')).toBeVisible()
  await unsubscribe.getByRole('button', { name: 'Unsubscribe', exact: true }).click()
  await expect(unsubscribe.getByText(
    'You are unsubscribed. This address will not receive marketing emails.',
  )).toBeVisible()
  await unsubscribe.close()

  const stats = await json<CampaignStats>(await request.get(
    `${apiUrl}/businesses/me/campaigns/${campaign.id}/stats`,
    { headers: salon.owner.headers },
  ))
  expect(stats.status).toBe('sent')
  expect(stats.queued).toBe(1)
  expect(stats.captured).toBe(1)
  expect(stats.unsubscribed).toBe(1)
})

test('cancelling a queued campaign stops the captured delivery', async ({ page, request }) => {
  test.slow()
  const salon = await createSalon(request)
  const guest: Guest = { name: 'Cancel Guest', email: `${unique('cancelled')}@example.com` }
  await bookGuest(request, salon, 12, guest)
  ageClientRelations(salon.businessName)

  const subject = unique('Cancel subject')
  const campaign = await json<CampaignRow>(await request.post(`${apiUrl}/businesses/me/campaigns`, {
    headers: salon.owner.headers,
    data: {
      name: unique('Cancelled campaign'),
      subject,
      body: '{name}, this message must never leave the outbox.',
      segment_kind: 'no_visits',
      inactive_days: INACTIVE_DAYS,
    },
  }))
  await json(await request.post(
    `${apiUrl}/businesses/me/campaigns/${campaign.id}/confirm`,
    { headers: salon.owner.headers },
  ))

  await openAs(page, salon.owner, '/app/campaigns')
  const titleBlock = page.locator('h2', { hasText: campaign.name }).locator('..')
  await expect(titleBlock.getByText('Confirmed', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Send campaign' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Send', exact: true }).click()
  await expect(titleBlock.getByText('Sending', { exact: true })).toBeVisible()

  const cancelled = page.waitForResponse(
    (response) => response.url().endsWith(`/campaigns/${campaign.id}/cancel`) && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Cancel campaign' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, cancel' }).click()
  expect((await cancelled).status()).toBe(200)
  await expect(page.getByText('Campaign cancelled. Unsent messages were stopped.')).toBeVisible()
  await expect(titleBlock.getByText('Cancelled', { exact: true })).toBeVisible()

  runCampaignJob()
  runCampaignJob()
  expect(capturedMail().filter((row) => row.subject === subject)).toHaveLength(0)
  expect(capturedMail().filter(
    (row) => row.recipient === guest.email && row.text.includes('/unsubscribe#token='),
  )).toHaveLength(0)

  const stats = await json<CampaignStats>(await request.get(
    `${apiUrl}/businesses/me/campaigns/${campaign.id}/stats`,
    { headers: salon.owner.headers },
  ))
  expect(stats.status).toBe('cancelled')
  expect(stats.queued).toBe(1)
  expect(stats.cancelled).toBe(1)
  expect(stats.captured).toBe(0)
})
