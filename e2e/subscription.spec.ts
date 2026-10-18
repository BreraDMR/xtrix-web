import { test, expect } from '@playwright/test'
import { openAs, seedUser } from './helpers'

test('solo specialist sees the trial and the plans on the billing page', async ({ page }) => {
  await openAs(page, seedUser('solo'))
  await page.getByRole('link', { name: 'Billing' }).click()
  await expect(page).toHaveURL(/\/subscription$/)
  await expect(page.getByRole('heading', { name: 'Subscription Management', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Current Subscription' })).toBeVisible()
  await expect(page.getByText('Trial period is active')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Available Plans' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Subscribe' }).first()).toBeVisible()
})

test('business owner sees their plan on the billing page', async ({ page }) => {
  await openAs(page, seedUser('owner_a'), '/subscription')
  await expect(page.getByRole('heading', { name: 'Current Subscription' })).toBeVisible()
})
