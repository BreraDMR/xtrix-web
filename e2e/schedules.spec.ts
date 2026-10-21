import { test, expect } from '@playwright/test'
import { apiLogin, apiPost, apiUrl, newOwner, openAs, unique } from './helpers'

test('work windows stop at the day boundary and blocks convert DST wall time', async ({ page, request }) => {
  const owner = await newOwner(request)
  const businessId = owner.user.business_id
  expect(businessId).toBeTruthy()
  const timezone = await request.put(`${apiUrl}/businesses/${businessId}`, {
    headers: owner.headers,
    data: { timezone: 'Europe/Prague' },
  })
  expect(timezone.ok(), await timezone.text()).toBeTruthy()

  await openAs(page, owner, '/app/schedules')
  await expect(page.getByRole('heading', { name: 'Work schedule' })).toBeVisible()
  await expect(page.getByText('Europe/Prague')).toBeVisible()

  const monday = page.getByRole('heading', { name: 'Monday', exact: true }).locator('xpath=../..')
  await monday.getByRole('button', { name: 'Add hours' }).click()
  await monday.getByLabel('Start').fill('18:00')
  await monday.getByLabel('End').fill('00:00')
  await monday.getByRole('button', { name: 'Save' }).click()
  // 00:00 is the next day, not an earlier end time - the API says so instead of dropping the window
  await expect(monday.getByRole('alert')).toContainText('The end must be at least an hour after the start.')

  await monday.getByLabel('End').fill('23:00')
  await monday.getByRole('button', { name: 'Save' }).click()
  await expect(monday.getByLabel('Start')).toHaveValue('18:00')
  await expect(monday.getByLabel('End')).toHaveValue('23:00')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Monday', exact: true }).locator('xpath=../..').getByLabel('Start')).toHaveValue('18:00')
  await expect(page.getByRole('heading', { name: 'Monday', exact: true }).locator('xpath=../..').getByLabel('End')).toHaveValue('23:00')

  await page.getByRole('tab', { name: 'Days off and blocks' }).click()
  const blocksCard = page.getByRole('heading', { name: 'Breaks and personal blocks' }).locator('xpath=..')
  // Europe/Prague jumps from 01:59 CET to 03:00 CEST on 31 March 2030
  await blocksCard.getByLabel('Date').fill('2030-03-31')
  await blocksCard.getByLabel('Start').fill('01:30')
  await blocksCard.getByLabel('End').fill('04:00')
  await blocksCard.getByLabel('Note').fill('DST shift')
  await blocksCard.getByRole('button', { name: 'Add block' }).click()
  await expect(blocksCard.getByText('DST shift')).toBeVisible()
  await expect(blocksCard.locator('li').filter({ hasText: 'DST shift' })).toContainText('01:30')
  await expect(blocksCard.locator('li').filter({ hasText: 'DST shift' })).toContainText('04:00')

  const blocksResponse = await request.get(`${apiUrl}/schedules/blocks?specialist_id=${owner.user.id}`, {
    headers: owner.headers,
  })
  expect(blocksResponse.ok(), await blocksResponse.text()).toBeTruthy()
  const blocks = (await blocksResponse.json()) as { start: string; end: string; reason?: string }[]
  const dst = blocks.find((block) => block.reason === 'DST shift')
  expect(dst).toBeTruthy()
  expect(Date.parse(dst!.start)).toBe(Date.parse('2030-03-31T00:30:00Z'))
  expect(Date.parse(dst!.end)).toBe(Date.parse('2030-03-31T02:00:00Z'))

  // an overnight block keeps both dates and is not pulled onto a single day
  const overnight = await apiPost(request, owner, '/schedules/blocks', {
    specialist_id: owner.user.id,
    start: '2030-04-01T21:00:00Z',
    end: '2030-04-01T23:00:00Z',
    reason: 'Overnight',
  })
  expect(overnight).toBeTruthy()
  await page.reload()
  await page.getByRole('tab', { name: 'Days off and blocks' }).click()
  const overnightRow = page.locator('li').filter({ hasText: 'Overnight' })
  await expect(overnightRow).toContainText('23:00')
  await expect(overnightRow).toContainText('01:00')
})

test('staff can open their own schedule and cannot touch another master', async ({ page, request }) => {
  const owner = await newOwner(request)
  const email = `${unique('staff')}@example.com`
  const created = await apiPost<{ generated_password: string; user_id: number }>(
    request,
    owner,
    '/employees/create-with-user',
    { full_name: 'Sam Staff', email, position: 'Stylist' },
  )
  const staff = await apiLogin(request, email, created.generated_password)
  await request.put(`${apiUrl}/user-preferences/me`, { headers: staff.headers, data: { language: 'en' } })

  await apiPost(request, owner, '/schedules/work', {
    specialist_id: owner.user.id,
    weekday: 1,
    start_time: '18:00',
    end_time: '23:00',
  })
  const windowsResponse = await request.get(`${apiUrl}/schedules/work?specialist_id=${owner.user.id}`, {
    headers: owner.headers,
  })
  expect(windowsResponse.ok(), await windowsResponse.text()).toBeTruthy()
  const windows = (await windowsResponse.json()) as { id: number }[]
  const ownerWindow = windows[0]
  expect(ownerWindow).toBeTruthy()

  // the UI never offers another master, and the API refuses even if the id is guessed
  const foreignList = await request.get(`${apiUrl}/schedules/work?specialist_id=${owner.user.id}`, {
    headers: staff.headers,
  })
  expect(foreignList.status()).toBe(403)
  const foreignUpdate = await request.put(`${apiUrl}/schedules/work/${ownerWindow.id}`, {
    headers: staff.headers,
    data: { start_time: '09:00', end_time: '10:00' },
  })
  expect(foreignUpdate.status()).toBe(403)
  const foreignCreate = await request.post(`${apiUrl}/schedules/work`, {
    headers: staff.headers,
    data: { specialist_id: owner.user.id, weekday: 2, start_time: '09:00', end_time: '10:00' },
  })
  expect(foreignCreate.status()).toBe(403)

  const own = await request.get(`${apiUrl}/schedules/work?specialist_id=${staff.user.id}`, {
    headers: staff.headers,
  })
  expect(own.ok(), await own.text()).toBeTruthy()

  await openAs(page, { email, password: created.generated_password }, '/app/schedules')
  await expect(page.getByRole('heading', { name: 'Work schedule' })).toBeVisible()
  const master = page.getByLabel('Master')
  await expect(master).toBeDisabled()
  await expect(master.locator('option')).toHaveCount(1)
  await expect(master.locator('option')).toHaveText('Sam Staff')
})
