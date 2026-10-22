import { expect, test } from '@playwright/test'

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} ${theme}: authentication pages keep accessible forms and a usable language menu`, async ({ page }) => {
      await page.addInitScript(value => localStorage.setItem('theme', value), theme)
      await page.goto('/login')
      await page.getByRole('button', { name: /▼/ }).click()
      await page.getByRole('button', { name: locale.toUpperCase(), exact: true }).click()
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 })
        for (const route of ['/login', '/register', '/forgot-password', '/reset-password']) {
          await page.goto(route)
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
          await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
          const card = page.getByRole('region')
          const bounds = await card.boundingBox()
          expect(bounds!.x).toBeGreaterThanOrEqual(0)
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
          await expect(page.getByRole('button', { name: new RegExp(`^${locale.toUpperCase()}`) })).toBeVisible()
          if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
          else await expect(page.locator('html')).not.toHaveClass(/dark/)
          if (route === '/login') {
            await expect(page.locator('#email')).toBeEditable()
            await expect(page.locator('#password')).toBeEditable()
            const toggle = page.getByRole('button', { name: /▼/ })
            await toggle.click()
            await expect(toggle).toHaveAttribute('aria-expanded', 'true')
            await page.getByRole('button', { name: 'RU', exact: true }).focus()
            await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
            await page.keyboard.press('Escape')
            await expect(toggle).toHaveAttribute('aria-expanded', 'false')
            await expect(toggle).toBeFocused()
            await page.screenshot({ path: `.local-checks/redesign-auth-${locale}-${theme}-${width}.png`, animations: 'disabled' })
          }
        }
      }
      await page.getByRole('main').getByRole('link', { name: 'Xtrix', exact: true }).click()
      await expect(page).toHaveURL('/')
    })
  }
}
