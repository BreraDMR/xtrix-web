import { execFileSync } from 'node:child_process'

import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test'
import { apiUrl, newOwner, openAs, unique, type Session } from './helpers'

const TIMEZONE = 'Europe/Prague'
const SERVICE_NAME = 'Gift Cut'
const SERVICE_PRICE = 40
const MONEY_PRICE = 50
const MONEY_FACE = 60
const PACKAGE_PRICE = 90
const PACKAGE_VISITS = 3
const CODE_PATTERN = /^GIFT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

interface GiftSalon {
  owner: Session
  name: string
  slug: string
  serviceId: number
  moneyOfferId: number
  packageOfferId: number
  moneyOfferName: string
  packageOfferName: string
}

interface GiftOffer {
  id: number
  name: string
  kind: string
  price: number
  currency: string
  face_value?: number | null
  visits_count?: number | null
  service_ids: number[]
  is_active: boolean
}

interface GiftCertificate {
  id: number
  status: string
  kind: string
  code?: string | null
  code_last4: string
  money_balance: number
  visits_total: number
  visits_remaining: number
  recipient_name: string
  recipient_email?: string | null
  service_ids: number[]
}

interface GiftOrder {
  public_ref: string
  status: string
  amount: number
  currency: string
  offer_name: string
  kind: string
  checkout_url?: string | null
  certificate?: GiftCertificate | null
}

interface GiftRedemption {
  certificate: GiftCertificate
  entry_id: number
  applied_amount: number
  applied_visits: number
}

interface GiftReversal {
  certificate: GiftCertificate
  entry_id: number
  restored_amount: number
  restored_visits: number
}

interface GiftLedgerRow {
  id: number
  entry_type: string
  amount_delta: number
  units_delta: number
  request_key: string
  visit_id?: number | null
  redeems_entry_id?: number | null
}

interface GiftDetail extends GiftCertificate {
  order_id: number
  ledger: GiftLedgerRow[]
}

async function json<T>(response: APIResponse): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

async function createGiftSalon(request: APIRequestContext): Promise<GiftSalon> {
  const owner = await newOwner(request, { fullName: 'Gina Gifts' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')

  const name = unique('Gift Salon')
  await json(await request.put(`${apiUrl}/businesses/${businessId}`, {
    headers: owner.headers,
    data: { name, currency: 'EUR', timezone: TIMEZONE, booking_lead_time_minutes: 0 },
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

  const settings = await json<{ slug: string }>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers,
    data: { is_enabled: true },
  }))
  if (!settings.slug) throw new Error('The public booking settings have no slug')

  const moneyOfferName = unique('Money Card')
  const packageOfferName = unique('Visit Pack')
  const moneyOffer = await json<GiftOffer>(await request.post(`${apiUrl}/businesses/me/gift-offers`, {
    headers: owner.headers,
    data: {
      name: moneyOfferName,
      kind: 'money',
      price: MONEY_PRICE,
      face_value: MONEY_FACE,
      validity_days: 365,
      service_ids: [],
      is_active: true,
    },
  }))
  const packageOffer = await json<GiftOffer>(await request.post(`${apiUrl}/businesses/me/gift-offers`, {
    headers: owner.headers,
    data: {
      name: packageOfferName,
      kind: 'package',
      price: PACKAGE_PRICE,
      visits_count: PACKAGE_VISITS,
      validity_days: 365,
      service_ids: [service.id],
      is_active: true,
    },
  }))

  return {
    owner,
    name,
    slug: settings.slug,
    serviceId: service.id,
    moneyOfferId: moneyOffer.id,
    packageOfferId: packageOffer.id,
    moneyOfferName,
    packageOfferName,
  }
}

function giftParams(order: GiftOrder): { ref: string; token: string } {
  if (!order.checkout_url) throw new Error('The pending gift order has no checkout URL')
  const hash = new URLSearchParams(new URL(order.checkout_url).hash.replace(/^#/, ''))
  const ref = hash.get('ref') ?? ''
  const token = hash.get('token') ?? ''
  if (!ref || !token) throw new Error(`The checkout URL has no gift parameters: ${order.checkout_url}`)
  return { ref, token }
}

async function buyGift(
  request: APIRequestContext,
  salon: GiftSalon,
  offerId: number,
  buyerName: string,
  recipientName: string,
): Promise<{ order: GiftOrder; certificate: GiftCertificate; code: string }> {
  const created = await json<GiftOrder>(await request.post(`${apiUrl}/public/gifts/${salon.slug}/orders`, {
    data: {
      offer_id: offerId,
      client_request_id: unique('gift-buy'),
      buyer_name: buyerName,
      buyer_email: `${unique('buyer')}@example.com`,
      recipient_name: recipientName,
      recipient_email: `${unique('recipient')}@example.com`,
      message: 'Enjoy your visit',
      processing_consent: true,
    },
  }))
  expect(created.status).toBe('pending')
  expect(created.checkout_url).toContain('/gift/checkout#ref=')
  const params = giftParams(created)

  const order = await json<GiftOrder>(await request.post(
    `${apiUrl}/public/gifts/orders/${encodeURIComponent(params.ref)}/sandbox`,
    { headers: { 'X-Gift-Token': params.token }, data: { outcome: 'paid' } },
  ))
  expect(order.status).toBe('paid')
  if (!order.certificate?.code) throw new Error('The paid order has no certificate code')
  expect(order.certificate.code).toMatch(CODE_PATTERN)
  return { order, certificate: order.certificate, code: order.certificate.code }
}

async function createVisit(
  request: APIRequestContext,
  salon: GiftSalon,
  clientName: string,
  start: string,
): Promise<{ id: number; price: number }> {
  const client = await json<{ id: number }>(await request.post(`${apiUrl}/clients/`, {
    headers: salon.owner.headers,
    data: { full_name: clientName, language: 'en' },
  }))
  const visit = await json<{ id: number; price: number }>(await request.post(`${apiUrl}/visits/`, {
    headers: salon.owner.headers,
    data: {
      client_id: client.id,
      specialist_id: salon.owner.user.id,
      service_id: salon.serviceId,
      date_start: start,
    },
  }))
  expect(visit.price).toBe(SERVICE_PRICE)
  return visit
}

// The hold timer belongs to the server; the throwaway database is the only way to age it.
function expireGiftOrder(publicRef: string) {
  const container = process.env.E2E_PG_CONTAINER
  const database = process.env.E2E_PG_DB
  if (!container || !database) throw new Error('E2E_PG_CONTAINER and E2E_PG_DB are required')
  expect(publicRef).toMatch(/^[A-Za-z0-9_-]+$/)
  const output = execFileSync('docker', [
    'exec', container, 'psql', '-U', 'postgres', '-d', database, '-At', '-v', 'ON_ERROR_STOP=1', '-c',
    `UPDATE gift_orders SET expires_at = now() - interval '5 minutes' WHERE public_ref = '${publicRef}'`,
  ], { encoding: 'utf8' }).trim()
  expect(output).toBe('UPDATE 1')
}

test('a guest buys a certificate and the salon sees it in the gift desk', async ({ page, request }) => {
  const salon = await createGiftSalon(request)
  const buyerName = unique('Boris Buyer')
  const recipientName = unique('Nora Recipient')

  await page.goto(`/gift/${salon.slug}`)
  await expect(page.getByRole('heading', { name: 'Gift certificates', level: 1 })).toBeVisible()
  const offerCard = page.locator('li').filter({ hasText: salon.moneyOfferName })
  await expect(offerCard).toContainText('50.00 €')
  await expect(offerCard).toContainText('60.00 €')
  await offerCard.getByRole('button', { name: 'Buy' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: salon.moneyOfferName })).toBeVisible()
  await dialog.getByLabel('Your name').fill(buyerName)
  await dialog.getByLabel('Your email').fill(`${unique('gift-guest')}@example.com`)
  await dialog.getByLabel('Recipient name').fill(recipientName)
  await dialog.getByRole('checkbox').check()

  const created = page.waitForResponse(
    (response) => response.url().endsWith(`/public/gifts/${salon.slug}/orders`)
      && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Continue to payment' }).click()
  expect((await created).status()).toBe(201)
  await expect(page).toHaveURL(/\/gift\/checkout#ref=/)
  await expect(page.getByRole('heading', { name: 'Gift payment' })).toBeVisible()
  await expect(page.getByText('Waiting for payment')).toBeVisible()
  await expect(page.getByText('50.00 €')).toBeVisible()

  const settled = page.waitForResponse(
    (response) => response.url().endsWith('/sandbox') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Confirm payment' }).click()
  expect((await settled).status()).toBe(200)
  await expect(page).toHaveURL(/\/gift\/return#ref=/)
  await expect(page.getByRole('heading', { name: 'Certificate issued' })).toBeVisible()
  await expect(page.getByText(
    'We issued the certificate and linked it to this page. Keep the link.',
  )).toBeVisible()
  const codeElement = page.getByText(CODE_PATTERN)
  await expect(codeElement).toBeVisible()
  const code = ((await codeElement.textContent()) ?? '').trim()
  expect(code).toMatch(CODE_PATTERN)
  await expect(page.getByText('60.00 €', { exact: true })).toBeVisible()
  await expect(page.getByText(recipientName, { exact: true })).toBeVisible()

  // the buyer can return through the same link and read the same code
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Certificate issued' })).toBeVisible()
  await expect(page.getByText(code, { exact: true })).toBeVisible()
  const last4 = code.slice(-4)

  const ownerPage = await page.context().newPage()
  await openAs(ownerPage, salon.owner, '/app/loyalty')
  await ownerPage.getByRole('button', { name: 'Gift certificates', exact: true }).click()
  await expect(ownerPage.getByRole('heading', { name: 'Gift offers' })).toBeVisible()
  const shopLink = ownerPage.getByRole('link', { name: new RegExp(`/gift/${salon.slug}$`) })
  await expect(shopLink).toHaveAttribute('href', new RegExp(`/gift/${salon.slug}$`))
  const offers = ownerPage.getByRole('list')
  await expect(offers.getByText(salon.moneyOfferName, { exact: true })).toBeVisible()
  await expect(offers.getByText(salon.packageOfferName, { exact: true })).toBeVisible()

  const row = ownerPage.getByRole('row').filter({ hasText: last4 })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText(salon.moneyOfferName)
  await expect(row).toContainText(recipientName)
  await expect(row).toContainText('60.00 €')
  await expect(row).toContainText('Active')

  await row.getByRole('button', { name: 'Details' }).click()
  const detail = ownerPage.getByRole('dialog')
  await expect(detail.getByRole('heading', { name: 'Details' })).toBeVisible()
  await expect(detail.getByRole('heading', { name: 'Ledger' })).toBeVisible()
  await expect(detail.getByRole('row').filter({ hasText: 'Issued' })).toHaveCount(1)
  await detail.getByRole('button', { name: 'Close' }).click()
  await expect(detail).toHaveCount(0)
})

test('a money certificate is redeemed in part, retried and reversed against the ledger', async ({ request }) => {
  const salon = await createGiftSalon(request)
  const { code, certificate } = await buyGift(request, salon, salon.moneyOfferId, 'Mila Money', 'Nora Recipient')
  expect(certificate.money_balance).toBe(MONEY_FACE)
  const visit = await createVisit(request, salon, 'Vera Redeem', '2030-11-05T10:00:00Z')

  const redeem = (key: string, amount?: number) => request.post(
    `${apiUrl}/businesses/me/gift-certificates/redeem`,
    {
      headers: salon.owner.headers,
      data: { code, visit_id: visit.id, amount, request_key: key },
    },
  )
  const key = `gift-redeem-${unique('partial')}`
  const first = await json<GiftRedemption>(await redeem(key, 20))
  expect(first.applied_amount).toBe(20)
  expect(first.applied_visits).toBe(0)
  expect(first.certificate.money_balance).toBe(MONEY_FACE - 20)

  const replay = await json<GiftRedemption>(await redeem(key, 20))
  expect(replay.entry_id).toBe(first.entry_id)
  expect(replay.certificate.money_balance).toBe(MONEY_FACE - 20)

  const over = await redeem(`gift-redeem-${unique('over')}`, 100)
  expect(over.status()).toBe(409)
  expect((await over.json()) as { error: { message: string } }).toMatchObject({
    error: { message: 'Not enough balance for this amount' },
  })

  const reverseKey = `gift-reverse-${unique('full')}`
  const reverse = (requestKey: string) => request.post(
    `${apiUrl}/businesses/me/gift-certificates/${certificate.id}/reversals`,
    {
      headers: salon.owner.headers,
      data: { redemption_entry_id: first.entry_id, request_key: requestKey },
    },
  )
  const reversed = await json<GiftReversal>(await reverse(reverseKey))
  expect(reversed.restored_amount).toBe(20)
  expect(reversed.restored_visits).toBe(0)
  expect(reversed.certificate.money_balance).toBe(MONEY_FACE)
  const replayed = await json<GiftReversal>(await reverse(reverseKey))
  expect(replayed.entry_id).toBe(reversed.entry_id)
  expect(replayed.certificate.money_balance).toBe(MONEY_FACE)

  const detail = await json<GiftDetail>(await request.get(
    `${apiUrl}/businesses/me/gift-certificates/${certificate.id}`,
    { headers: salon.owner.headers },
  ))
  expect(detail.money_balance).toBe(MONEY_FACE)
  const types = detail.ledger.map((row) => row.entry_type)
  expect(types.filter((type) => type === 'issued')).toHaveLength(1)
  expect(types.filter((type) => type === 'redeemed')).toHaveLength(1)
  expect(types.filter((type) => type === 'reversed')).toHaveLength(1)
  const redeemed = detail.ledger.find((row) => row.entry_type === 'redeemed')!
  expect(redeemed.visit_id).toBe(visit.id)
  const reversal = detail.ledger.find((row) => row.entry_type === 'reversed')!
  expect(reversal.redeems_entry_id).toBe(redeemed.id)
  expect(reversal.amount_delta).toBe(20)
  const ledgerSum = detail.ledger.reduce((sum, row) => sum + row.amount_delta, 0)
  expect(ledgerSum).toBeCloseTo(detail.money_balance, 2)
})

test('a package spends one visit, a stale order never issues, a foreign salon cannot look up', async ({ request }) => {
  const salon = await createGiftSalon(request)
  const { code: packageCode, certificate: packageCertificate } = await buyGift(
    request,
    salon,
    salon.packageOfferId,
    'Pia Package',
    'Nora Recipient',
  )
  expect(packageCertificate.kind).toBe('package')
  expect(packageCertificate.visits_remaining).toBe(PACKAGE_VISITS)
  expect(packageCertificate.service_ids).toEqual([salon.serviceId])

  const visit = await createVisit(request, salon, 'Pavel Package', '2030-11-06T10:00:00Z')
  const redeem = (key: string) => request.post(
    `${apiUrl}/businesses/me/gift-certificates/redeem`,
    {
      headers: salon.owner.headers,
      data: { code: packageCode, visit_id: visit.id, request_key: key },
    },
  )
  const key = `gift-package-${unique('visit')}`
  const first = await json<GiftRedemption>(await redeem(key))
  expect(first.applied_visits).toBe(1)
  expect(first.applied_amount).toBe(0)
  expect(first.certificate.visits_remaining).toBe(PACKAGE_VISITS - 1)
  const replay = await json<GiftRedemption>(await redeem(key))
  expect(replay.entry_id).toBe(first.entry_id)
  expect(replay.certificate.visits_remaining).toBe(PACKAGE_VISITS - 1)

  const pending = await json<GiftOrder>(await request.post(`${apiUrl}/public/gifts/${salon.slug}/orders`, {
    data: {
      offer_id: salon.moneyOfferId,
      client_request_id: unique('gift-stale'),
      buyer_name: 'Stale Buyer',
      buyer_email: `${unique('stale')}@example.com`,
      processing_consent: true,
    },
  }))
  expect(pending.status).toBe('pending')
  const params = giftParams(pending)
  expireGiftOrder(pending.public_ref)

  const late = await request.post(
    `${apiUrl}/public/gifts/orders/${encodeURIComponent(params.ref)}/sandbox`,
    { headers: { 'X-Gift-Token': params.token }, data: { outcome: 'paid' } },
  )
  expect(late.status()).toBe(200)
  const lateOrder = (await late.json()) as GiftOrder
  expect(lateOrder.status).toBe('expired')
  expect(lateOrder.certificate).toBeNull()

  const reread = await json<GiftOrder>(await request.get(
    `${apiUrl}/public/gifts/orders/${encodeURIComponent(params.ref)}`,
    { headers: { 'X-Gift-Token': params.token } },
  ))
  expect(reread.status).toBe('expired')
  expect(reread.certificate).toBeNull()
  expect((await request.get(
    `${apiUrl}/public/gifts/orders/${encodeURIComponent(params.ref)}`,
  )).status()).toBe(404)

  const certificates = await json<GiftCertificate[]>(await request.get(
    `${apiUrl}/businesses/me/gift-certificates?limit=100`,
    { headers: salon.owner.headers },
  ))
  expect(certificates).toHaveLength(1)
  expect(certificates[0].id).toBe(packageCertificate.id)

  const foreign = await newOwner(request, { fullName: 'Fiona Foreign' })
  const lookup = await request.get(`${apiUrl}/businesses/me/gift-certificates/lookup`, {
    headers: foreign.headers,
    params: { code: packageCode },
  })
  expect(lookup.status()).toBe(404)
  const lookupBody = await lookup.text()
  expect(lookupBody).toContain('This gift code is unknown in this salon')
  expect(lookupBody).not.toContain('Nora Recipient')
  expect(lookupBody).not.toContain('Enjoy your visit')
  expect((await request.get(
    `${apiUrl}/businesses/me/gift-certificates/${packageCertificate.id}`,
    { headers: foreign.headers },
  )).status()).toBe(404)
})
