import { test, expect } from '@playwright/test'
import { apiPost, apiUrl, newOwner, openAs } from './helpers'

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

test('visit pages and export keep client names beyond the first hundred', async ({ page, request }) => {
  test.setTimeout(120_000)
  const owner = await newOwner(request)
  for (let index = 0; index < 125; index++) {
    const client = await apiPost<{ id: number }>(request, owner, '/clients/', {
      full_name: `Visit guest ${String(index + 1).padStart(3, '0')}`,
    })
    const start = new Date(Date.UTC(2030, 0, 1 + index, 10))
    await apiPost(request, owner, '/visits/', {
      client_id: client.id, specialist_id: owner.user.id, service_name: 'Directory treatment',
      date_start: start.toISOString(), date_end: new Date(start.getTime() + 30 * 60_000).toISOString(), price: 10,
    })
  }
  await openAs(page, owner, '/app/visits')
  await expect(page.getByText('Visit guest 001', { exact: true })).toBeVisible()
  await expect(page.getByText(/of 125/)).toBeVisible()
  await page.getByLabel('Per page').selectOption('100')
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByText('Visit guest 125', { exact: true })).toBeVisible()
  const search = page.getByRole('searchbox')
  await search.fill('Visit guest 125')
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(search).toHaveValue('')
  await expect(page.getByText(/of 125/)).toBeVisible()
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await page.getByRole('button', { name: /^CSV/ }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).last().click()
  const stream = await (await pending).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const csv = Buffer.concat(chunks).toString('utf8')
  expect(csv).toContain('Visit guest 001')
  expect(csv).toContain('Visit guest 125')
  expect(csv.match(/Visit guest \d{3}/g)).toHaveLength(125)
})

for (const language of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`directory layout and pagination: ${language}, ${theme}`, async ({ page, request }) => {
      const owner = await newOwner(request)
      for (let id = 1; id <= 22; id++) {
        await apiPost(request, owner, '/clients/', { full_name: `Layout client ${String(id).padStart(2, '0')}` })
      }
      await openAs(page, owner, '/app/clients')
      expect((await request.put(`${apiUrl}/user-preferences/me`, {
        headers: owner.headers, data: { language, theme },
      })).ok()).toBeTruthy()
      await page.reload()
      await expect(page.getByText('Layout client 01', { exact: true })).toBeVisible()
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      else await expect(page.locator('html')).not.toHaveClass(/dark/)
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 })
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
        await page.screenshot({ path: `.local-checks/directory-${language}-${theme}-${width}.png`, fullPage: true })
        const next = { en: 'Next', ru: 'Далее', cz: 'Další' }[language]
        const previous = { en: 'Previous', ru: 'Назад', cz: 'Předchozí' }[language]
        await page.getByRole('button', { name: width === 375 ? next : '2', exact: true }).click()
        await expect(page.getByText('Layout client 22', { exact: true })).toBeVisible()
        await page.getByRole('button', { name: width === 375 ? previous : '1', exact: true }).click()
        await expect(page.getByText('Layout client 01', { exact: true })).toBeVisible()
      }
    })
  }
}
