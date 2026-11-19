import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiPost, apiUrl, newOwner, openAs, unique, type Session } from './helpers'

// FORM-12 review: the whole loop through the UI - the owner creates the guest link in the
// visit card, the guest answers it, the card shows the answers instead of the button.

const DAY_MS = 24 * 60 * 60 * 1000
const FIELDS = [
  { key: 'hair_length', type: 'text', label: 'Hair length', required: true, max_length: 100 },
  { key: 'returning', type: 'boolean', label: 'Booked with us before?', required: true },
]

interface Fixture {
  owner: Session
  clientName: string
  templateName: string
}

async function seed(request: APIRequestContext, withQuestionnaire: boolean): Promise<Fixture> {
  const owner = await newOwner(request)
  const service = await apiPost<{ id: number }>(request, owner, '/services/', {
    name: 'Review consultation', duration_minutes: 60, price: 40, specialist_id: owner.user.id,
  })
  const clientName = unique('Link Guest')
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', {
    full_name: clientName, contact_email: `${unique('link')}@example.com`,
  })
  await apiPost(request, owner, '/visits/', {
    client_id: client.id, specialist_id: owner.user.id, service_id: service.id,
    date_start: new Date(Date.now() + DAY_MS).toISOString(),
    date_end: new Date(Date.now() + DAY_MS + 60 * 60 * 1000).toISOString(),
    status: 'planned',
  })
  const templateName = unique('Review intake')
  if (withQuestionnaire) {
    const template = await apiPost<{ id: number }>(request, owner, '/businesses/me/questionnaires/', {
      name: templateName, fields: FIELDS,
    })
    await apiPost(request, owner, `/businesses/me/questionnaires/${template.id}/publish`, { service_id: service.id })
  }
  return { owner, clientName, templateName }
}

async function openVisit(
  page: Page, request: APIRequestContext, fixture: Fixture, language: 'en' | 'ru' | 'cz', theme: 'light' | 'dark',
) {
  const t = (key: TranslationKey) => translations[key][language]
  // signed in, language and theme are account settings, so set them on the API after login
  await openAs(page, fixture.owner, '/app/visits')
  const saved = await request.put(`${apiUrl}/user-preferences/me`, {
    headers: fixture.owner.headers, data: { theme, language },
  })
  expect(saved.ok(), await saved.text()).toBeTruthy()
  await page.reload()
  await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(theme === 'dark')
  const row = page.getByRole('row').filter({ hasText: fixture.clientName })
  const card = page.locator('li, article, div').filter({ hasText: fixture.clientName })
  if (await row.count()) {
    await row.getByRole('button', { name: t('common.edit') }).click()
  } else {
    // narrow screens list visits as cards instead of table rows
    await card.getByRole('button', { name: t('common.edit') }).last().click()
  }
  await page.waitForLoadState('networkidle')
  return t
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
}

for (const [language, theme, width] of [['en', 'light', 1280], ['ru', 'dark', 375], ['cz', 'dark', 1280]] as const) {
  test(`owner hands out the questionnaire link from the visit ${language}/${theme}/${width}`, async ({ page, request, browser, context }, info) => {
    const fixture = await seed(request, true)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.setViewportSize({ width, height: 900 })
    const t = await openVisit(page, request, fixture, language, theme)

    await expect(page.getByText(t('questionnaireLink.hint'))).toBeVisible()
    await page.getByRole('button', { name: t('questionnaireLink.create') }).click()
    const linkBox = page.getByRole('textbox', { name: t('questionnaireLink.label') })
    await expect(linkBox).toHaveValue(/\/questionnaire#token=[A-Za-z0-9_%-]{20,}$/)
    const link = await linkBox.inputValue()
    await page.getByRole('button', { name: t('questionnaireLink.copy') }).click()
    await expect(page.getByText(t('questionnaireLink.copied'))).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link)
    await noOverflow(page)
    await page.screenshot({ path: info.outputPath('link.png'), fullPage: true })

    const guestContext = await browser.newContext({ locale: 'en-GB', viewport: { width: 375, height: 800 } })
    const guest = await guestContext.newPage()
    try {
      await guest.goto(link)
      await expect(guest.getByRole('heading', { name: fixture.templateName })).toBeVisible()
      expect(new URL(guest.url()).hash).toBe('')
      await guest.locator('div.rounded-xl').filter({ hasText: 'Hair length' }).locator('input').fill('Short bob')
      await guest.locator('div.rounded-xl').filter({ hasText: 'Booked with us before?' })
        .getByRole('radio', { name: 'No' }).check()
      await guest.getByRole('button', { name: 'Send answers' }).click()
      await expect(guest.getByRole('heading', { name: 'Thank you' })).toBeVisible()
    } finally {
      await guestContext.close()
    }

    await page.reload()
    await openVisitAgain(page, fixture, t)
    const answers = page.locator('section').filter({ has: page.getByRole('heading', { name: fixture.templateName }) })
    await expect(answers).toContainText('Short bob')
    await expect(answers).toContainText(t('questionnaireAnswers.version'))
    await expect(page.getByRole('button', { name: t('questionnaireLink.create') })).toHaveCount(0)
    await noOverflow(page)
    await page.screenshot({ path: info.outputPath('answers.png'), fullPage: true })
  })
}

async function openVisitAgain(page: Page, fixture: Fixture, t: (key: TranslationKey) => string) {
  const row = page.getByRole('row').filter({ hasText: fixture.clientName })
  if (await row.count()) {
    await row.getByRole('button', { name: t('common.edit') }).click()
  } else {
    await page.locator('li, article, div').filter({ hasText: fixture.clientName })
      .getByRole('button', { name: t('common.edit') }).last().click()
  }
  await page.waitForLoadState('networkidle')
}

test('a salon without questionnaires sees no link block in the visit', async ({ page, request }) => {
  const fixture = await seed(request, false)
  const t = await openVisit(page, request, fixture, 'en', 'light')
  await expect(page.getByRole('button', { name: t('common.cancel') }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: t('questionnaireLink.create') })).toHaveCount(0)
  await expect(page.getByText(t('questionnaireLink.hint'))).toHaveCount(0)
})
