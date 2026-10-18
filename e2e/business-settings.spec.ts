import { test, expect } from '@playwright/test'
import { field, loginThroughForm, newOwner, openAs, waitForFormData } from './helpers'

test('owner without a business creates one, then renames it', async ({ page, request }) => {
  const owner = await newOwner(request, { business: false })
  await openAs(page, owner, '/business')
  await expect(page.getByText("You don't have a business yet.")).toBeVisible()

  await page.getByRole('button', { name: 'Create Business' }).first().click()
  // empty name - the browser won't send it
  await page.getByRole('button', { name: 'Create Business' }).click()
  await expect(page.getByRole('button', { name: 'Create Business' })).toBeVisible()

  await field(page, /^Business Name/).fill('Studio Linden')
  await field(page, /^Business Type/).selectOption('salon')
  await page.getByRole('button', { name: 'Create Business' }).click()
  await expect(page.getByText('Studio Linden')).toBeVisible()

  await page.getByRole('button', { name: 'Edit Business' }).click()
  await waitForFormData(page)
  await expect(field(page, /^Business Name/)).toHaveValue('Studio Linden')
  await field(page, /^Business Name/).fill('Studio Linden & Co')
  await page.getByRole('button', { name: 'Update Business' }).click()
  await expect(page.getByText('Studio Linden & Co')).toBeVisible()

  // the business shows up in the menu now that the user has one
  await page.reload()
  await expect(page.getByRole('link', { name: 'Employees' })).toBeVisible()
})

test('language switch in settings changes the UI and sticks to the account', async ({ page, request, browser }) => {
  const owner = await newOwner(request)
  await openAs(page, owner, '/settings')
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()

  const saved = page.waitForResponse((r) => r.url().includes('/user-preferences/me') && r.request().method() === 'PUT')
  await page.getByRole('button', { name: /^Русский/ }).click()
  expect((await saved).ok()).toBe(true)
  await expect(page.getByRole('heading', { name: 'Настройки', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Клиенты' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Настройки', level: 1 })).toBeVisible()

  // a fresh browser (nothing in localStorage) picks the language up from the account
  const other = await browser.newContext({ locale: 'en-GB' })
  const fresh = await other.newPage()
  await loginThroughForm(fresh, owner.email, owner.password)
  await expect(fresh.getByRole('link', { name: 'Клиенты' })).toBeVisible()
  await other.close()

  await page.getByRole('button', { name: /^English/ }).click()
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
})

test('language picked on the login page applies right away', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: /^EN/ }).click()
  await page.getByRole('button', { name: 'CZ', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Přihlásit se' })).toBeVisible()
  await page.getByRole('button', { name: /^CZ/ }).click()
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('currency picked in settings is used for amounts', async ({ page, request }) => {
  const owner = await newOwner(request)
  await openAs(page, owner, '/settings')
  await page.getByRole('button', { name: /CZK/ }).click()
  await page.goto('/finance')
  await expect(page.getByText(/Kč/).first()).toBeVisible()
})
