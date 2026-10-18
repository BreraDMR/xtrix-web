import { test, expect } from '@playwright/test'
import { isInvalid, loginThroughForm, newOwner, openAs, unique } from './helpers'

test('owner adds an employee with a login, the employee can sign in with the shown password', async ({ page, request, browser }) => {
  const owner = await newOwner(request)
  const email = `${unique('staff')}@example.com`
  await openAs(page, owner, '/employees')
  await expect(page.getByRole('heading', { name: 'Employees', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Add Employee' }).click()
  await page.getByLabel('Full Name').fill('Erik Employee')
  await page.getByLabel('Email').fill(email)
  await page.getByPlaceholder('e.g., Massage Therapist, Administrator').fill('Barber')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Employee Created Successfully!')).toBeVisible()
  const password = await page.getByText('Generated Password:').locator('..').getByRole('textbox').inputValue()
  expect(password.length).toBeGreaterThanOrEqual(8)
  await page.getByRole('button', { name: 'Close' }).click()

  const row = page.getByRole('row').filter({ hasText: 'Erik Employee' })
  await expect(row).toBeVisible()
  await expect(row).toContainText('Barber')

  const other = await browser.newContext()
  const staffPage = await other.newPage()
  await loginThroughForm(staffPage, email, password)
  await expect(staffPage.getByRole('button', { name: 'Logout' })).toBeVisible()
  await expect(staffPage.getByText('Erik Employee')).toBeVisible()
  await expect(staffPage.getByRole('link', { name: 'My Salary' })).toBeVisible()
  await other.close()
})

test('employee form wants a name and an email or phone', async ({ page, request }) => {
  const owner = await newOwner(request)
  let posted = 0
  page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/employees/')) posted += 1 })
  await openAs(page, owner, '/employees')
  await page.getByRole('button', { name: 'Add Employee' }).click()

  await page.getByRole('button', { name: 'Save' }).click()
  expect(await isInvalid(page.getByLabel('Full Name'))).toBe(true)

  await page.getByLabel('Full Name').fill('Nora Nocontact')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('alert')).toContainText('At least one of Email or Phone is required')

  await page.getByLabel('Phone').fill('not a phone')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('alert')).toContainText('Invalid phone number format')
  expect(posted).toBe(0)
})
