import { test, expect, type APIRequestContext } from '@playwright/test'
import { apiPost, apiUrl, field, newOwner, openAs, type Session } from './helpers'

// Monday 6 May 2030 in Prague (CEST, UTC+2); the browser clock opens the calendar on it
const TIME_ZONE = 'Europe/Prague'
const DAY = '2030-05-06'
const CLOCK = new Date('2030-05-06T10:00:00+02:00')
const CLIENT_NAME = 'Nina Chain'
const FIRST = { name: 'Haircut', minutes: 30, price: 40 }
const SECOND = { name: 'Coloring', minutes: 60, price: 60 }

interface ChainFixture {
  owner: Session
  clientId: number
  firstServiceId: number
  secondServiceId: number
  visitId: number
}

async function chainFixture(request: APIRequestContext): Promise<ChainFixture> {
  const owner = await newOwner(request)
  expect(owner.user.business_id).toBeTruthy()
  const business = await request.put(`${apiUrl}/businesses/${owner.user.business_id}`, {
    headers: owner.headers,
    data: { timezone: TIME_ZONE, currency: 'EUR' },
  })
  expect(business.ok(), await business.text()).toBeTruthy()

  const client = await apiPost<{ id: number }>(request, owner, '/clients/', {
    full_name: CLIENT_NAME,
    contact_phone: '+420700000301',
  })

  const service = (data: { name: string; minutes: number; price: number }) =>
    apiPost<{ id: number }>(request, owner, '/services/', {
      name: data.name,
      duration_minutes: data.minutes,
      price: data.price,
      specialist_id: owner.user.id,
      specialist_ids: [owner.user.id],
      is_active: true,
    })

  const first = await service({ name: FIRST.name, minutes: FIRST.minutes, price: FIRST.price })
  const second = await service({ name: SECOND.name, minutes: SECOND.minutes, price: SECOND.price })

  await apiPost(request, owner, '/schedules/work', {
    specialist_id: owner.user.id,
    weekday: 0,
    start_time: '09:00',
    end_time: '18:00',
  })

  // a legacy single-service visit: the edit form must upgrade it to items without losing it
  const legacy = await apiPost<{ id: number }>(request, owner, '/visits/', {
    client_id: client.id,
    specialist_id: owner.user.id,
    service_id: first.id,
    service_name: FIRST.name,
    date_start: '2030-05-06T08:00:00Z',
    date_end: '2030-05-06T08:30:00Z',
    price: FIRST.price,
    status: 'planned',
  })

  return {
    owner,
    clientId: client.id,
    firstServiceId: first.id,
    secondServiceId: second.id,
    visitId: legacy.id,
  }
}

async function getVisit(request: APIRequestContext, salon: ChainFixture) {
  const response = await request.get(`${apiUrl}/visits/${salon.visitId}`, { headers: salon.owner.headers })
  expect(response.ok(), await response.text()).toBeTruthy()
  return (await response.json()) as {
    id: number
    date_start: string
    date_end: string | null
    price: number | null
    status: string
    items?: { service_name?: string | null; date_start: string; date_end: string; price?: number | null; specialist_id?: number | null }[]
  }
}

async function financialReport(request: APIRequestContext, salon: ChainFixture) {
  const response = await request.get(`${apiUrl}/analytics/financial/report`, {
    headers: salon.owner.headers,
    params: { date_from: '2030-05-06T00:00:00Z', date_to: '2030-05-07T00:00:00Z' },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
  return (await response.json()) as { total_revenue: number; average_revenue_per_visit: number }
}

test('legacy visit becomes a chain, moves as a group, refuses conflicts and counts revenue once', async ({ page, request }) => {
  const salon = await chainFixture(request)
  await openAs(page, salon.owner, '/visits')
  await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()

  const row = page.getByRole('row').filter({ hasText: CLIENT_NAME })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText(FIRST.name)
  await row.getByRole('button', { name: 'Edit' }).click()

  await expect(field(page, /^Start Date & Time/)).toHaveValue(`${DAY}T10:00`)
  await page.getByRole('button', { name: /add service/i }).click()
  await page.getByLabel('Service 2').selectOption(String(salon.secondServiceId))
  await expect(page.getByLabel('Specialist 2')).toHaveValue(String(salon.owner.user.id))
  await expect(page.getByText(`${FIRST.minutes + SECOND.minutes} min`)).toBeVisible()

  const updated = page.waitForResponse((r) => r.url().endsWith(`/visits/${salon.visitId}`) && r.request().method() === 'PUT')
  await page.getByRole('button', { name: 'Update Visit' }).click()
  const updateResponse = await updated
  expect(updateResponse.status()).toBe(200)
  const updateBody = updateResponse.request().postDataJSON() as Record<string, unknown>
  expect(updateBody.items).toEqual([
    { service_id: salon.firstServiceId, specialist_id: salon.owner.user.id },
    { service_id: salon.secondServiceId, specialist_id: salon.owner.user.id },
  ])
  expect(updateBody).not.toHaveProperty('service_id')
  expect(updateBody).not.toHaveProperty('date_end')

  let visit = await getVisit(request, salon)
  expect(visit.items).toHaveLength(2)
  expect(visit.price).toBe(FIRST.price + SECOND.price)
  expect(visit.items?.[0].date_start).toBe('2030-05-06T08:00:00Z')
  expect(visit.items?.[1].date_start).toBe('2030-05-06T08:30:00Z')
  expect(visit.items?.[1].date_end).toBe('2030-05-06T09:30:00Z')

  await page.clock.install({ time: CLOCK })
  await page.clock.resume()
  await page.goto('/app/calendar')
  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible()

  const cards = page.locator(`[data-visit-id="${salon.visitId}"]`)
  await expect(cards).toHaveCount(2)
  await expect(cards.first()).toHaveAttribute('aria-label', /10:00–10:30/)
  await expect(cards.nth(1)).toHaveAttribute('aria-label', /10:30–11:30/)
  await expect(page.getByText('1/2')).toBeVisible()
  await expect(page.getByText('2/2')).toBeVisible()

  // grabbing the second service still opens and moves the whole chain
  await cards.nth(1).click()
  const dialog = page.getByRole('dialog', { name: 'Move visit' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('input[type="time"]')).toHaveValue('10:00')
  await dialog.locator('input[type="time"]').fill('14:00')
  const moved = page.waitForResponse((r) => r.url().endsWith(`/visits/${salon.visitId}`) && r.request().method() === 'PUT')
  await dialog.getByRole('button', { name: 'Move', exact: true }).click()
  expect((await moved).status()).toBe(200)
  await expect(dialog).toBeHidden()
  await expect(cards.first()).toHaveAttribute('aria-label', /14:00–14:30/)
  await expect(cards.nth(1)).toHaveAttribute('aria-label', /14:30–15:30/)

  visit = await getVisit(request, salon)
  expect(visit.items?.map((item) => item.date_start)).toEqual([
    '2030-05-06T12:00:00Z',
    '2030-05-06T12:30:00Z',
  ])
  expect(visit.price).toBe(100)

  // a visit of the same master takes the second half of the chain
  const blocker = await apiPost<{ id: number }>(request, salon.owner, '/visits/', {
    client_id: salon.clientId,
    specialist_id: salon.owner.user.id,
    date_start: '2030-05-06T13:00:00Z',
    date_end: '2030-05-06T14:00:00Z',
    price: 10,
    status: 'planned',
  })
  await cards.first().click()
  await expect(dialog).toBeVisible()
  await dialog.locator('input[type="time"]').fill('15:00')
  await dialog.getByRole('button', { name: 'Move', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('This time is already taken')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  await expect(cards.first()).toHaveAttribute('aria-label', /14:00–14:30/)
  visit = await getVisit(request, salon)
  expect(visit.items?.[0].date_start).toBe('2030-05-06T12:00:00Z')

  // completing twice must not double revenue, salary or loyalty base: they read Visit.price once
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const completed = await request.put(`${apiUrl}/visits/${salon.visitId}`, {
      headers: salon.owner.headers,
      data: { status: 'completed' },
    })
    expect(completed.ok(), await completed.text()).toBeTruthy()
  }
  visit = await getVisit(request, salon)
  expect(visit.status).toBe('completed')
  expect(visit.items).toHaveLength(2)
  expect(visit.price).toBe(100)
  let report = await financialReport(request, salon)
  expect(report.total_revenue).toBe(100)
  expect(report.average_revenue_per_visit).toBe(100)

  // a cancelled chain keeps its items for history and stops counting
  const cancelled = await request.put(`${apiUrl}/visits/${salon.visitId}`, {
    headers: salon.owner.headers,
    data: { status: 'cancelled' },
  })
  expect(cancelled.ok(), await cancelled.text()).toBeTruthy()
  visit = await getVisit(request, salon)
  expect(visit.status).toBe('cancelled')
  expect(visit.items).toHaveLength(2)
  report = await financialReport(request, salon)
  expect(report.total_revenue).toBe(0)

  expect(blocker.id).toBeGreaterThan(0)
})
