import { expect, test } from '@playwright/test'
import { apiUrl, newOwner, openAs, stabilizeTrialDate } from './helpers'

test('account theme applies on the dashboard and follows the system when selected', async ({ page, request }) => {
  const owner = await newOwner(request)
  const saved = await request.put(`${apiUrl}/user-preferences/me`, {
    headers: owner.headers, data: { theme: 'dark' },
  })
  expect(saved.ok()).toBeTruthy()
  await page.emulateMedia({ colorScheme: 'light' })
  await openAs(page, owner)
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(22, 28, 25)')
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.goto('/settings')
  await page.getByRole('button', { name: 'System', exact: true }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(22, 28, 25)')
  await page.goto('/clients')
  await expect(page.locator('main .ui-card').filter({ has: page.locator('table') })).toHaveCSS('background-color', 'rgb(30, 39, 34)')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(247, 247, 243)')
})

for (const width of [1280, 375]) {
  for (const path of ['/clients', '/settings']) {
    test(`dark ${path.slice(1)} at ${width}px`, async ({ page, request }) => {
      const owner = await newOwner(request)
      const saved = await request.put(`${apiUrl}/user-preferences/me`, {
        headers: owner.headers, data: { theme: 'dark' },
      })
      expect(saved.ok()).toBeTruthy()
      await page.setViewportSize({ width, height: 900 })
      await stabilizeTrialDate(page)
      await openAs(page, owner, path)
      await expect(page.locator('html')).toHaveClass(/dark/)
      await page.waitForLoadState('networkidle')
      const trialText = page.locator('main > div[role="status"] > p')
      await expect(trialText).toBeVisible()
      await expect(trialText).toContainText('300 visits and 50 AI requests per day.')
      const trialStyle = await page.addStyleTag({ content: 'main > div[role="status"] > p { visibility: hidden !important; }' })
      try {
        await expect(page).toHaveScreenshot(`dark-${path.slice(1)}-${width}.png`, { fullPage: true })
      } finally {
        await trialStyle.evaluate(element => element.parentNode?.removeChild(element))
      }
    })
  }
}
