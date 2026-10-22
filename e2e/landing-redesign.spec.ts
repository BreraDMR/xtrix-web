import { expect, test, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'

type Locale = 'en' | 'ru' | 'cz'
async function selectLanguage(page: Page, locale: Locale) {
  await page.getByRole('button', { name: /^(EN|RU|CZ)(?:\s|$)/ }).first().click()
  await page.getByRole('button', { name: locale.toUpperCase(), exact: true }).last().click()
}

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const width of [375, 1280]) {
    test(`public workspace presentation stays localized and contained at ${width}px in ${locale}`, async ({ page }) => {
      const text = (key: TranslationKey) => translations[key][locale]
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await selectLanguage(page, locale)
      const main = page.getByRole('main')
      await expect(main.getByRole('heading', { level: 1 })).toHaveText(text('landing.hero.title'))
      await expect(main.getByRole('link', { name: text('landing.hero.cta_start'), exact: true })).toHaveAttribute('href', '/register')
      await expect(main.getByRole('link', { name: text('landing.hero.cta_login'), exact: true })).toHaveAttribute('href', '/login')
      await expect(page.getByRole('figure', { name: text('landing.preview.sampleNotice') })).toBeVisible()
      for (const id of ['features', 'tour', 'pricing', 'faq', 'contact']) await expect(page.locator(`#${id}`)).toBeVisible()
      await page.getByRole('button', { name: text('landing.tour.clients_tab'), exact: true }).click()
      await expect(page.getByRole('region', { name: text('landing.tour.step2_title'), exact: true })).toBeVisible()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
      await page.screenshot({ path: `.local-checks/landing-redesign-${locale}-${width}.png`, fullPage: true, animations: 'disabled' })
    })
  }
}

test('public mobile navigation, FAQ and legal preview preserve keyboard access', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('/')
  await selectLanguage(page, 'en')
  const menu = page.getByRole('button', { name: 'Navigation menu', exact: true })
  await menu.focus()
  await page.keyboard.press('Space')
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Escape')
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(menu).toBeFocused()
  await menu.click()
  await page.locator('#landing-mobile-navigation').getByRole('link', { name: 'FAQ', exact: true }).click()
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  const trial = page.getByRole('button', { name: 'How does the free trial work?', exact: true })
  await trial.focus()
  await page.keyboard.press('Space')
  await expect(trial).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('Enter')
  await expect(trial).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('region', { name: 'How does the free trial work?', exact: true })).toContainText('7 days of CRM and AI without a card')
  const terms = page.getByRole('button', { name: 'Terms of Service', exact: true })
  await terms.click()
  const preview = page.getByRole('dialog', { name: 'Terms of Service', exact: true })
  await expect(preview).toContainText('Legal documentation preview')
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press('Tab')
    expect(await preview.evaluate(element => document.hasFocus()
      ? element.contains(document.activeElement) : document.activeElement === document.body)).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  await expect(terms).toBeFocused()
})
