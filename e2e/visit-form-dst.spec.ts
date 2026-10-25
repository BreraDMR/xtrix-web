import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { apiPost, apiUrl, field, newOwner, openAs, type Session } from './helpers'

test.use({ timezoneId: 'Europe/Prague' })
const wall = '2026-10-25T02:30'
async function prepare(page: Page, request: APIRequestContext, label: string) {
  const owner = await newOwner(request)
  const business = await request.put(`${apiUrl}/businesses/${owner.user.business_id}`, {
    headers: owner.headers, data: { timezone: 'Europe/Prague' },
  })
  expect(business.ok(), await business.text()).toBeTruthy()
  const client = await apiPost<{id: number}>(request, owner, '/clients/', { full_name: label, contact_phone: '+420700001725' })
  await page.clock.install({ time: new Date('2026-10-25T12:00:00Z') })
  await page.clock.resume()
  return { owner, client }
}
async function savedVisit(request: APIRequestContext, owner: Session, id: number) {
  const response = await request.get(`${apiUrl}/visits/${id}`, { headers: owner.headers })
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}

test('creates a 60-minute service from the first repeated 02:30 to the second', async ({ page, request }) => {
  const { owner } = await prepare(page, request, 'First fold client')
  const service = await apiPost<{id: number}>(request, owner, '/services/', {
    name: 'Sixty real minutes', specialist_id: owner.user.id, duration_minutes: 60, price: 30,
  })
  await openAs(page, owner, '/app/visits')
  await page.getByRole('button', { name: 'New Visit', exact: true }).click()
  await field(page, /^Client/).selectOption({label: 'First fold client'})
  await field(page, /^Start Date & Time/).fill(wall)
  await field(page, /^Service$/).selectOption(String(service.id))
  await expect(field(page, /^End Date & Time/)).toHaveValue(wall)
  const posted = page.waitForResponse(r => r.url().endsWith('/visits/') && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Create Visit', exact: true }).click()
  const response = await posted
  expect(response.status(), await response.text()).toBe(200)
  const payload = response.request().postDataJSON()
  expect(payload.date_start).toBe('2026-10-25T00:30:00.000Z')
  expect(payload.date_end).toBe('2026-10-25T01:30:00.000Z')
  const visit = await savedVisit(request, owner, (await response.json()).id)
  expect(new Date(visit.date_end).getTime() - new Date(visit.date_start).getTime()).toBe(60 * 60_000)
  await expect(page.getByRole('row').filter({hasText: 'First fold client'})).toHaveCount(1)
})

test('note-only edit preserves the loaded second-fold UTC instants', async ({ page, request }) => {
  const { owner, client } = await prepare(page, request, 'Second fold edit client')
  const visit = await apiPost<{id: number}>(request, owner, '/visits/', {
    client_id: client.id, specialist_id: owner.user.id, date_start: '2026-10-25T01:30:00Z',
    date_end: '2026-10-25T02:30:00Z', service_name: 'Second fold original', price: 30, note: 'Original note',
  })
  await openAs(page, owner, '/app/visits')
  await page.getByRole('row').filter({hasText: 'Second fold edit client'}).getByRole('button', {name:'Edit',exact:true}).click()
  await expect(field(page, /^Start Date & Time/)).toHaveValue(wall)
  await expect(field(page, /^End Date & Time/)).toHaveValue('2026-10-25T03:30')
  await expect(field(page, /^Notes$/)).toHaveValue('Original note')
  await field(page, /^Notes$/).fill('Only this note changed')
  const updated = page.waitForResponse(r => r.url().endsWith(`/visits/${visit.id}`) && r.request().method() === 'PUT')
  await page.getByRole('button', {name:'Update Visit',exact:true}).click()
  const response = await updated
  expect(response.status(), await response.text()).toBe(200)
  const payload = response.request().postDataJSON()
  expect(payload.date_start).toBe('2026-10-25T01:30:00.000Z')
  expect(payload.date_end).toBe('2026-10-25T02:30:00.000Z')
  const stored = await savedVisit(request, owner, visit.id)
  expect(new Date(stored.date_start).toISOString()).toBe('2026-10-25T01:30:00.000Z')
  expect(new Date(stored.date_end).toISOString()).toBe('2026-10-25T02:30:00.000Z')
  expect(stored.note).toBe('Only this note changed')
})
