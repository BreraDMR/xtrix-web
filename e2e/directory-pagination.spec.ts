import { test, expect, type Page } from '@playwright/test'
import { apiLogin, apiPost, apiUrl, field, newOwner, openAs, unique } from './helpers'

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
  await expect(page.getByRole('button', { name: 'Open: Directory 001', exact: true })).toBeVisible()
  await expect(page.getByText(/of 125/)).toBeVisible()
  await page.getByLabel('Per page').selectOption('100')
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Open: Directory 125', exact: true })).toBeVisible()
  const search = page.getByRole('searchbox')
  await search.fill('directory125@')
  await expect(page.getByRole('button', { name: 'Open: Directory 125', exact: true })).toBeVisible()
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
  await page.goto('/app/visits')
  await page.getByRole('button', { name: 'New Visit' }).click()
  await field(page, /^Client/).selectOption({ label: 'Directory 125' })
  await field(page, /^Start Date & Time/).fill('2030-06-01T10:00')
  await field(page, /^End Date & Time/).fill('2030-06-01T10:30')
  await field(page, /^Service Name/).fill('Complete directory booking')
  await page.getByRole('button', { name: 'Create Visit' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Directory 125' })).toBeVisible()
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
  await page.locator('#workspace-navigation').getByRole('link', { name: 'Clients', exact: true }).click()
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

async function downloadedCsv(page: Page) {
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  await page.getByRole('button', { name: /^CSV/ }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).last().click()
  const stream = await (await pending).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

// A second salon plus a staff member who only got some of the clients: pages, search and
// the CSV must show exactly the allowed rows - not the rest of the salon, not the other salon.
test('a staff member limited to some clients pages, searches and exports exactly those', async ({ page, request }) => {
  test.setTimeout(180_000)
  const owner = await newOwner(request)
  const ids: number[] = []
  for (let offset = 0; offset < 45; offset += 5) {
    const batch = await Promise.all(Array.from({ length: 5 }, (_, i) => apiPost<{ id: number }>(request, owner, '/clients/', {
      full_name: `Scoped ${String(offset + i + 1).padStart(3, '0')}`,
    })))
    ids.push(...batch.map(row => row.id))
  }
  const other = await newOwner(request)
  const foreign = await apiPost<{ id: number }>(request, other, '/clients/', { full_name: 'Scoped foreign' })
  await apiPost(request, other, '/visits/', {
    client_id: foreign.id, specialist_id: other.user.id, service_name: 'Foreign treatment',
    date_start: '2030-03-02T09:00:00Z', date_end: '2030-03-02T09:30:00Z', price: 10,
  })

  // every third client stays hidden (Scoped 001, 004, ...), 30 allowed = two pages of 20;
  // the foreign id is saved too and must never leak through
  const allowed = ids.filter((_, index) => index % 3 !== 0)
  const allowedNames = ids.flatMap((_, index) => index % 3 ? [`Scoped ${String(index + 1).padStart(3, '0')}`] : [])
  const email = `${unique('scoped')}@example.com`
  const employee = await apiPost<{ id: number; user_id: number; generated_password: string }>(request, owner, '/employees/create-with-user', {
    full_name: 'Scoped Staff', email, position: 'Stylist',
  })
  // a master's visit list is their own visits: the allowed clients are booked with the
  // staff member, the hidden ones with the owner, and none of the owner's may show up
  for (const [index, clientId] of ids.entries()) {
    const start = new Date(Date.UTC(2030, 2, 1 + index, 9))
    await apiPost(request, owner, '/visits/', {
      client_id: clientId, specialist_id: index % 3 ? employee.user_id : owner.user.id, service_name: 'Scoped treatment',
      date_start: start.toISOString(), date_end: new Date(start.getTime() + 30 * 60_000).toISOString(), price: 10,
    })
  }
  const saved = await request.put(`${apiUrl}/employees/${employee.id}`, {
    headers: owner.headers, data: { permissions: { assigned_client_ids: [...allowed, foreign.id] } },
  })
  expect(saved.ok(), await saved.text()).toBeTruthy()
  const staff = await apiLogin(request, email, employee.generated_password)
  expect((await request.put(`${apiUrl}/user-preferences/me`, { headers: staff.headers, data: { language: 'en' } })).ok()).toBeTruthy()

  await openAs(page, staff, '/app/clients')
  await expect(page.getByText('Showing 1–20 of 30 results')).toBeVisible()
  await expect(page.getByText('Scoped 002', { exact: true })).toBeVisible()
  await expect(page.getByText('Scoped 001', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByText('Showing 21–30 of 30 results')).toBeVisible()
  await expect(page.getByText('Scoped 045', { exact: true })).toBeVisible()
  const search = page.getByRole('searchbox')
  const opened = page.getByRole('button', { name: /^Open: Scoped/ })
  const nothing = page.getByText('No clients match your filters')
  // a hidden client of this salon and a client of the other one: both searched by name,
  // each time after a real hit, so the empty answer can't be the previous screen
  for (const hidden of ['Scoped 043', 'Scoped foreign']) {
    await search.fill('Scoped 044')
    await expect(opened).toHaveCount(1)
    await search.fill(hidden)
    await expect(nothing).toBeVisible()
    await expect(opened).toHaveCount(0)
  }
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByText('Showing 1–20 of 30 results')).toBeVisible()
  const clientsCsv = await downloadedCsv(page)
  expect(clientsCsv.match(/Scoped \d{3}/g)?.sort()).toEqual(allowedNames)
  expect(clientsCsv).not.toContain('Scoped foreign')

  await page.goto('/app/visits')
  await expect(page.getByText('Showing 1–20 of 30 results')).toBeVisible()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page.getByText('Showing 21–30 of 30 results')).toBeVisible()
  await expect(page.getByText('Scoped 045', { exact: true })).toBeVisible()
  await expect(page.getByText('Scoped 043', { exact: true })).toHaveCount(0)
  const visitsCsv = await downloadedCsv(page)
  expect(visitsCsv.match(/Scoped \d{3}/g)?.sort()).toEqual(allowedNames)
  expect(visitsCsv).not.toContain('Scoped foreign')
  expect(visitsCsv).not.toContain('Foreign treatment')
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
