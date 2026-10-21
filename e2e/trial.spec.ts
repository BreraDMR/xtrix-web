import { test, expect } from '@playwright/test'
import { openAs, seedUser } from './helpers'

test.describe('Trial lifecycle and expiration', () => {
  test('solo specialist sees active trial banner with days remaining and CTA', async ({ page }) => {
    await openAs(page, seedUser('solo'), '/app/subscription')

    // Verify Subscription Management page loaded
    await expect(page.getByRole('heading', { name: 'Subscription Management', level: 1 })).toBeVisible()

    // Active trial indicators
    await expect(page.getByText(/Trial period/i).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Choose Plan' })).toBeVisible()

    // Entitlements and usage block is visible
    await expect(page.getByText('Plan Usage and Entitlements')).toBeVisible()
    await expect(page.getByText('CRM: Visits this month')).toBeVisible()
    await expect(page.getByText('AI Sasha: Daily Requests')).toBeVisible()
  })

  test('expired trial state preserves salon data and prompts to subscribe', async ({ page }) => {
    // Intercept trial status to simulate expiration via fixture without waiting 7 days
    await page.route('**/subscriptions/trial/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          is_trial_active: false,
          is_trial: true,
          trial_start: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          trial_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          has_access: false,
        }),
      })
    })

    await openAs(page, seedUser('solo'), '/app/subscription')

    // Expired trial banner shown with preserved data explanation
    await expect(page.getByText(/Trial ended. Your salon data is preserved/i)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Choose Plan' })).toBeVisible()
  })

  test('paid business owner does not see trial banner', async ({ page }) => {
    await openAs(page, seedUser('owner_a'), '/app/subscription')

    // Paid subscriber should see current plan without trial banner
    await expect(page.getByRole('heading', { name: 'Current Subscription' })).toBeVisible()
    await expect(page.getByText(/Trial ended. Your salon data is preserved/i)).not.toBeVisible()
  })
})
