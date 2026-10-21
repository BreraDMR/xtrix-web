import { test, expect, type APIRequestContext } from '@playwright/test'
import {
  PASSWORD,
  apiLogin,
  apiPost,
  apiUrl,
  field,
  newOwner,
  openAs,
  unique,
  type Session,
} from './helpers'

async function newSolo(request: APIRequestContext): Promise<Session> {
  const email = `${unique('solo')}@example.com`
  const signup = await request.post(`${apiUrl}/users/`, {
    data: { email, full_name: 'Solo Sam', password: PASSWORD, role: 'specialist' },
  })
  expect(signup.ok(), await signup.text()).toBeTruthy()
  const session = await apiLogin(request, email, PASSWORD)
  const language = await request.put(`${apiUrl}/user-preferences/me`, {
    headers: session.headers,
    data: { language: 'en' },
  })
  expect(language.ok(), await language.text()).toBeTruthy()
  return session
}

test('new owner skips the welcome, resumes after reload and makes the first visit', async ({ page, request }) => {
  const owner = await newOwner(request, { business: false })
  await openAs(page, owner, '/app')

  await expect(page.getByRole('heading', { name: 'Welcome to Xtrix' })).toBeVisible()
  await expect(page.getByText('Create your business, add the first service and set working hours.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start setup' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Getting started' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Create your business' })).toBeVisible()

  // skipping does not complete anything, it only gets the welcome out of the way
  await page.getByRole('button', { name: 'Maybe later' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome to Xtrix' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Getting started' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create business' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome to Xtrix' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Create business' })).toBeVisible()

  await page.getByRole('link', { name: 'Create business' }).click()
  await expect(page).toHaveURL(/\/app\/business$/)
  await expect(page.getByText("You don't have a business yet.")).toBeVisible()
  await page.getByRole('button', { name: 'Create Business' }).first().click()
  await field(page, /^Business Name/).fill('Onboarding Salon')
  await field(page, /^Business Type/).selectOption('salon')
  await page.getByRole('button', { name: 'Create Business' }).click()
  await expect(page.getByRole('main').getByText('Onboarding Salon', { exact: true })).toBeVisible()

  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Welcome to Xtrix' })).toHaveCount(0)
  // the quick tour follows the welcome once the business exists, skipping it must not block setup
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Add service' })).toBeVisible()
  await expect(page.locator('ol').getByText('Add your first service', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Add service' }).click()
  await field(page, /^Service Name/).fill('First Cut')
  await field(page, /^Price/).fill('40')
  await page.getByRole('button', { name: 'Create Service' }).click()

  // the business, the service and the owner working as a master are done; the schedule is next
  await expect(page.getByRole('link', { name: 'Set schedule' })).toBeVisible()
  await expect(page.locator('ol').getByText('Set working hours', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome to Xtrix' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Getting started' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Set schedule' })).toBeVisible()
  await expect(page.locator('ol').getByText('Set working hours', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Set schedule' }).click()
  await expect(page).toHaveURL(/\/app\/schedules$/)
  await expect(page.getByRole('heading', { name: 'Work schedule' })).toBeVisible()

  // a fresh login is not a fresh start: the next step is still the schedule
  await page.getByRole('button', { name: 'Logout' }).click()
  await openAs(page, owner, '/app')
  await expect(page.getByRole('heading', { name: 'Welcome to Xtrix' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Set schedule' })).toBeVisible()
  await expect(page.locator('ol').getByText('Set working hours', { exact: true })).toBeVisible()

  // and the new business can already take its first visit
  await apiPost(request, owner, '/clients/', { full_name: 'Nora New', contact_phone: '+420777123123' })
  await page.goto('/visits')
  await page.getByRole('button', { name: 'New Visit' }).click()
  await field(page, /^Client/).selectOption({ label: 'Nora New' })
  await field(page, /^Start Date & Time/).fill('2030-03-05T10:00')
  await field(page, /^End Date & Time/).fill('2030-03-05T11:00')
  await field(page, /^Service Name/).fill('First Cut')
  await field(page, /^Price/).fill('40')
  await page.getByRole('button', { name: 'Create Visit' }).click()
  const row = page.getByRole('row').filter({ hasText: 'Nora New' })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('First Cut')
})

test('solo specialist has no business step and can hide the checklist for good', async ({ page, request }) => {
  const solo = await newSolo(request)
  await openAs(page, solo, '/app')

  await expect(page.getByRole('heading', { name: 'Welcome to Xtrix' })).toBeVisible()
  await expect(page.getByText('Start with the first service. The workspace is already yours')).toBeVisible()

  await page.getByRole('button', { name: 'Maybe later' }).click()
  await expect(page.getByRole('heading', { name: 'Getting started' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Add service' })).toBeVisible()
  await expect(page.locator('ol').getByText('Add your first service', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Set schedule' })).toBeVisible()
  await expect(page.locator('ol').getByText('Set working hours', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Create business' })).toHaveCount(0)
  await expect(page.getByText('Turn on online booking')).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome to Xtrix' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Add service' })).toBeVisible()
  await expect(page.locator('ol').getByText('Add your first service', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Add service' }).click()
  await expect(page).toHaveURL(/\/app\/services$/)
  await page.goto('/app')
  await expect(page.getByRole('link', { name: 'Add service' })).toBeVisible()
  await expect(page.locator('ol').getByText('Add your first service', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Hide checklist' }).click()
  await expect(page.getByRole('heading', { name: 'Getting started' })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Getting started' })).toHaveCount(0)
})

test('staff member sees only a pointer to the workspace and keeps it dismissed', async ({ page, request }) => {
  const owner = await newOwner(request)
  const email = `${unique('staff')}@example.com`
  const created = await apiPost<{ generated_password: string }>(request, owner, '/employees/create-with-user', {
    full_name: 'Sam Staff',
    email,
    position: 'Stylist',
  })
  const staff = await apiLogin(request, email, created.generated_password)
  await request.put(`${apiUrl}/user-preferences/me`, { headers: staff.headers, data: { language: 'en' } })

  await openAs(page, { email, password: created.generated_password }, '/app')
  await expect(page.getByRole('heading', { name: 'Welcome to the team workspace' })).toBeVisible()
  await expect(page.getByText('The owner has set up the business.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Getting started' })).toHaveCount(0)

  const dismissed = page.waitForResponse((r) => r.url().includes('/onboarding/me') && r.request().method() === 'PATCH')
  await page.getByRole('link', { name: 'Open workspace' }).click()
  expect((await dismissed).ok()).toBeTruthy()
  await expect(page).toHaveURL(/\/app\/calendar$/)

  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Welcome to the team workspace' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Getting started' })).toHaveCount(0)
})
