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
  // Test legacy subscription redirect with Stripe return parameters
  await page.goto('/subscription?success=true&session_id=cs_test_sample_123')
  await expect(page).toHaveURL(/\/app\/subscription\?success=true&session_id=cs_test_sample_123/)

  // Test legacy clients route redirect
  await page.goto('/clients?tab=archived')
  await expect(page).toHaveURL(/\/app\/clients\?tab=archived/)
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
