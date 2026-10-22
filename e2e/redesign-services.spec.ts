import { expect, test, type Page } from '@playwright/test'
import { apiPost, apiUrl, newOwner, openAs, waitForFormData } from './helpers'

const treatment = (number: number) => `Treatment ${String(number).padStart(3, '0')}`
const longName = 'Personal consultation with a very long service name for narrow screens'
const longDescription = 'An extended description that should remain readable inside the catalogue and inside the editor without widening the whole workspace.'

async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
}

async function saveScreen(page: Page, name: string) {
  await page.screenshot({ path: `.local-checks/redesign-services-${name}.png`, fullPage: false, animations: 'disabled' })
}

test('service editing preserves the searched page and real creation refreshes the catalogue', async ({ page, request }) => {
  test.setTimeout(90_000)
  const owner = await newOwner(request)
  for (let number = 1; number <= 25; number++) {
    await apiPost(request, owner, '/services/', { name: treatment(number), duration_minutes: 30, price: 40,
      specialist_id: owner.user.id, is_active: true })
  }
  await openAs(page, owner, '/app/services')
  const search = page.getByRole('searchbox', { name: 'Search by service name...' })
  await search.fill('Treatment')
  await page.getByRole('button', { name: '2', exact: true }).click()
  const opener = page.getByRole('button', { name: `Edit: ${treatment(22)}`, exact: true })
  await opener.click()
  let editor = page.getByRole('dialog', { name: 'Edit service', exact: true })
  await expect(editor).toBeVisible()
  await waitForFormData(page)
  await expect(editor.getByRole('textbox', { name: /^Service Name/ })).toHaveValue(treatment(22))
  await editor.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(editor).toBeHidden()
  await expect(opener).toBeFocused()
  await expect(search).toHaveValue('Treatment')
  await expect(page.getByText(treatment(22), { exact: true })).toBeVisible()
  await expect(page.getByText(treatment(1), { exact: true })).toHaveCount(0)

  const add = page.getByRole('button', { name: 'Add Service', exact: true })
  await add.click()
  editor = page.getByRole('dialog', { name: 'Add Service', exact: true })
  await expect(editor).toBeVisible()
  await waitForFormData(page)
  await editor.getByRole('textbox', { name: /^Service Name/ }).fill(treatment(26))
  await editor.getByRole('spinbutton', { name: /^Duration/ }).fill('45')
  await editor.getByRole('spinbutton', { name: /^Price/ }).fill('99')
  await editor.getByRole('textbox', { name: 'Description', exact: true }).fill('A newly configured treatment')
  await editor.getByText('Additional Specialists (Optional)', { exact: true }).click()
  await expect(editor.getByRole('checkbox', { name: /Olga Owner/ })).toBeDisabled()
  const saved = page.waitForResponse(response => response.request().method() === 'POST'
    && new URL(response.url()).pathname.endsWith('/services/'))
  await editor.getByRole('button', { name: 'Create Service', exact: true }).click()
  const response = await saved
  expect(response.ok(), await response.text()).toBeTruthy()
  const created = await response.json()
  expect(created).toMatchObject({ name: treatment(26), duration_minutes: 45, price: 99,
    specialist_id: owner.user.id, is_active: true, description: 'A newly configured treatment' })
  await expect(editor).toBeHidden()
  await expect(page.getByText(treatment(26), { exact: true })).toBeVisible()
  await expect(search).toHaveValue('Treatment')
  await expect(page.getByText(treatment(1), { exact: true })).toHaveCount(0)
  await fits(page)
  await saveScreen(page, 'created-en-1280')
})

const copy = {
  en: { title: 'Services', edit: 'Edit', editor: 'Edit service', add: 'Add Service', name: /^Service Name/, active: 'Active', price: /^Price/, status: 'Status', team: 'Additional Specialists (Optional)' },
  ru: { title: 'Услуги', edit: 'Редактировать', editor: 'Редактирование услуги', add: 'Добавить услугу', name: /^Название услуги/, active: 'Активна', price: /^Цена/, status: 'Статус', team: 'Дополнительные специалисты (необязательно)' },
  cz: { title: 'Služby', edit: 'Upravit', editor: 'Upravit službu', add: 'Přidat službu', name: /^Název služby/, active: 'Aktivní', price: /^Cena/, status: 'Stav', team: 'Další specialisté (nepovinné)' },
} as const

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} ${theme}: service catalogue and editor fit desktop and mobile`, async ({ page, request }) => {
      test.setTimeout(60_000)
      const owner = await newOwner(request)
      await apiPost(request, owner, '/services/', { name: longName, description: longDescription,
        duration_minutes: 45, price: 140, specialist_id: owner.user.id, is_active: true })
      await apiPost(request, owner, '/services/', { name: 'Archived service', duration_minutes: 30,
        price: 50, specialist_id: owner.user.id, is_active: false })
      await openAs(page, owner, '/app/services')
      const preferences = await request.put(`${apiUrl}/user-preferences/me`, {
        headers: owner.headers, data: { language: locale, theme },
      })
      expect(preferences.ok(), await preferences.text()).toBeTruthy()
      await page.reload()
      const text = copy[locale]
      await expect(page.getByRole('heading', { name: text.title, level: 1 })).toBeVisible()
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      else await expect(page.locator('html')).not.toHaveClass(/dark/)
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 })
        await page.getByRole('combobox', { name: text.status, exact: true }).selectOption('active')
        const row = page.getByRole('row').filter({ hasText: longName })
        await expect(row).toBeVisible()
        await expect(row.getByText(text.active, { exact: true })).toBeVisible()
        await expect(page.getByText('Archived service', { exact: true })).toHaveCount(0)
        await fits(page)
        await saveScreen(page, `${locale}-${theme}-${width}`)
        const opener = page.getByRole('button', { name: `${text.edit}: ${longName}`, exact: true })
        await opener.focus()
        await page.keyboard.press('Enter')
        const editor = page.getByRole('dialog', { name: text.editor, exact: true })
        await expect(editor).toBeVisible()
        await waitForFormData(page)
        await expect(editor.getByRole('textbox', { name: text.name })).toHaveValue(longName)
        await expect(editor.getByRole('spinbutton', { name: text.price })).toHaveValue('140')
        const bounds = await editor.boundingBox()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
        expect(await editor.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
        await editor.getByText(text.team, { exact: true }).click()
        await expect(editor.getByRole('checkbox', { name: /Olga Owner/ })).toBeDisabled()
        await saveScreen(page, `editor-${locale}-${theme}-${width}`)
        await page.keyboard.press('Escape')
        await expect(editor).toBeHidden()
        await expect(opener).toBeFocused()
      }
    })
  }
}
