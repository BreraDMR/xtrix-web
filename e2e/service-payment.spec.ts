import { createHmac } from 'node:crypto'
import { execFileSync } from 'node:child_process'

import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test'
import { apiUrl, newOwner, openAs, unique, type Session } from './helpers'

const TIMEZONE = 'Europe/Prague'
const SERVICE_NAME = 'Deposit Cut'
const SERVICE_PRICE = 40
const DEPOSIT = 15
const REMAINING = SERVICE_PRICE - DEPOSIT

interface DepositSalon {
  owner: Session
  name: string
  slug: string
  serviceId: number
  staffId: number
}

interface PublicSlot {
  start: string
  staff_id: number
}

interface PublicSlots {
  days: { date: string; slots: PublicSlot[] }[]
}

interface PublicPayment {
  public_ref: string
  status: string
  amount: number
  remaining_amount: number
  refunded_amount: number
  currency: string
  checkout_url?: string | null
  hold_expires_at: string
}

interface PublicBooking {
  id: number
  start: string
  status: string
  service_name: string
  timezone: string
  payment?: PublicPayment | null
  manage_token?: string
}

interface PaymentStatus extends PublicPayment {
  visit_status: string
  visit_start: string
  service_name: string
  timezone: string
}

interface ServicePayment {
  id: number
  status: string
  client_name: string
  amount: number
  refunded_amount: number
  refundable_amount: number
  visit_status: string
  refunds: { id: number; amount: number }[]
}

interface RefundRow {
  id: number
  amount: number
  status: string
}

async function json<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
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

async function createDepositSalon(request: APIRequestContext): Promise<DepositSalon> {
  const owner = await newOwner(request, { fullName: 'Dana Deposit' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')

  const name = unique('Deposit Salon')
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

  const today = pragueWeekday()
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    if (weekday === today) continue
    await json(await request.post(`${apiUrl}/schedules/work`, {
      headers: owner.headers,
      data: { specialist_id: owner.user.id, weekday, start_time: '08:00', end_time: '20:00' },
    }))
  }

  const settings = await json<{
    slug: string
    payments_available: boolean
    deposit_type: string
    deposit_value: number
  }>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers,
    data: {
      is_enabled: true,
      deposit_type: 'fixed',
      deposit_value: DEPOSIT,
      deposit_hold_minutes: 30,
    },
  }))
  // the suite only runs with SERVICE_PAYMENT_PROVIDER=sandbox
  expect(settings.payments_available).toBe(true)
  expect(settings.deposit_type).toBe('fixed')
  expect(settings.deposit_value).toBe(DEPOSIT)
  if (!settings.slug) throw new Error('The public booking settings have no slug')

  return { owner, name, slug: settings.slug, serviceId: service.id, staffId: owner.user.id }
}

async function firstSlot(request: APIRequestContext, salon: DepositSalon): Promise<PublicSlot> {
  const slots = await json<PublicSlots>(await request.get(`${apiUrl}/public/booking/${salon.slug}/slots`, {
    params: {
      service_id: salon.serviceId,
      date_from: pragueDate(0),
      date_to: pragueDate(13),
    },
  }))
  const day = slots.days.find((entry) => entry.slots.length > 0)
  if (!day) throw new Error('The deposit salon has no free slots')
  return day.slots[0]
}

async function slotStarts(request: APIRequestContext, salon: DepositSalon): Promise<string[]> {
  const slots = await json<PublicSlots>(await request.get(`${apiUrl}/public/booking/${salon.slug}/slots`, {
    params: {
      service_id: salon.serviceId,
      date_from: pragueDate(0),
      date_to: pragueDate(13),
    },
  }))
  return slots.days.flatMap((day) => day.slots.map((slot) => slot.start))
}

async function createHeldBooking(request: APIRequestContext, salon: DepositSalon, name: string) {
  const slot = await firstSlot(request, salon)
  const booking = await json<PublicBooking>(await request.post(`${apiUrl}/public/booking/${salon.slug}/bookings`, {
    data: {
      service_id: salon.serviceId,
      staff_id: slot.staff_id,
      start: slot.start,
      full_name: name,
      email: `${unique('deposit-guest')}@example.com`,
      marketing_consent: false,
      processing_consent: true,
      client_request_id: unique('deposit-request'),
    },
  }))
  expect(booking.status).toBe('awaiting_payment')
  expect(booking.payment?.status).toBe('pending')
  expect(booking.payment?.amount).toBe(DEPOSIT)
  expect(booking.payment?.remaining_amount).toBe(REMAINING)
  expect(booking.payment?.checkout_url).toContain('/payment/sandbox#ref=')
  if (!booking.manage_token) throw new Error('The held booking has no manage token')
  return { booking, slot }
}

function paymentParams(payment: PublicPayment): { ref: string; token: string } {
  if (!payment.checkout_url) throw new Error('The pending payment has no checkout URL')
  const hash = new URLSearchParams(new URL(payment.checkout_url).hash.replace(/^#/, ''))
  const ref = hash.get('ref') ?? ''
  const token = hash.get('token') ?? ''
  if (!ref || !token) throw new Error(`The checkout URL has no payment parameters: ${payment.checkout_url}`)
  return { ref, token }
}

async function paymentStatus(
  request: APIRequestContext,
  params: { ref: string; token: string },
): Promise<PaymentStatus> {
  return json<PaymentStatus>(await request.get(
    `${apiUrl}/public/booking/payments/${encodeURIComponent(params.ref)}`,
    { headers: { 'X-Payment-Token': params.token } },
  ))
}

async function sandboxOutcome(
  request: APIRequestContext,
  params: { ref: string; token: string },
  outcome: 'paid' | 'failed',
): Promise<PaymentStatus> {
  return json<PaymentStatus>(await request.post(
    `${apiUrl}/public/booking/payments/${encodeURIComponent(params.ref)}/sandbox`,
    { headers: { 'X-Payment-Token': params.token }, data: { outcome } },
  ))
}

// the provider reference is internal, so the signed-webhook fixture reads it from the
// throwaway database the same way a provider would address the payment
function providerRef(publicRef: string): string {
  const container = process.env.E2E_PG_CONTAINER
  const database = process.env.E2E_PG_DB
  if (!container || !database) throw new Error('E2E_PG_CONTAINER and E2E_PG_DB are required')
  expect(publicRef).toMatch(/^[A-Za-z0-9_-]+$/)
  const value = execFileSync('docker', [
    'exec', container, 'psql', '-U', 'postgres', '-d', database, '-At', '-v', 'ON_ERROR_STOP=1', '-c',
    `SELECT provider_ref FROM service_payment_attempts WHERE public_ref = '${publicRef}'`,
  ], { encoding: 'utf8' }).trim()
  if (!value) throw new Error(`No provider reference for ${publicRef}`)
  return value
}

function eventCount(publicRef: string): number {
  const container = process.env.E2E_PG_CONTAINER
  const database = process.env.E2E_PG_DB
  if (!container || !database) throw new Error('E2E_PG_CONTAINER and E2E_PG_DB are required')
  const raw = execFileSync('docker', [
    'exec', container, 'psql', '-U', 'postgres', '-d', database, '-At', '-v', 'ON_ERROR_STOP=1', '-c',
    'SELECT count(*) FROM service_payment_events e ' +
      'JOIN service_payment_attempts a ON a.id = e.attempt_id ' +
      `WHERE a.public_ref = '${publicRef}'`,
  ], { encoding: 'utf8' }).trim()
  return Number(raw)
}

function webhookFor(event: {
  id: string
  type: string
  paymentRef: string
  amount: string
}): { raw: string; signature: string } {
  const secret = process.env.SERVICE_PAYMENT_WEBHOOK_SECRET
  const merchant = process.env.SERVICE_PAYMENT_MERCHANT
  if (!secret || !merchant) throw new Error('The sandbox webhook settings are not in the environment')
  const body = {
    amount: event.amount,
    currency: 'EUR',
    id: event.id,
    merchant,
    payment_ref: event.paymentRef,
    provider: 'sandbox',
    type: event.type,
  }
  const raw = JSON.stringify(body)
  return { raw, signature: createHmac('sha256', secret).update(raw).digest('hex') }
}

async function postWebhook(request: APIRequestContext, raw: string, signature: string, merchant?: string) {
  return request.post(`${apiUrl}/public/booking/payments/webhooks/sandbox`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Payment-Signature': signature,
      'X-Service-Payment-Merchant': merchant ?? process.env.SERVICE_PAYMENT_MERCHANT ?? '',
    },
    data: raw,
  })
}

async function listPayments(request: APIRequestContext, owner: Session): Promise<ServicePayment[]> {
  return json<ServicePayment[]>(await request.get(`${apiUrl}/businesses/me/service-payments`, {
    headers: owner.headers,
  }))
}

test('guest books a hold, pays the sandbox deposit and the salon refunds it', async ({ page, browser, request }) => {
  const salon = await createDepositSalon(request)
  const guestName = unique('Paying Guest')

  const guestContext = await browser.newContext({
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:3170',
    locale: 'en-GB',
    timezoneId: TIMEZONE,
    viewport: { width: 1280, height: 800 },
  })
  const guest = await guestContext.newPage()
  try {
    await guest.goto(`/booking/${salon.slug}`)
    await guest.getByRole('button', { name: new RegExp(SERVICE_NAME) }).click()
    await guest.getByRole('button', { name: 'Continue' }).click()
    await guest.getByRole('button', { name: 'Any available master' }).click()
    await guest.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first().click()

    await guest.locator('input[name="full_name"]').fill(guestName)
    await guest.locator('input[name="email"]').fill(`${unique('payer')}@example.com`)
    await guest.getByRole('checkbox', { name: /I agree that the salon may process/ }).check()
    await guest.getByRole('button', { name: 'Continue' }).click()
    // the summary states the conditions before the hold is created
    await expect(guest.getByText('Fixed deposit')).toBeVisible()
    await expect(guest.getByText('15.00 €').first()).toBeVisible()

    const posted = guest.waitForResponse(
      (response) => response.url().endsWith('/bookings') && response.request().method() === 'POST',
    )
    await guest.getByRole('button', { name: 'Confirm booking' }).click()
    const created = await posted
    expect(created.status()).toBe(200)
    const booking = (await created.json()) as PublicBooking
    expect(booking.status).toBe('awaiting_payment')
    expect(booking.payment?.amount).toBe(DEPOSIT)

    await expect(guest.getByRole('heading', { name: 'Slot held — pay the deposit' })).toBeVisible()
    await expect(guest.getByText(
      'We are holding this time for you. Pay the deposit to confirm the booking; the rest is paid at the salon.',
    )).toBeVisible()
    await expect(guest.getByText('25.00 €')).toBeVisible()
    await guest.getByRole('link', { name: 'Pay deposit' }).click()

    await expect(guest.getByRole('heading', { name: 'Sandbox checkout' })).toBeVisible()
    await expect(guest.getByText('Test mode — no real money')).toBeVisible()
    const paid = guest.waitForResponse(
      (response) => response.url().endsWith('/sandbox') && response.request().method() === 'POST',
    )
    await guest.getByRole('button', { name: /^Pay 15\.00/ }).click()
    expect((await paid).status()).toBe(200)
    await expect(guest).toHaveURL(/\/payment\/return#ref=/)
    await expect(guest.getByRole('heading', { name: 'Payment received' })).toBeVisible()
    await expect(guest.getByText('The deposit is paid and the booking is confirmed.')).toBeVisible()
    await expect(guest.getByText('Paid', { exact: true })).toBeVisible()
  } finally {
    await guestContext.close()
  }

  const ownerPage = await page.context().newPage()
  await openAs(ownerPage, salon.owner, '/app/finance')
  const desk = ownerPage.locator('section[aria-labelledby="service-payments-title"]')
  await expect(desk.getByRole('heading', { name: 'Guest deposits' })).toBeVisible()
  const card = desk.locator('li').filter({ hasText: guestName })
  await expect(card).toContainText(SERVICE_NAME)
  await expect(card).toContainText('Paid')
  await expect(card).toContainText('15.00 €')

  await card.getByRole('button', { name: 'Refund', exact: true }).click()
  const dialog = ownerPage.getByRole('dialog', { name: 'Refund deposit' })
  await expect(dialog).toBeVisible()
  const refunded = ownerPage.waitForResponse(
    (response) => /\/businesses\/me\/service-payments\/\d+\/refunds$/.test(response.url())
      && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Refund', exact: true }).click()
  expect((await refunded).status()).toBe(200)
  await expect(ownerPage.getByText('Refund recorded.')).toBeVisible()
  await expect(card.locator('span').filter({ hasText: /^Refunded$/ })).toBeVisible()
  await expect(card.getByRole('button', { name: 'Refund', exact: true })).toHaveCount(0)
  await expect(card).toContainText('15.00 €')

  const [payment] = await listPayments(request, salon.owner)
  expect(payment.status).toBe('refunded')
  expect(payment.refunded_amount).toBe(DEPOSIT)
  expect(payment.refundable_amount).toBe(0)
  expect(payment.refunds).toHaveLength(1)
})

test('a failed sandbox payment releases the held slot', async ({ page, request }) => {
  const salon = await createDepositSalon(request)
  const { booking, slot } = await createHeldBooking(request, salon, 'Failing Guest')
  const params = paymentParams(booking.payment!)

  await page.goto(booking.payment!.checkout_url!)
  await expect(page.getByRole('heading', { name: 'Sandbox checkout' })).toBeVisible()
  const failed = page.waitForResponse(
    (response) => response.url().endsWith('/sandbox') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Simulate a failed payment' }).click()
  expect((await failed).status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Payment was not completed' })).toBeVisible()
  await expect(page.getByText('Failed', { exact: true })).toBeVisible()

  const status = await paymentStatus(request, params)
  expect(status.status).toBe('failed')
  expect(status.visit_status).toBe('cancelled')
  expect(await slotStarts(request, salon)).toContain(slot.start)

  const [payment] = await listPayments(request, salon.owner)
  expect(payment.status).toBe('failed')
  expect(payment.visit_status).toBe('cancelled')
})

test('a signed webhook settles once and a replay is ignored', async ({ request }) => {
  const salon = await createDepositSalon(request)
  const { booking } = await createHeldBooking(request, salon, 'Webhook Guest')
  const params = paymentParams(booking.payment!)
  const ref = providerRef(booking.payment!.public_ref)
  const eventId = `evt_${unique('settle')}`
  const event = webhookFor({
    id: eventId,
    type: 'payment.paid',
    paymentRef: ref,
    amount: DEPOSIT.toFixed(2),
  })

  const first = await postWebhook(request, event.raw, event.signature)
  expect(first.status(), await first.text()).toBe(200)
  const firstBody = (await first.json()) as { duplicate: boolean; status: string }
  expect(firstBody).toEqual({ received: true, duplicate: false, status: 'paid' })

  const replay = await postWebhook(request, event.raw, event.signature)
  expect(replay.status()).toBe(200)
  const replayBody = (await replay.json()) as { duplicate: boolean; status: string }
  expect(replayBody).toEqual({ received: true, duplicate: true, status: 'paid' })
  expect(eventCount(booking.payment!.public_ref)).toBe(1)

  const status = await paymentStatus(request, params)
  expect(status.status).toBe('paid')
  expect(status.visit_status).toBe('planned')
  expect(await slotStarts(request, salon)).not.toContain(booking.start)

  const tampered = await postWebhook(request, event.raw, '0'.repeat(64))
  expect(tampered.status()).toBe(400)

  const wrongAmount = webhookFor({
    id: `evt_${unique('amount')}`,
    type: 'payment.paid',
    paymentRef: ref,
    amount: (DEPOSIT + 1).toFixed(2),
  })
  expect((await postWebhook(request, wrongAmount.raw, wrongAmount.signature)).status()).toBe(400)
  expect(eventCount(booking.payment!.public_ref)).toBe(1)
})

test('cancelling a hold frees the slot and a late payment is flagged for review', async ({ request }) => {
  const salon = await createDepositSalon(request)
  const { booking, slot } = await createHeldBooking(request, salon, 'Cancelling Guest')
  const params = paymentParams(booking.payment!)
  const ref = providerRef(booking.payment!.public_ref)

  const cancelled = await json<{ status: string }>(await request.post(
    `${apiUrl}/public/booking-management/cancel`,
    { headers: { 'X-Booking-Token': booking.manage_token! } },
  ))
  expect(cancelled.status).toBe('cancelled')
  expect((await paymentStatus(request, params)).status).toBe('cancelled')
  expect(await slotStarts(request, salon)).toContain(slot.start)

  const late = webhookFor({
    id: `evt_${unique('late')}`,
    type: 'payment.paid',
    paymentRef: ref,
    amount: DEPOSIT.toFixed(2),
  })
  expect((await postWebhook(request, late.raw, late.signature)).status()).toBe(200)
  const status = await paymentStatus(request, params)
  expect(status.status).toBe('reconcile')
  expect(status.visit_status).toBe('cancelled')

  const [payment] = await listPayments(request, salon.owner)
  expect(payment.status).toBe('reconcile')
  expect(payment.visit_status).toBe('cancelled')
})

test('deposit refunds are idempotent and never exceed the unrefunded amount', async ({ request }) => {
  const salon = await createDepositSalon(request)
  const { booking } = await createHeldBooking(request, salon, 'Refund Guest')
  await sandboxOutcome(request, paymentParams(booking.payment!), 'paid')
  const [paid] = await listPayments(request, salon.owner)
  expect(paid.status).toBe('paid')

  const refund = (key: string, amount?: number) => request.post(
    `${apiUrl}/businesses/me/service-payments/${paid.id}/refunds`,
    { headers: salon.owner.headers, data: { refund_key: key, ...(amount ? { amount } : {}) } },
  )
  const key = `rf-${unique('partial')}`
  const first = await json<RefundRow>(await refund(key, 5))
  expect(first.amount).toBe(5)
  const replay = await json<RefundRow>(await refund(key, 5))
  expect(replay.id).toBe(first.id)

  let [payment] = await listPayments(request, salon.owner)
  expect(payment.status).toBe('partially_refunded')
  expect(payment.refunded_amount).toBe(5)
  expect(payment.refundable_amount).toBe(DEPOSIT - 5)

  expect((await refund(`rf-${unique('over')}`, DEPOSIT - 5 + 1)).status()).toBe(422)

  const second = await json<RefundRow>(await refund(`rf-${unique('rest')}`))
  expect(second.amount).toBe(DEPOSIT - 5)
  ;[payment] = await listPayments(request, salon.owner)
  expect(payment.status).toBe('refunded')
  expect(payment.refunded_amount).toBe(DEPOSIT)
  expect(payment.refundable_amount).toBe(0)
  expect(payment.refunds).toHaveLength(2)
})
