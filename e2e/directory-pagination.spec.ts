import { test, expect } from '@playwright/test'
import { apiPost, newOwner, openAs } from './helpers'

test('client pages, server search and CSV cover the complete salon', async ({ page, request }) => {
  test.setTimeout(120_000)
  const owner = await newOwner(request)
  for (let offset = 0; offset < 125; offset += 5) {
    await Promise.all(Array.from({ length: Math.min(5, 125 - offset) }, (_, i) => apiPost(request, owner, '/clients/', {
      full_name: `Directory ${String(offset + i + 1).padStart(3, '0')}`,
      contact_email: `directory${offset + i + 1}@example.com`,
      gender: (offset + i) % 2 ? 'female' : 'male',
    })))
  }
  const other = await newOwner(request)
  await apiPost(request, other, '/clients/', { full_name: 'Other salon private' })
  await openAs(page, owner, '/app/clients')
  await expect(page.getByRole('cell', { name: 'Directory 001', exact: true })).toBeVisible()
  await expect(page.getByText(/of 125/)).toBeVisible()
  await page.getByLabel('Per page').selectOption('100')
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Directory 125', exact: true })).toBeVisible()
  const search = page.getByRole('searchbox')
  await search.fill('directory125@')
  await expect(page.getByRole('cell', { name: 'Directory 125', exact: true })).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(search).toHaveValue('')
  await expect(page.getByText(/of 125/)).toBeVisible()
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await expect(page.getByText('125 items')).toBeVisible()
  await page.getByRole('button', { name: /^CSV/ }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).last().click()
  const stream = await (await pending).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const csv = Buffer.concat(chunks).toString('utf8')
  expect(csv).toContain('Directory 001')
  expect(csv).toContain('Directory 125')
  expect(csv).not.toContain('Other salon private')
  expect(csv.match(/Directory \d{3}/g)).toHaveLength(125)
})

test('switching accounts in one SPA clears the previous salon data', async ({ page, request }) => {
  const first = await newOwner(request)
  const second = await newOwner(request)
  await apiPost(request, first, '/clients/', { full_name: 'First salon private client' })
  await apiPost(request, second, '/clients/', { full_name: 'Second salon client' })
  await openAs(page, first, '/app/clients')
  await expect(page.getByText('First salon private client', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Logout', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill(second.email)
  await page.getByLabel('Password', { exact: true }).fill(second.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.getByRole('link', { name: 'Clients', exact: true }).click()
  await expect(page.getByText('Second salon client', { exact: true })).toBeVisible()
  await expect(page.getByText('First salon private client', { exact: true })).toHaveCount(0)
})
