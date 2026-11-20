import { test, expect, type APIRequestContext } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiPost, apiUrl, field, newOwner, openAs, waitForFormData, type Session } from './helpers'

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

const CASES = (['en', 'ru', 'cz'] as const).flatMap(language =>
  (['light', 'dark'] as const).flatMap(theme => [1280, 375].map(width => ({ language, theme, width }))))

for (const { language, theme, width } of CASES) {
  test(`legacy visit becomes a chain, moves, refuses conflicts and counts once (${language}, ${theme}, ${width})`, async ({ page, request }) => {
    const t = (key: TranslationKey) => translations[key][language]
    await page.setViewportSize({ width, height: 900 })
    const salon = await chainFixture(request)
    await openAs(page, salon.owner, '/visits')
    const prefs = await request.put(`${apiUrl}/user-preferences/me`, {
      headers: salon.owner.headers, data: { theme, language },
    })
    expect(prefs.ok(), await prefs.text()).toBeTruthy()
    await page.reload()
    await expect(page.getByRole('heading', { name: t('visits.title'), level: 1 })).toBeVisible()
    await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(theme === 'dark')

    const row = page.getByRole('row').filter({ hasText: CLIENT_NAME })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(FIRST.name)
    await row.getByRole('button', { name: t('common.edit') }).click()
    await waitForFormData(page)

    await expect(field(page, new RegExp(t('visits.startDateTime')))).toHaveValue(`${DAY}T10:00`)
    await page.getByRole('button', { name: t('visits.addService') }).click()
    await page.getByLabel(`${t('visits.service')} 2`, { exact: true }).selectOption(String(salon.secondServiceId))
    await expect(page.getByLabel(`${t('visits.specialist')} 2`, { exact: true })).toHaveValue(String(salon.owner.user.id))
    await expect(page.getByText(`${FIRST.minutes + SECOND.minutes} ${t('services.min')}`)).toBeVisible()

    await page.screenshot({ path: test.info().outputPath(`multi-form-${language}-${theme}-${width}.png`), fullPage: true })

    const updated = page.waitForResponse((r) => r.url().endsWith(`/visits/${salon.visitId}`) && r.request().method() === 'PUT')
    await page.getByRole('button', { name: t('visits.updateVisit') }).click()
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
    await expect(page.getByRole('heading', { name: t('calendar.title'), level: 1 })).toBeVisible()

    const cards = page.locator(`[data-visit-id="${salon.visitId}"]`)
    await expect(cards).toHaveCount(2)
    await expect(cards.first()).toHaveAttribute('aria-label', /10:00–10:30/)
    await expect(cards.nth(1)).toHaveAttribute('aria-label', /10:30–11:30/)
    await expect(page.getByText('1/2')).toBeVisible()
    await expect(page.getByText('2/2')).toBeVisible()

    // grabbing the second service still opens and moves the whole chain
    await cards.nth(1).click()
    const dialog = page.getByRole('dialog', { name: t('calendar.moveTitle') })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('input[type="time"]')).toHaveValue('10:00')
    await dialog.locator('input[type="time"]').fill('14:00')
    const moved = page.waitForResponse((r) => r.url().endsWith(`/visits/${salon.visitId}`) && r.request().method() === 'PUT')
    await dialog.getByRole('button', { name: t('calendar.moveSubmit'), exact: true }).click()
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
    await page.screenshot({ path: test.info().outputPath(`multi-moved-${language}-${theme}-${width}.png`), fullPage: true })

    // a visit of the same master takes the second half of the chain: 13:30Z is 15:30 in Prague
    const blocker = await apiPost<{ id: number }>(request, salon.owner, '/visits/', {
      client_id: salon.clientId,
      specialist_id: salon.owner.user.id,
      date_start: '2030-05-06T13:30:00Z',
      date_end: '2030-05-06T14:30:00Z',
      status: 'planned',
    })
    await cards.first().click()
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="time"]').fill('15:00')
    await dialog.getByRole('button', { name: t('calendar.moveSubmit'), exact: true }).click()
    await expect(dialog.getByRole('alert')).toContainText(t('calendar.moveConflict'))
    await dialog.getByRole('button', { name: t('common.cancel') }).click()
    await expect(dialog).toBeHidden()
    await expect(cards.first()).toHaveAttribute('aria-label', /14:00–14:30/)
    visit = await getVisit(request, salon)
    expect(visit.items?.[0].date_start).toBe('2030-05-06T12:00:00Z')
    // the blocker did its job; it has no price, and the report won't total a day with an unknown price
    const removed = await request.delete(`${apiUrl}/visits/${blocker.id}`, { headers: salon.owner.headers })
    expect(removed.ok(), await removed.text()).toBeTruthy()

    // completing twice must not double revenue, salary or loyalty base: they read Visit.price once
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const completed = await request.put(`${apiUrl}/visits/${salon.visitId}`, {
        headers: salon.owner.headers,
        data: { status: 'completed', payment_method: 'cash' },
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

    // a cancelled chain keeps its items for history; the report keeps counting the single visit price
    const cancelled = await request.put(`${apiUrl}/visits/${salon.visitId}`, {
      headers: salon.owner.headers,
      data: { status: 'cancelled' },
    })
    expect(cancelled.ok(), await cancelled.text()).toBeTruthy()
    visit = await getVisit(request, salon)
    expect(visit.status).toBe('cancelled')
    expect(visit.items).toHaveLength(2)
    report = await financialReport(request, salon)
    expect(report.total_revenue).toBe(100)

    expect(blocker.id).toBeGreaterThan(0)
  })

  test(`guest books two ordered services (${language}, ${theme}, ${width})`, async ({ page, request }) => {
    const t = (key: TranslationKey) => translations[key][language]
    const salon = await chainFixture(request)
    const settings = await request.put(`${apiUrl}/businesses/me/public-booking`, {
      headers: salon.owner.headers, data: { is_enabled: true },
    })
    expect(settings.ok(), await settings.text()).toBeTruthy()
    const { slug } = await settings.json() as { slug: string }
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(([lang, mode]) => {
      localStorage.setItem('app_locale', lang)
      localStorage.setItem('theme', mode)
    }, [language, theme])
    await page.goto(`/booking/${slug}`)
    await expect(page.getByRole('heading', { name: t('booking.chooseService') })).toBeVisible()
    await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(theme === 'dark')
    await page.getByRole('button', { name: new RegExp(SECOND.name) }).click()
    await page.getByRole('button', { name: new RegExp(FIRST.name) }).click()
    // Selection order, including a deselect/reselect, becomes the actual service order.
    await page.getByRole('button', { name: new RegExp(FIRST.name) }).click()
    await page.getByRole('button', { name: new RegExp(FIRST.name) }).click()
    const selected = page.locator('ol li')
    await expect(selected).toHaveCount(2)
    await expect(selected.nth(0)).toContainText(SECOND.name)
    await expect(selected.nth(1)).toContainText(FIRST.name)
    await expect(page.getByText(`90 ${t('services.min')}`, { exact: true })).toBeVisible()
    await page.screenshot({ path: test.info().outputPath(`multi-public-selected-${language}-${theme}-${width}.png`), fullPage: true })
    await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
    await page.getByRole('button', { name: t('booking.anyMaster'), exact: true }).click()
    await expect(page.getByRole('heading', { name: t('booking.chooseTime') })).toBeVisible()
    await page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first().click()
    await page.locator('input[name="full_name"]').fill('Guest Chain')
    await page.locator('input[name="email"]').fill(`multi-${language}-${theme}-${width}@example.com`)
    await page.getByRole('checkbox', { name: t('booking.processingConsent'), exact: true }).check()
    await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
    await expect(page.getByRole('heading', { name: t('booking.summary') })).toBeVisible()
    const posted = page.waitForResponse(r => r.url().endsWith('/bookings') && r.request().method() === 'POST')
    await page.getByRole('button', { name: t('booking.confirm'), exact: true }).click()
    const response = await posted
    expect(response.status()).toBe(200)
    expect(response.request().postDataJSON().service_ids).toEqual([salon.secondServiceId, salon.firstServiceId])
    const booking = await response.json() as { id: number }
    await expect(page.getByText(`#${booking.id}`, { exact: true })).toBeVisible()
    const saved = await getVisit(request, { ...salon, visitId: booking.id })
    expect(saved.items?.map(item => item.service_name)).toEqual([SECOND.name, FIRST.name])
    expect(saved.price).toBe(100)
    expect(new Date(saved.date_end!).getTime() - new Date(saved.date_start).getTime()).toBe(90 * 60000)
    expect(new Date(saved.items![0].date_end).getTime() - new Date(saved.items![0].date_start).getTime()).toBe(60 * 60000)
    expect(saved.items![1].date_start).toBe(saved.items![0].date_end)
    await page.screenshot({ path: test.info().outputPath(`multi-public-booked-${language}-${theme}-${width}.png`), fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('chain completion counts materials and loyalty once', async ({ request }) => {
  const salon = await chainFixture(request)
  const product = await apiPost<{ id: number }>(request, salon.owner, '/products/', {
    business_id: salon.owner.user.business_id, name: 'Chain supplies', quantity: 10,
  })
  await apiPost(request, salon.owner, '/loyalty/program', {
    business_id: salon.owner.user.business_id, program_type: 'points', points_per_currency: 1,
  })
  const visit = await apiPost<{ id: number }>(request, salon.owner, '/visits/', {
    client_id: salon.clientId, specialist_id: salon.owner.user.id, date_start: '2030-05-07T08:00:00Z',
    items: [{ service_id: salon.firstServiceId }, { service_id: salon.secondServiceId }],
    used_products: [{ product_id: product.id, quantity: 2 }],
  })
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const done = await request.put(`${apiUrl}/visits/${visit.id}`, {
      headers: salon.owner.headers, data: { status: 'completed', payment_method: 'cash' },
    })
    expect(done.ok(), await done.text()).toBeTruthy()
  }
  const stock = await request.get(`${apiUrl}/products/${product.id}`, { headers: salon.owner.headers })
  expect(stock.ok(), await stock.text()).toBeTruthy()
  expect((await stock.json()).quantity).toBe(8)
  const usages = await request.get(`${apiUrl}/products/usage`, {
    headers: salon.owner.headers, params: { visit_id: visit.id },
  })
  expect(usages.ok(), await usages.text()).toBeTruthy()
  expect((await usages.json()).items.map((row: { quantity: number }) => row.quantity)).toEqual([2])
  const balance = await request.get(`${apiUrl}/loyalty/balance/${salon.clientId}`, { headers: salon.owner.headers })
  expect(balance.ok(), await balance.text()).toBeTruthy()
  expect((await balance.json()).points).toBe(100)
  const transactions = await request.get(`${apiUrl}/loyalty/transactions/${salon.clientId}`, { headers: salon.owner.headers })
  expect(transactions.ok(), await transactions.text()).toBeTruthy()
  const earned = (await transactions.json()).items.filter((row: { transaction_type: string }) => row.transaction_type === 'earned')
  expect(earned.map((row: { points_amount: number }) => row.points_amount)).toEqual([100])
})
