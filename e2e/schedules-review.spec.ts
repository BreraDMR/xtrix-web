import { test, expect } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiLogin, apiPost, apiUrl, newOwner, openAs, unique } from './helpers'

for (const language of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`schedule editing, rules and DST error ${language}/${theme}/${width}`, async ({ page, request }, info) => {
        const t = (key: TranslationKey) => translations[key][language]
        await page.setViewportSize({ width, height: 900 })
        const owner = await newOwner(request)
        const service = await apiPost<{ id: number }>(request, owner, '/services/', {
          name: 'Review Cut', duration_minutes: 60, price: 45, specialist_id: owner.user.id,
        })
        await openAs(page, owner, '/app/schedules')
        const prefs = await request.put(`${apiUrl}/user-preferences/me`, { headers: owner.headers, data: { language, theme } })
        expect(prefs.ok()).toBeTruthy()
        await page.reload()
        await expect(page.getByRole('heading', { name: t('schedule.title'), exact: true })).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', language)
        await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(theme === 'dark')
        const monday = page.getByRole('heading', { name: t('schedule.weekday.mon'), exact: true }).locator('xpath=../..')
        await monday.getByRole('button', { name: t('schedule.addWindow'), exact: true }).click()
        await monday.getByLabel(t('schedule.start'), { exact: true }).fill('09:00')
        await monday.getByLabel(t('schedule.end'), { exact: true }).fill('18:00')
        await monday.getByRole('button', { name: t('common.save'), exact: true }).click()
        await expect(monday.getByRole('button', { name: t('common.save'), exact: true })).toHaveCount(0)
        await expect(monday.getByLabel(t('schedule.start'), { exact: true })).toHaveValue('09:00')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
        await page.screenshot({ path: info.outputPath('weekly.png'), fullPage: true })

        await page.getByRole('tab', { name: t('schedule.tab.rules'), exact: true }).click()
        await page.getByLabel(t('schedule.rules.timezone'), { exact: false }).fill('Europe/Prague')
        await page.getByLabel(t('schedule.rules.horizon'), { exact: false }).fill('90')
        await page.getByLabel(t('schedule.rules.lead'), { exact: false }).fill('45')
        await page.getByRole('button', { name: t('schedule.rules.save'), exact: true }).click()
        await expect(page.getByRole('status').filter({ hasText: t('schedule.rules.saved') })).toHaveText(t('schedule.rules.saved'))
        const bufferRow = page.locator('li').filter({ hasText: 'Review Cut' })
        await bufferRow.getByLabel(t('schedule.buffers.before'), { exact: true }).fill('15')
        await bufferRow.getByLabel(t('schedule.buffers.after'), { exact: true }).fill('20')
        await bufferRow.getByRole('button', { name: t('common.save'), exact: true }).click()
        await expect(bufferRow.getByRole('button', { name: t('common.save'), exact: true })).toHaveCount(0)
        const stored = await request.get(`${apiUrl}/services/${service.id}`, { headers: owner.headers })
        expect(await stored.json()).toMatchObject({ duration_minutes: 60, buffer_before_minutes: 15, buffer_after_minutes: 20 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
        await page.screenshot({ path: info.outputPath('rules.png'), fullPage: true })

        await page.getByRole('tab', { name: t('schedule.tab.exceptions'), exact: true }).click()
        const blocks = page.getByRole('heading', { name: t('schedule.blocks.title'), exact: true }).locator('xpath=..')
        await blocks.getByLabel(t('schedule.exceptions.day'), { exact: true }).fill('2030-03-31')
        await blocks.getByLabel(t('schedule.start'), { exact: true }).fill('02:30')
        await blocks.getByLabel(t('schedule.end'), { exact: true }).fill('04:00')
        await blocks.getByRole('button', { name: t('schedule.blocks.add'), exact: true }).click()
        await expect(blocks.getByRole('alert')).toHaveText(t('schedule.error.nonexistentTime'))
        const unchanged = await request.get(`${apiUrl}/schedules/blocks?specialist_id=${owner.user.id}`, { headers: owner.headers })
        expect(await unchanged.json()).toEqual([])
        await blocks.getByLabel(t('schedule.start'), { exact: true }).fill('01:30')
        await blocks.getByLabel(t('schedule.reason'), { exact: true }).fill('DST review')
        await blocks.getByRole('button', { name: t('schedule.blocks.add'), exact: true }).click()
        const row = blocks.locator('li').filter({ hasText: 'DST review' })
        await expect(row).toContainText('01:30')
        await expect(row).toContainText('04:00')
        const exceptions = page.getByRole('heading', { name: t('schedule.exceptions.title'), exact: true }).locator('xpath=..')
        await exceptions.getByLabel(t('schedule.exceptions.day'), { exact: true }).fill('2030-04-01')
        await exceptions.getByRole('button', { name: t('schedule.exceptions.add'), exact: true }).click()
        await expect(exceptions.locator('li')).toContainText(t('schedule.exceptions.closedLabel'))
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
        await page.screenshot({ path: info.outputPath('exceptions.png'), fullPage: true })
        await row.getByRole('button', { name: t('common.delete'), exact: true }).click()
        await expect(row.getByRole('button', { name: t('schedule.confirmDelete'), exact: true })).toBeVisible()
        const stillThere = await request.get(`${apiUrl}/schedules/blocks?specialist_id=${owner.user.id}`, { headers: owner.headers })
        expect(await stillThere.json()).toHaveLength(1)
        await row.getByRole('button', { name: t('schedule.confirmDelete'), exact: true }).click()
        await expect(row).toHaveCount(0)
        await page.reload()
        await expect(monday.getByLabel(t('schedule.start'), { exact: true })).toHaveValue('09:00')
        await expect(monday.getByLabel(t('schedule.end'), { exact: true })).toHaveValue('18:00')
      })
    }
  }
}

test('date exceptions replace weekly windows and all schedule resources stay in scope', async ({ request }) => {
  const owner = await newOwner(request)
  const outsider = await newOwner(request)
  const employeeEmail = `${unique('sch-staff')}@example.com`
  const employee = await apiPost<{ generated_password: string; user_id: number }>(request, owner, '/employees/create-with-user', {
    full_name: 'Schedule Staff', email: employeeEmail, position: 'Stylist',
  })
  const staff = await apiLogin(request, employeeEmail, employee.generated_password)
  const day = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  const weekday = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7
  const policy = await request.put(`${apiUrl}/businesses/${owner.user.business_id}`, {
    headers: owner.headers, data: { timezone: 'UTC', booking_horizon_days: 90, booking_lead_time_minutes: 0 },
  })
  expect(policy.ok()).toBeTruthy()
  const settings = await request.put(`${apiUrl}/businesses/me/public-booking`, { headers: owner.headers, data: { is_enabled: true } })
  expect(settings.ok()).toBeTruthy()
  const slug = (await settings.json()).slug as string
  const service = await apiPost<{ id: number }>(request, owner, '/services/', {
    name: 'Schedule acceptance', duration_minutes: 60, price: 45, specialist_id: owner.user.id,
  })
  const window = await apiPost<{ id: number }>(request, owner, '/schedules/work', {
    specialist_id: owner.user.id, weekday, start_time: '09:00', end_time: '18:00',
  })
  const block = await apiPost<{ id: number }>(request, owner, '/schedules/blocks', {
    specialist_id: owner.user.id, start: `${day}T12:00:00Z`, end: `${day}T13:00:00Z`, reason: 'Lunch',
  })
  const exception = await apiPost<{ id: number }>(request, owner, '/schedules/exceptions', {
    specialist_id: owner.user.id, exception_date: day, is_closed: true,
  })
  const slots = async () => {
    const response = await request.get(`${apiUrl}/public/booking/${slug}/slots`, { params: {
      service_id: service.id, staff_id: owner.user.id, date_from: day, date_to: day,
    } })
    expect(response.ok(), await response.text()).toBeTruthy()
    const data = await response.json() as { days: { slots: { start: string }[] }[] }
    return data.days.flatMap(d => d.slots.map(s => s.start))
  }
  expect(await slots()).toEqual([])
  const open = await request.put(`${apiUrl}/schedules/exceptions/${exception.id}`, {
    headers: owner.headers, data: { is_closed: false, start_time: '14:00', end_time: '16:00' },
  })
  expect(open.ok(), await open.text()).toBeTruthy()
  expect(await slots()).toEqual([`${day}T14:00:00Z`, `${day}T14:15:00Z`, `${day}T14:30:00Z`, `${day}T14:45:00Z`, `${day}T15:00:00Z`])
  const removed = await request.delete(`${apiUrl}/schedules/exceptions/${exception.id}`, { headers: owner.headers })
  expect(removed.ok()).toBeTruthy()
  const restored = await slots()
  expect(restored[0]).toBe(`${day}T09:00:00Z`)
  expect(restored).not.toContain(`${day}T12:00:00Z`)
  const exception2 = await apiPost<{ id: number }>(request, owner, '/schedules/exceptions', {
    specialist_id: owner.user.id, exception_date: day, is_closed: true,
  })
  const resources = [
    { path: 'work', id: window.id, data: { weekday, start_time: '08:00', end_time: '17:00' } },
    { path: 'blocks', id: block.id, data: { start: `${day}T15:00:00Z`, end: `${day}T16:00:00Z` } },
    { path: 'exceptions', id: exception2.id, data: { exception_date: day, is_closed: true } },
  ]
  for (const session of [outsider, staff]) {
    for (const resource of resources) {
      const url = `${apiUrl}/schedules/${resource.path}`
      expect((await request.get(url, { headers: session.headers, params: { specialist_id: owner.user.id } })).status()).toBe(403)
      expect((await request.post(url, { headers: session.headers, data: { ...resource.data, specialist_id: owner.user.id } })).status()).toBe(403)
      expect((await request.put(`${url}/${resource.id}`, { headers: session.headers, data: resource.data })).status()).toBe(403)
      expect((await request.delete(`${url}/${resource.id}`, { headers: session.headers })).status()).toBe(403)
    }
  }
  const partial = await request.put(`${apiUrl}/schedules/work/${window.id}`, { headers: owner.headers, data: { start_time: '19:00' } })
  expect(partial.status()).toBe(422)
  const duplicate = await request.post(`${apiUrl}/schedules/exceptions`, { headers: owner.headers, data: { specialist_id: owner.user.id, exception_date: day, is_closed: true } })
  expect(duplicate.status()).toBe(409)
  const own = await request.get(`${apiUrl}/schedules/work`, { headers: staff.headers, params: { specialist_id: staff.user.id } })
  expect(own.ok()).toBeTruthy()
})


test('business loading failure offers retry without editable UTC fallback', async ({ page, request }) => {
  const owner = await newOwner(request)
  await openAs(page, owner, '/app/schedules')
  await page.route('**/businesses/me', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Unavailable' } }) }), { times: 1 })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText(translations['common.loadError'].en)
  await expect(page.getByRole('heading', { name: 'Monday', exact: true })).toHaveCount(0)
  await expect(page.getByText('UTC', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Monday', exact: true })).toBeVisible()
})
