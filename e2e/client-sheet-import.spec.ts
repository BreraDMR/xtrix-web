import { test, expect } from '@playwright/test'
import * as XLSX from 'xlsx'
import { apiPost, apiUrl, newOwner, openAs } from './helpers'

test('client sheet skips invalid rows and duplicates beyond the first directory page', async ({ page, request }) => {
  test.setTimeout(120_000)
  const owner = await newOwner(request)
  for (let offset = 0; offset < 125; offset += 5) {
    await Promise.all(Array.from({ length: Math.min(5, 125 - offset) }, (_, i) => apiPost(request, owner, '/clients/', {
      full_name: `Existing ${offset + i + 1}`, contact_email: `existing${offset + i + 1}@example.cz`,
    })))
  }
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ['Name', 'Email'], ['Invalid first row', 'bad-email'], ['Existing row', 'existing125@example.cz'],
    ['Imported Second', 'second@example.cz'], ['Repeated email', 'SECOND@example.cz'], ['Imported Third', 'third@example.cz'],
  ]), 'Clients')
  const buffer = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer
  await openAs(page, owner, '/app/clients')
  await page.getByRole('button', { name: 'Import Clients from Excel', exact: true }).click()
  await page.locator('input[type=file]').setInputFiles({ name: 'clients.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer })
  const importButton = page.getByRole('button', { name: 'Import (2)', exact: true })
  await expect(importButton).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await importButton.click()
  await expect.poll(async () => {
    const response = await request.get(`${apiUrl}/clients/`, { headers: owner.headers, params: { q: 'Imported' } })
    expect(response.ok()).toBeTruthy()
    return (await response.json()).items.map((client: { full_name: string }) => client.full_name)
  }).toEqual(['Imported Second', 'Imported Third'])
  const all = await request.get(`${apiUrl}/clients/`, { headers: owner.headers })
  expect((await all.json()).total).toBe(127)
})
