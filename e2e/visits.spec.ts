import { test, expect, type Page } from '@playwright/test'
import { apiPost, field, newOwner, openAs } from './helpers'

// far in the future, so "today" never gets in the way
const START = '2030-03-04T10:00'
const END = '2030-03-04T11:00'

async function fillVisit(page: Page, client: string, start: string, end?: string) {
  await page.getByRole('button', { name: 'New Visit' }).click()
  await field(page, /^Client/).selectOption({ label: client })
  await field(page, /^Start Date & Time/).fill(start)
  if (end) await field(page, /^End Date & Time/).fill(end)
}

test('create a visit, then the same slot again is refused (409)', async ({ page, request }) => {
  const owner = await newOwner(request)
  await apiPost(request, owner, '/clients/', { full_name: 'Vera Visit', contact_phone: '+420777555666' })
  await openAs(page, owner, '/visits')
  await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()

  await fillVisit(page, 'Vera Visit', START, END)
  await field(page, /^Service Name/).fill('Haircut')
  await field(page, /^Price/).fill('45')
  await page.getByRole('button', { name: 'Create Visit' }).click()

  const row = page.getByRole('row').filter({ hasText: 'Vera Visit' })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('Mar 4, 2030')
  await expect(row).toContainText('Haircut')

  // same specialist, overlapping time
  const conflict = page.waitForResponse((r) => r.url().endsWith('/visits/') && r.request().method() === 'POST')
  await fillVisit(page, 'Vera Visit', '2030-03-04T10:30', '2030-03-04T11:30')
  await page.getByRole('button', { name: 'Create Visit' }).click()
  expect((await conflict).status()).toBe(409)
  await expect(page.getByRole('alert')).toContainText('This time is already booked for the specialist')

  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Vera Visit' })).toHaveCount(1)
})

test('visit form catches a missing client and an end before the start', async ({ page, request }) => {
  const owner = await newOwner(request)
  await apiPost(request, owner, '/clients/', { full_name: 'Ivan Input', contact_phone: '+420777777888' })
  let posted = 0
  page.on('request', (r) => { if (r.method() === 'POST' && r.url().endsWith('/visits/')) posted += 1 })
  await openAs(page, owner, '/visits')

  await page.getByRole('button', { name: 'New Visit' }).click()
  await page.getByRole('button', { name: 'Create Visit' }).click()
  await expect(page.getByRole('alert')).toContainText('Select client...')

  await field(page, /^Client/).selectOption({ label: 'Ivan Input' })
  await field(page, /^Start Date & Time/).fill(START)
  await field(page, /^End Date & Time/).fill('2030-03-04T09:00')
  await page.getByRole('button', { name: 'Create Visit' }).click()
  await expect(page.getByRole('alert')).toContainText('End time must be after start time')

  // a negative price doesn't get past the browser (min=0)
  await field(page, /^End Date & Time/).fill(END)
  await field(page, /^Price/).fill('-50')
  await page.getByRole('button', { name: 'Create Visit' }).click()
  await expect(page.getByRole('button', { name: 'Create Visit' })).toBeVisible()
  expect(posted).toBe(0)
})
