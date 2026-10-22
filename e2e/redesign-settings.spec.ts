import { expect, test } from '@playwright/test'
import { apiUrl, newOwner, openAs } from './helpers'

const labels = {
  en: { title: 'Settings', theme: 'Theme', dark: 'Dark', light: 'Light', formats: 'Date & Time Format' },
  ru: { title: 'Настройки', theme: 'Тема оформления', dark: 'Тёмная', light: 'Светлая', formats: 'Формат даты и времени' },
  cz: { title: 'Nastavení', theme: 'Téma', dark: 'Tmavá', light: 'Světlá', formats: 'Formát data a času' },
} as const

for (const language of ['en', 'ru', 'cz'] as const) {
  test(`${language}: settings sections and preferences remain usable on both screen sizes`, async ({ page, request }) => {
    const owner = await newOwner(request)
    await openAs(page, owner, '/app/settings')
    const preferences = await request.put(`${apiUrl}/user-preferences/me`, {
      headers: owner.headers, data: { language, theme: 'light' },
    })
    expect(preferences.ok(), await preferences.text()).toBeTruthy()
    await page.reload()
    const copy = labels[language]
    await expect(page.getByRole('heading', { name: copy.title, level: 1 })).toBeVisible()
    const sections = page.getByRole('navigation', { name: copy.title, exact: true })
    await expect(sections.getByRole('link')).toHaveCount(9)
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
      await sections.getByRole('link', { name: copy.theme, exact: true }).click()
      await expect(page).toHaveURL(/#settings-theme$/)
      const theme = page.locator('#settings-theme')
      await expect(theme).toBeInViewport()
      const dark = theme.getByRole('button', { name: copy.dark, exact: true })
      await dark.click()
      await expect(dark).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('html')).toHaveClass(/dark/)
      await page.screenshot({ path: `.local-checks/redesign-settings-${language}-dark-${width}.png`, animations: 'disabled' })
      await page.reload()
      await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(theme.getByRole('button', { name: copy.dark, exact: true })).toHaveAttribute('aria-pressed', 'true')
      await theme.getByRole('button', { name: copy.light, exact: true }).click()
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      const controls = theme.getByRole('button')
      for (const control of await controls.all()) {
        const box = await control.boundingBox()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(width)
      }
    }
  })
}
