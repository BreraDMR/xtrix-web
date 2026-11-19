import { test, expect } from '@playwright/test'
import { openAs, seedUser } from './helpers'

test('guest visits public landing at / and sees marketing presentation and CTAs', async ({ page }) => {
  await page.goto('/')
  // Brand logo points to public home
  const publicLogo = page.locator('header a[aria-label="Xtrix"]')
  await expect(publicLogo).toBeVisible()
  await expect(publicLogo).toHaveAttribute('href', '/')

  // Marketing sections are visible
  await expect(page.locator('#features')).toBeVisible()
  await expect(page.locator('#tour')).toBeVisible()
  await expect(page.locator('#faq')).toBeVisible()
  await expect(page.locator('#contact')).toBeVisible()

  // Register and login CTA links
  const registerCta = page.getByRole('link', { name: /try for free|попробовать бесплатно|vyzkoušet zdarma/i }).first()
  await expect(registerCta).toBeVisible()
  await expect(registerCta).toHaveAttribute('href', '/register')

  const loginCta = page.getByRole('link', { name: /log in|войти|přihlásit se/i }).first()
  await expect(loginCta).toBeVisible()
  await expect(loginCta).toHaveAttribute('href', '/login')
})

test('legacy CRM URLs redirect to /app/... preserving query parameters and session_id', async ({ page }) => {
  const owner = seedUser('owner_a')
  await openAs(page, owner, '/app')

  // Test legacy subscription redirect with Stripe return parameters
  await page.goto('/subscription?success=true&session_id=cs_test_sample_123')
  await expect(page).toHaveURL(/\/app\/subscription\?success=true&session_id=cs_test_sample_123/)

  // Test legacy clients route redirect with a filter the page keeps
  await page.goto('/clients?q=archived')
  await expect(page).toHaveURL(/\/app\/clients\?q=archived/)
})

test('authenticated user sees open CRM CTA and workspace brand links to /app', async ({ page }) => {
  const owner = seedUser('owner_a')
  await openAs(page, owner, '/app')

  // In CRM sidebar, brand link points to /app
  const sidebarBrand = page.locator('#workspace-navigation .crm-brand a')
  await expect(sidebarBrand).toBeVisible()
  await expect(sidebarBrand).toHaveAttribute('href', '/app')

  // Visiting public landing while authenticated retains access and shows Open CRM CTA
  await page.goto('/')
  const openCrmLink = page.getByRole('link', { name: /open crm|открыть crm|otevřít crm/i }).first()
  await expect(openCrmLink).toBeVisible()
  await expect(openCrmLink).toHaveAttribute('href', '/app')
})

test('unhandled routes render clean 404 page without infinite redirects', async ({ page }) => {
  await page.goto('/non-existent-subpath-test-404')
  await expect(page.getByText('404')).toBeVisible()
  const homeLink = page.getByRole('link', { name: /go to homepage|на главную страницу|na hlavní stránku/i })
  await expect(homeLink).toBeVisible()
  await expect(homeLink).toHaveAttribute('href', '/')
})

test('all legacy bookmarks retain query and fragment through the guest login guard', async ({ page }) => {
  for (const path of ['clients', 'visits', 'calendar', 'services', 'profile', 'employees',
    'employees/123/salary', 'my-salary', 'business', 'inventory', 'finance', 'analytics',
    'loyalty', 'subscription', 'settings']) {
    await page.goto(`/${path}?source=old%20bookmark#saved-section`)
    await expect.poll(() => new URL(page.url()).pathname).toBe('/login')
    expect(new URL(page.url()).searchParams.get('returnTo')).toBe(`/app/${path}?source=old%20bookmark#saved-section`)
  }
  await page.goto('/app')
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fapp$/)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
})

test('legacy CheckoutReturn survives login and verifies the exact session without claiming payment', async ({ page }) => {
  const path = '/app/subscription?success=true&session_id=cs_test_site11#receipt'
  await page.goto('/subscription?success=true&session_id=cs_test_site11#receipt')
  await expect.poll(() => new URL(page.url()).searchParams.get('returnTo')).toBe(path)
  const verification = page.waitForRequest(request => request.url().endsWith('/subscriptions/checkout/session/cs_test_site11'))
  const owner = seedUser('owner_a')
  await page.getByLabel('Email').fill(owner.email)
  await page.getByLabel('Password').fill(owner.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash).toBe(path)
  expect((await verification).method()).toBe('GET')
  await expect(page.getByText('Could not verify the payment. Please try again.', { exact: true })).toBeVisible()
  await expect(page.getByText('Your paid subscription is active.', { exact: true })).toHaveCount(0)
})

test('public account links open real pages and unsafe returnTo stays in this workspace', async ({ page }) => {
  for (const href of ['/register', '/login', '/visitor/visits']) {
    await page.goto('/')
    await page.locator(`footer a[href="${href}"]`).click()
    await expect(page.locator('form')).toBeVisible()
    await expect(page).toHaveURL(href === '/visitor/visits' ? /\/visitor\/login\?next=/ : new RegExp(href + '$'))
  }
  await page.goto('/login?returnTo=%2F%2Fescape.invalid%2Foutside')
  const owner = seedUser('owner_a')
  // Keep this form's unsafe returnTo when signing in.
  await page.getByLabel('Email').fill(owner.email)
  await page.getByLabel('Password').fill(owner.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(/\/app$/)
  await page.goto('/unknown-authenticated-site11')
  await page.getByRole('link', { name: 'Go to CRM Workspace', exact: true }).click()
  await expect(page).toHaveURL(/\/app$/)
  await page.reload()
  await expect(page.locator('#workspace-navigation .crm-brand a')).toHaveAttribute('href', '/app')
})
