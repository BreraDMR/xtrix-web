import { test, expect } from '@playwright/test'
import { apiPost, newOwner, openAs } from './helpers'

test('inventory and expenses export all allowed records beyond page one', async ({ page, request }) => {
  test.setTimeout(120_000)
  const owner = await newOwner(request)
  const business_id = owner.user.business_id
  const now = new Date()
  const expense_date = new Date(now.getFullYear(), now.getMonth(), 10, 12).toISOString()
  for (let offset = 0; offset < 125; offset += 5) {
    await Promise.all(Array.from({ length: Math.min(5, 125 - offset) }, async (_, i) => {
      const number = String(offset + i + 1).padStart(3, '0')
      await apiPost(request, owner, '/products/', { business_id, name: `Stock ${number}`,
        unit: 'pcs', quantity: 5, min_quantity: 1 })
      await apiPost(request, owner, '/expenses/', { business_id, expense_date, amount: 20,
        description: `Cost ${number}`, currency: 'EUR', payment_method: 'cash' })
    }))
  }
  await openAs(page, owner, '/app/inventory')
  await expect(page.getByText('Stock 125', { exact: true })).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(126)
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await expect(page.getByText('125 items')).toBeVisible()
  await page.getByRole('button', { name: /^CSV/ }).click()
  let pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).last().click()
  let stream = await (await pending).createReadStream()
  let chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  expect(Buffer.concat(chunks).toString('utf8').match(/Stock \d{3}/g)).toHaveLength(125)
  const search = page.getByPlaceholder('Search products...')
  await search.fill('Stock 125')
  await expect(page.getByRole('row')).toHaveCount(2)
  await search.clear()
  await expect(page.getByRole('row')).toHaveCount(126)

  await page.goto('/app/finance')
  await expect(page.getByText('Cost 125', { exact: true })).toBeVisible()
  const panel = page.getByRole('heading', { name: 'Expenses List' }).locator('..')
  await panel.getByRole('button', { name: 'Export', exact: true }).click()
  await expect(page.getByText('125 items')).toBeVisible()
  await page.getByRole('button', { name: /^CSV/ }).click()
  pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).last().click()
  stream = await (await pending).createReadStream()
  chunks = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  expect(Buffer.concat(chunks).toString('utf8').match(/Cost \d{3}/g)).toHaveLength(125)
})
