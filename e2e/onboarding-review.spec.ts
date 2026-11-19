import { test, expect, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiUrl, apiLogin, apiPost, newOwner, openAs, PASSWORD, unique, type Session } from './helpers'

type State = {
  persona: string; next_step: string | null; completed_steps: number; total_steps: number;
  steps: { key: string; completed: boolean; available: boolean }[];
  welcome_dismissed: boolean; tour_completed: boolean; tour_dismissed: boolean;
  checklist_dismissed: boolean; dismissed_hints: string[];
}
async function state(request: Parameters<typeof apiLogin>[0], session: Session): Promise<State> {
  const response = await request.get(`${apiUrl}/onboarding/me`, { headers: session.headers })
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
}

for (const language of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`solo first-run, modal keyboard, resume and settings reset ${language}/${theme}/${width}`, async ({ page, request }, info) => {
        const t = (key: TranslationKey) => translations[key][language]
        await page.setViewportSize({ width, height: 900 })
        const email = `${unique('on16')}@example.com`
        const signup = await request.post(`${apiUrl}/users/`, {
          data: { email, full_name: 'ON Review Solo', password: PASSWORD, role: 'specialist' },
        })
        expect(signup.ok(), await signup.text()).toBeTruthy()
        const solo = await apiLogin(request, email, PASSWORD)
        await openAs(page, solo, '/app')
        const prefs = await request.put(`${apiUrl}/user-preferences/me`, { headers: solo.headers, data: { language, theme } })
        expect(prefs.ok()).toBeTruthy()
        await page.reload()
        await expect(page.getByRole('heading', { name: t('onboarding.welcome.soloTitle'), exact: true })).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', language)
        await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(theme === 'dark')
        const before = await state(request, solo)
        await noOverflow(page)
        await page.screenshot({ path: info.outputPath('welcome.png'), fullPage: true })
        await page.getByRole('button', { name: t('onboarding.welcome.later'), exact: true }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        expect(await dialog.evaluate(el => el.matches(':modal'))).toBe(true)
        expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
        // Tab must never reach the live visit or logout controls under the tour.
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press(i < 5 ? 'Tab' : 'Shift+Tab')
          expect(await dialog.evaluate(el => document.activeElement === document.body || el.contains(document.activeElement))).toBe(true)
        }
        await page.getByRole('button', { name: t('nav.logout'), includeHidden: true }).evaluate(el => (el as HTMLElement).focus())
        expect(await dialog.evaluate(el => document.activeElement === document.body || el.contains(document.activeElement))).toBe(true)
        await dialog.focus()
        await page.keyboard.press('ArrowRight')
        await expect(dialog.getByRole('heading', { name: t('onboarding.tour.clients'), exact: true })).toBeVisible()
        await page.keyboard.press('ArrowLeft')
        await expect(dialog.getByRole('heading', { name: t('onboarding.tour.dashboard'), exact: true })).toBeVisible()
        await noOverflow(page)
        await page.screenshot({ path: info.outputPath('tour.png'), fullPage: true })
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
        const afterSkip = await state(request, solo)
        expect(afterSkip.steps).toEqual(before.steps)
        expect(afterSkip.completed_steps).toBe(before.completed_steps)
        expect(afterSkip.tour_dismissed).toBe(true)
        await page.reload()
        await expect(page.getByRole('heading', { name: t('onboarding.checklist.title'), exact: true })).toBeVisible()
        await expect(dialog).toHaveCount(0)
        await page.getByRole('button', { name: t('onboarding.checklist.hide'), exact: true }).click()
        await expect(page.getByRole('progressbar')).toHaveCount(0)
        await page.goto('/app/settings')
        await page.getByRole('button', { name: t('onboarding.settings.showChecklist'), exact: true }).click()
        await expect(page.getByText(t('onboarding.settings.saved'), { exact: true })).toBeVisible()
        await page.getByRole('button', { name: t('onboarding.settings.showTour'), exact: true }).click()
        await expect(dialog).toBeVisible()
        for (let i = 0; i < 4; i++) await dialog.getByRole('button', {
          name: t(i === 3 ? 'onboarding.tour.done' : 'onboarding.tour.next'), exact: true,
        }).click()
        await expect(dialog).toHaveCount(0)
        const afterComplete = await state(request, solo)
        expect(afterComplete.steps).toEqual(before.steps)
        expect(afterComplete.tour_completed).toBe(true)
        expect(afterComplete.tour_dismissed).toBe(false)
        await page.reload()
        await expect(dialog).toHaveCount(0)
        await expect(page.getByRole('progressbar')).toBeVisible()
        await noOverflow(page)
        await page.screenshot({ path: info.outputPath('resumed.png'), fullPage: true })
      })
    }
  }
}

test('onboarding API derives progress, isolates people and ignores spoofed identity/completion', async ({ request }) => {
  const owner = await newOwner(request, { business: false })
  const foreign = await newOwner(request)
  const before = await state(request, owner)
  const untouched = await state(request, foreign)
  expect(before.persona).toBe('owner')
  expect(before.next_step).toBe('business')
  expect(before.completed_steps).toBe(0)
  expect(before.steps.filter(step => step.available).map(step => step.key)).toEqual(['business'])
  const anonymous = await request.get(`${apiUrl}/onboarding/me`)
  expect(anonymous.status()).toBe(401)
  for (const body of [{ user_id: foreign.user.id }, { business_id: foreign.user.business_id }, { completed_steps: 5 }]) {
    const invalid = await request.patch(`${apiUrl}/onboarding/me`, { headers: owner.headers, data: body })
    expect(invalid.ok(), await invalid.text()).toBe(true)
    expect((await invalid.json()).steps).toEqual(before.steps)
    expect(await state(request, foreign)).toEqual(untouched)
  }
  for (const body of [{ tour_completed: true, tour_dismissed: true }, { dismissed_hints: ['unknown'] }]) {
    const invalid = await request.patch(`${apiUrl}/onboarding/me`, { headers: owner.headers, data: body })
    expect([400, 422]).toContain(invalid.status())
  }
  for (let i = 0; i < 2; i++) {
    const skipped = await request.patch(`${apiUrl}/onboarding/me`, {
      headers: owner.headers, data: { welcome_dismissed: true, tour_dismissed: true, checklist_dismissed: true },
    })
    expect(skipped.ok(), await skipped.text()).toBeTruthy()
    expect((await skipped.json()).steps).toEqual(before.steps)
  }
  await apiPost(request, owner, '/businesses/', { name: 'ON Review Owner', business_type: 'salon', currency: 'CZK', timezone: 'Europe/Prague' })
  const refreshed = await apiLogin(request, owner.email, owner.password)
  const duplicate = await request.post(`${apiUrl}/businesses/`, {
    headers: refreshed.headers, data: { name: 'Duplicate', business_type: 'salon', currency: 'CZK' },
  })
  expect(duplicate.ok()).toBe(false)
  expect((await state(request, refreshed)).next_step).toBe('service')
  expect(await state(request, foreign)).toEqual(untouched)
})

test('first service keeps its draft, validates values, and a new master password stays until Close', async ({ page, request }) => {
  const owner = await newOwner(request)
  await openAs(page, owner, '/app')
  await page.getByRole('button', { name: 'Maybe later', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const add = page.getByRole('button', { name: 'Add service', exact: true })
  await add.click()
  await page.getByLabel('Service Name', { exact: false }).fill('Draft Cut')
  await page.getByLabel('Duration', { exact: false }).fill('90')
  await page.getByLabel('Price', { exact: false }).fill('55')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await add.click()
  await expect(page.getByLabel('Service Name', { exact: false })).toHaveValue('Draft Cut')
  await expect(page.getByLabel('Duration', { exact: false })).toHaveValue('90')
  await expect(page.getByLabel('Price', { exact: false })).toHaveValue('55')
  const writes: string[] = []
  page.on('request', req => { if (req.method() === 'POST' && req.url() === `${apiUrl}/services/`) writes.push(req.url()) })
  const duration = page.getByLabel('Duration', { exact: false })
  await duration.fill('0')
  await page.getByRole('button', { name: 'Create Service', exact: true }).click()
  expect(await duration.evaluate(el => (el as HTMLInputElement).checkValidity())).toBe(false)
  expect(writes).toHaveLength(0)
  await duration.fill('90')
  const price = page.getByLabel('Price', { exact: false })
  await price.fill('-1')
  await page.getByRole('button', { name: 'Create Service', exact: true }).click()
  expect(await price.evaluate(el => (el as HTMLInputElement).checkValidity())).toBe(false)
  expect(writes).toHaveLength(0)
  await price.fill('55')
  await page.getByRole('button', { name: 'Create Service', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Set schedule', exact: true })).toBeVisible()
  expect(writes).toHaveLength(1)
  expect(await page.evaluate(() => Object.keys(sessionStorage).some(key => key.startsWith('onboarding-service-draft:')))).toBe(false)
  await page.getByRole('button', { name: 'Add master', exact: true }).click()
  const email = `${unique('on16-master')}@example.com`
  await page.getByLabel('Full Name', { exact: false }).fill('ON Review Master')
  await page.getByLabel('Email', { exact: true }).fill(email)
  const created = page.waitForResponse(response => response.url().endsWith('/employees/create-with-user') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const response = await created
  expect(response.ok(), await response.text()).toBeTruthy()
  const { generated_password: password } = await response.json()
  await expect(page.getByRole('heading', { name: 'Employee Created Successfully!', exact: true })).toBeVisible()
  await expect(page.locator('input[readonly]')).toHaveValue(password)
  // A progress refresh must not unmount the credential before the owner closes it.
  await page.getByRole('button', { name: 'Show all steps', exact: true }).click()
  await expect(page.locator('input[readonly]')).toHaveValue(password)
  const staff = await apiLogin(request, email, password)
  expect(staff.user.full_name).toBe('ON Review Master')
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.locator('input[readonly]')).toHaveCount(0)
})
