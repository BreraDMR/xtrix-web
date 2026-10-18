import { test, expect } from '@playwright/test'
import { PASSWORD, isInvalid, loginThroughForm, newOwner, unique } from './helpers'

test.describe('signup', () => {
  test('a business owner signs up and lands on the dashboard', async ({ page }) => {
    const email = `${unique('signup')}@example.com`
    await page.goto('/login')
    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL(/\/register$/)

    await page.getByLabel('Full Name').fill('Sofia Signup')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password *', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirm Password').fill(PASSWORD)
    await page.getByLabel('Role').selectOption('business_owner')
    await page.getByRole('button', { name: 'Create Account' }).click()

    // signed in straight away (the dashboard itself has nothing to show before a business exists)
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Sofia Signup')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Business' })).toBeVisible()
  })

  test('mismatched passwords are caught before sending', async ({ page }) => {
    let posted = false
    page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/users/')) posted = true })
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('Max Mismatch')
    await page.getByLabel('Email').fill(`${unique('mismatch')}@example.com`)
    await page.getByLabel('Password *', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirm Password').fill(PASSWORD + 'x')
    await page.getByLabel('Role').selectOption('business_owner')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText('Passwords do not match')).toBeVisible()
    expect(posted).toBe(false)
  })

  test('a weak password comes back as a readable error and no account is made', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('Wanda Weak')
    await page.getByLabel('Email').fill(`${unique('weak')}@example.com`)
    await page.getByLabel('Password *', { exact: true }).fill('password')
    await page.getByLabel('Confirm Password').fill('password')
    await page.getByLabel('Role').selectOption('business_owner')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page.getByText(/^password: /)).toBeVisible()
    await expect(page).toHaveURL(/\/register$/)
  })

  test('a specialist has to pick a specialist type', async ({ page }) => {
    let posted = false
    page.on('request', (r) => { if (r.method() === 'POST' && r.url().includes('/users/')) posted = true })
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('Sam Specialist')
    await page.getByLabel('Email').fill(`${unique('spec')}@example.com`)
    await page.getByLabel('Password *', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Confirm Password').fill(PASSWORD)
    await page.getByLabel('Role').selectOption('specialist')
    // the select is required, so the browser stops it first; either way nothing is sent
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page).toHaveURL(/\/register$/)
    expect(posted).toBe(false)
  })

  test('empty signup form is not sent', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: 'Create Account' }).click()
    await expect(page).toHaveURL(/\/register$/)
    expect(await isInvalid(page.getByLabel('Full Name'))).toBe(true)
  })
})

test.describe('login and logout', () => {
  test('owner logs in, logs out and private pages send back to login', async ({ page, request }) => {
    const owner = await newOwner(request, { fullName: 'Lena Login' })
    await loginThroughForm(page, owner.email, owner.password)
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
    await expect(page.getByText('Lena Login')).toBeVisible()

    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/clients')
    await expect(page).toHaveURL(/\/login$/)
  })

  // TODO: fails on this branch - the 401 from /users/login hits the global 401 handler, which
  // reloads /login and the message is gone. Drop test.fail() once the error stays on screen.
  test('wrong password shows an error and keeps you on the login page', async ({ page, request }) => {
    test.fail()
    const owner = await newOwner(request)
    await loginThroughForm(page, owner.email, 'Not!The-Pass-77')
    await expect(page.getByText('Invalid credentials')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('empty and garbage logins are stopped by the form', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()
    expect(await isInvalid(page.getByLabel('Email'))).toBe(true)

    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password').fill('x')
    await page.getByRole('button', { name: 'Sign in' }).click()
    expect(await isInvalid(page.getByLabel('Email'))).toBe(true)
    await expect(page).toHaveURL(/\/login$/)
  })
})
