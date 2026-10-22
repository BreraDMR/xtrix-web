import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { apiPost, apiUrl, newOwner, openAs } from './helpers'

const stockNote = 'Monthly studio supplies invoice with a long reference that should wrap inside the expense ledger'

async function financeFixture(request: APIRequestContext) {
  const owner = await newOwner(request)
  const category = await apiPost<{ id: number }>(request, owner, '/expenses/categories', { name: 'Studio supplies', color: '#63866c' })
  const otherCategory = await apiPost<{ id: number }>(request, owner, '/expenses/categories', { name: 'Studio travel', color: '#be9a72' })
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: 'Finance Overview Guest' })
  for (const [day, price, payment_method] of [[10, 70, 'card'], [11, 30, 'cash'], [32, 999, 'card']] as const) {
    const start = new Date(Date.UTC(2030, 4, day, 10))
    await apiPost(request, owner, '/visits/', { client_id: client.id, specialist_id: owner.user.id,
      service_name: `Finance treatment ${day}`, price, payment_method, status: 'completed',
      date_start: start.toISOString(), date_end: new Date(start.getTime() + 1_800_000).toISOString() })
  }
  const expense = await apiPost<{ id: number }>(request, owner, '/expenses/', { business_id: owner.user.business_id,
    category_id: category.id, amount: 25, currency: 'EUR', description: stockNote, expense_date: '2030-05-12T12:00:00Z', payment_method: 'card' })
  await apiPost(request, owner, '/expenses/', { business_id: owner.user.business_id,
    category_id: otherCategory.id, amount: 15, currency: 'EUR', description: 'Studio commute', expense_date: '2030-05-13T12:00:00Z', payment_method: 'cash' })
  await apiPost(request, owner, '/expenses/', { business_id: owner.user.business_id,
    category_id: category.id, amount: 999, currency: 'EUR', description: 'Outside selected period', expense_date: '2030-06-01T12:00:00Z', payment_method: 'cash' })
  return { owner, category, expense }
}

async function fits(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
}

test('finance period, ledger category, real export and confirmed deletion retain their scopes', async ({ page, request }) => {
  test.setTimeout(90_000)
  const { owner, category, expense } = await financeFixture(request)
  await openAs(page, owner, '/app/finance')
  await page.getByLabel('Date From', { exact: true }).fill('2030-05-01')
  await page.getByLabel('Date To', { exact: true }).fill('2030-05-31')
  const revenue = page.getByText('Revenue', { exact: true }).locator('..')
  const expenses = page.getByText('Expenses', { exact: true }).locator('..')
  const profit = page.getByText('Profit', { exact: true }).locator('..')
  await expect(revenue).toContainText('100.00 €')
  await expect(expenses).toContainText('40.00 €')
  await expect(profit).toContainText('60.00 €')
  const payments = page.getByRole('region', { name: 'Payments volume' })
  await expect(payments.getByText('70% (1)', { exact: true })).toBeVisible()
  await expect(payments.getByText('30% (1)', { exact: true })).toBeVisible()
  await expect(payments.locator('.recharts-pie')).toHaveCount(1)
  const ledger = page.getByRole('region', { name: 'Expenses List' })
  await expect(ledger.getByRole('row')).toHaveCount(3)
  await expect(ledger).not.toContainText('Outside selected period')
  await ledger.getByLabel('Category', { exact: true }).selectOption(String(category.id))
  const row = ledger.getByRole('row').filter({ hasText: stockNote })
  await expect(ledger.getByRole('row')).toHaveCount(2)
  await expect(row).toContainText('Studio supplies')
  await expect(row).toContainText('card')
  await expect(row).toContainText('2030')
  await expect(row).toContainText('25.00 EUR')
  await expect(expenses).toContainText('40.00 €')
  await expect(payments.getByText('100.00 €', { exact: true })).toBeVisible()
  for (const width of [1280, 768, 375]) {
    await page.setViewportSize({ width, height: 900 })
    await fits(page)
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `.local-checks/redesign-finance-functional-${width}.png`, fullPage: true, animations: 'disabled' })
  }
  await ledger.getByRole('button', { name: 'Export', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Export Data', exact: true })
  await expect(dialog.getByText('1 items', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: /^CSV/ }).click()
  const pending = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Export', exact: true }).click()
  const stream = await (await pending).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const csv = Buffer.concat(chunks).toString('utf8')
  expect(csv).toContain(stockNote)
  expect(csv).toContain('Studio supplies')
  expect(csv).not.toContain('Studio commute')
  expect(csv).not.toContain('Outside selected period')
  page.once('dialog', confirmation => confirmation.dismiss())
  await row.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(row).toBeVisible()
  page.once('dialog', confirmation => confirmation.accept())
  const deleted = page.waitForResponse(response => response.request().method() === 'DELETE' && new URL(response.url()).pathname === `/expenses/${expense.id}`)
  await row.getByRole('button', { name: 'Delete', exact: true }).click()
  const response = await deleted
  expect(response.ok(), await response.text()).toBeTruthy()
  await expect(row).toHaveCount(0)
  await expect(expenses).toContainText('15.00 €')
  await expect(profit).toContainText('85.00 €')
  await ledger.getByLabel('Category', { exact: true }).selectOption('')
  await expect(ledger.getByText('Studio commute', { exact: true })).toBeVisible()
})

const copy = {
  en: { title: 'Financial Reports', from: 'Date From', to: 'Date To', ledger: 'Expenses List', category: 'Category', payments: 'Payments volume' },
  ru: { title: 'Финансовая отчетность', from: 'Дата от', to: 'Дата до', ledger: 'Список расходов', category: 'Категория', payments: 'Объем платежей' },
  cz: { title: 'Finanční zprávy', from: 'Datum od', to: 'Datum do', ledger: 'Seznam výdajů', category: 'Kategorie', payments: 'Objem plateb' },
} as const

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} ${theme}: finance summary, chart and complete ledger fit desktop and mobile`, async ({ page, request }) => {
      test.setTimeout(60_000)
      const { owner } = await financeFixture(request)
      await openAs(page, owner, '/app/finance')
      const preferences = await request.put(`${apiUrl}/user-preferences/me`, { headers: owner.headers, data: { language: locale, theme } })
      expect(preferences.ok(), await preferences.text()).toBeTruthy()
      await page.reload()
      const text = copy[locale]
      await expect(page.getByRole('heading', { name: text.title, level: 1 })).toBeVisible()
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      else await expect(page.locator('html')).not.toHaveClass(/dark/)
      await page.getByLabel(text.from, { exact: true }).fill('2030-05-01')
      await page.getByLabel(text.to, { exact: true }).fill('2030-05-31')
      const ledger = page.getByRole('region', { name: text.ledger, exact: true })
      await expect(ledger.getByRole('row')).toHaveCount(3)
      await expect(page.getByRole('region', { name: text.payments }).locator('.recharts-pie')).toHaveCount(1)
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 })
        await fits(page)
        await expect(ledger.getByLabel(text.category, { exact: true })).toBeVisible()
        await expect(ledger.getByText(stockNote, { exact: true })).toBeVisible()
        await page.screenshot({ path: `.local-checks/redesign-finance-${locale}-${theme}-${width}.png`, fullPage: true, animations: 'disabled' })
      }
    })
  }
}
