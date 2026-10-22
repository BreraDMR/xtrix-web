import { test, expect } from '@playwright/test'
import { apiPost, field, newOwner, openAs } from './helpers'

test('all service pages reach search, CSV and the visit selector', async ({ page, request }) => {
  test.setTimeout(120_000)
  const owner = await newOwner(request)
  await apiPost(request, owner, '/clients/', { full_name: 'Service directory guest' })
  for (let offset = 0; offset < 125; offset += 5) {
    await Promise.all(Array.from({ length: Math.min(5, 125 - offset) }, (_, i) => apiPost(request, owner, '/services/', {
      name: `Treatment ${String(offset + i + 1).padStart(3, '0')}`,
      duration_minutes: 30, price: 20, is_active: true, specialist_id: owner.user.id,
    })))
  }
  const other = await newOwner(request)
  await apiPost(request, other, '/services/', { name: 'Private other service', duration_minutes: 30, price: 20, specialist_id: other.user.id })
  await openAs(page, owner, '/app/services')
  await expect(page.getByText('Treatment 001', { exact: true })).toBeVisible()
  await expect(page.getByText(/of 125/)).toBeVisible()
  await page.getByRole('button', { name: '2', exact: true }).click()
  const search = page.getByRole('searchbox')
  await search.fill('Treatment 125')
  await expect(page.getByText('Treatment 125', { exact: true })).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(search).toHaveValue('')
  await expect(page.getByText('Treatment 001', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await expect(page.getByText('125 items')).toBeVisible()
  await page.getByRole('button', { name: /^CSV/ }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).last().click()
  const stream = await (await pending).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const csv = Buffer.concat(chunks).toString('utf8')
  expect(csv.match(/Treatment \d{3}/g)).toHaveLength(125)
  expect(csv).not.toContain('Private other service')
  await page.goto('/app/visits')
  await page.getByRole('button', { name: 'New Visit' }).click()
  await field(page, /^Client/).selectOption({ label: 'Service directory guest' })
  const option = page.getByRole('option', { name: 'Treatment 125 (30 min)', exact: true })
  await expect(option).toBeAttached()
  await option.locator('..').selectOption({ label: 'Treatment 125 (30 min)' })
  await field(page, /^Start Date & Time/).fill('2030-06-02T10:00')
  await page.getByRole('button', { name: 'Create Visit' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Service directory guest' })).toContainText('Treatment 125')
})
