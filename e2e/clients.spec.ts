import { test, expect, type Page } from '@playwright/test'
import { newOwner, openAs, waitForFormData, type Session } from './helpers'

async function openNewClientForm(page: Page, owner: Session) {
  await openAs(page, owner, '/clients')
  await expect(page.getByRole('heading', { name: 'Clients', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Add Client' }).click()
}

test('create a client, then edit it', async ({ page, request }) => {
  const owner = await newOwner(request)
  await openNewClientForm(page, owner)
  await page.getByLabel(/^Full Name/).fill('Clara Novak')
  await page.getByLabel(/^Phone/).fill('+420777111222')
  await page.getByLabel(/^Email/).fill('clara.novak@example.com')
  await page.getByLabel(/^Gender/).selectOption('female')
  await page.getByRole('button', { name: 'Create Client' }).click()

  const row = page.getByRole('row').filter({ hasText: 'Clara Novak' })
  await expect(row).toBeVisible()
  await expect(row).toContainText('clara.novak@example.com')

  await row.getByRole('button', { name: 'Edit' }).click()
  await waitForFormData(page)
  await expect(page.getByLabel(/^Full Name/)).toHaveValue('Clara Novak')
  await page.getByLabel(/^Full Name/).fill('Clara Novakova')
  await page.getByRole('button', { name: 'Update Client' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Clara Novakova' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('row').filter({ hasText: 'Clara Novakova' })).toBeVisible()
})

test('second client with the same phone is refused with a message', async ({ page, request }) => {
  const owner = await newOwner(request)
  await openNewClientForm(page, owner)
  await page.getByLabel(/^Full Name/).fill('Petr First')
  await page.getByLabel(/^Phone/).fill('+420777333444')
  await page.getByRole('button', { name: 'Create Client' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Petr First' })).toBeVisible()

  await page.getByRole('button', { name: 'Add Client' }).click()
  await page.getByLabel(/^Full Name/).fill('Petr Second')
  await page.getByLabel(/^Phone/).fill('+420777333444')
  await page.getByRole('button', { name: 'Create Client' }).click()
  await expect(page.getByText('This client is already in your list')).toBeVisible()
  // still in the form, nothing new in the list
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Petr Second' })).toHaveCount(0)
})

test('empty and garbage input is caught in the form', async ({ page, request }) => {
  const owner = await newOwner(request)
  let posted = 0
  page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/clients/')) posted += 1 })
  await openNewClientForm(page, owner)

  await page.getByRole('button', { name: 'Create Client' }).click()
  await expect(page.getByText('Full Name is required')).toBeVisible()

  await page.getByLabel(/^Full Name/).fill('   ')
  await page.getByRole('button', { name: 'Create Client' }).click()
  await expect(page.getByText('Full Name is required')).toBeVisible()

  await page.getByLabel(/^Full Name/).fill('Gary Garbage')
  await page.getByLabel(/^Phone/).fill('call me maybe')
  await page.getByRole('button', { name: 'Create Client' }).click()
  await expect(page.getByText('Invalid phone number format')).toBeVisible()
  expect(posted).toBe(0)
})

test('markup in a name is shown as text, never run', async ({ page, request }) => {
  const owner = await newOwner(request)
  const name = '<img src=x onerror=alert(1)>Mallory'
  let dialogs = 0
  page.on('dialog', async (d) => { dialogs += 1; await d.dismiss() })
  await openNewClientForm(page, owner)
  await page.getByLabel(/^Full Name/).fill(name)
  await page.getByRole('button', { name: 'Create Client' }).click()
  await expect(page.getByText(name)).toBeVisible()
  await expect(page.locator('img[src="x"]')).toHaveCount(0)
  expect(dialogs).toBe(0)
})
