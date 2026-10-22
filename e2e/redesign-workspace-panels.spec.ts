import { expect, test } from '@playwright/test'
import { apiLogin, apiPost, apiUrl, field, newOwner, openAs, unique, waitForFormData } from './helpers'

test('nested client reports keep keyboard focus and Escape in the current window', async ({ page, request }) => {
  const owner = await newOwner(request)
  await apiPost(request, owner, '/clients/', { full_name: 'Keyboard Guest' })
  await openAs(page, owner, '/app/clients')
  const opener = page.getByRole('button', { name: 'Open: Keyboard Guest', exact: true })
  await opener.click()
  const card = page.getByRole('dialog', { name: 'Client record', exact: true })
  const print = card.getByRole('button', { name: 'Print', exact: true })
  await print.click()
  const report = page.getByRole('dialog', { name: 'Personal Report - Keyboard Guest', exact: true })
  await expect(report).toBeVisible()
  const exportButton = report.getByRole('button', { name: 'Export / Print', exact: true })
  await exportButton.click()
  const exporter = page.getByRole('dialog', { name: 'Export Data', exact: true })
  await expect(exporter).toBeVisible()
  for (let index = 0; index < 12; index++) {
    await page.keyboard.press('Tab')
    expect(await exporter.evaluate(element => document.hasFocus()
      ? element.contains(document.activeElement) : document.activeElement === document.body)).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(exporter).toBeHidden()
  await expect(exportButton).toBeFocused()
  await expect(report).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(report).toBeHidden()
  await expect(print).toBeFocused()
  await expect(card).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(card).toBeHidden()
  await expect(opener).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
})

test('visit editor keeps page and filters while saving a real update', async ({ page, request }) => {
  const owner = await newOwner(request)
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: 'Directory Guest' })
  for (let index = 1; index <= 25; index++) {
    const start = new Date(Date.UTC(2030, 0, index, 10))
    await apiPost(request, owner, '/visits/', {
      client_id: client.id, specialist_id: owner.user.id,
      service_name: `Panel Treatment ${String(index).padStart(2, '0')}`, price: index === 22 ? 0 : 45,
      date_start: start.toISOString(), date_end: new Date(start.getTime() + 1_800_000).toISOString(),
    })
  }
  await openAs(page, owner, '/app/visits')
  const search = page.getByRole('searchbox')
  await search.fill('Panel Treatment')
  await page.getByRole('button', { name: '2', exact: true }).click()
  const row = page.getByRole('row').filter({ hasText: 'Panel Treatment 22' })
  await expect(row).toContainText('0.00 €')
  const edit = row.getByRole('button', { name: 'Edit', exact: true })
  await edit.click()
  const editor = page.getByRole('dialog', { name: 'Edit visit', exact: true })
  await expect(field(editor, /^Service Name/)).toHaveValue('Panel Treatment 22')
  await expect(field(editor, /^Price/)).toHaveValue('0')
  await waitForFormData(page)
  await field(editor, /^Note/).fill('A real update from the side panel')
  await editor.getByRole('button', { name: 'Update Visit', exact: true }).click()
  await expect(editor).toBeHidden()
  await expect(search).toHaveValue('Panel Treatment')
  await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(row).toContainText('0.00 €')
  await expect(edit).toBeFocused()
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
    await page.screenshot({ path: `.local-checks/redesign-visits-${width}.png`, animations: 'disabled' })
  }
})

test('stock catalogue keeps low-stock filtering and updates quantity on a narrow screen', async ({ page, request }) => {
  const owner = await newOwner(request)
  await apiPost(request, owner, '/products/', { business_id: owner.user.business_id, name: 'Studio shampoo',
    unit: 'pcs', quantity: 1, min_quantity: 2, price_per_unit: 15, is_active: true })
  await apiPost(request, owner, '/products/', { business_id: owner.user.business_id, name: 'Studio towels',
    unit: 'pcs', quantity: 10, min_quantity: 2, is_active: true })
  await page.setViewportSize({ width: 375, height: 900 })
  await openAs(page, owner, '/app/inventory')
  const lowStock = page.getByRole('checkbox')
  await lowStock.check()
  const row = page.getByRole('row').filter({ hasText: 'Studio shampoo' })
  await expect(row).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Studio towels' })).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  await page.screenshot({ path: '.local-checks/redesign-inventory-375.png', animations: 'disabled' })
  await row.getByRole('button', { name: 'Add Quantity', exact: true }).click()
  await page.getByLabel('Quantity', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(row).toHaveCount(0)
  await lowStock.uncheck()
  await expect(row).toContainText('4 pcs')
})

for (const chain of [false, true]) {
  test(`staff can save a ${chain ? 'chain' : 'single'} visit note without reading or replacing its financial snapshot`, async ({ page, request }) => {
    const owner = await newOwner(request)
    const email = `${unique('privacy-staff')}@example.com`
    const employee = await apiPost<{ user_id: number; generated_password: string }>(request, owner, '/employees/create-with-user', {
      full_name: 'Privacy Colleague', email, permissions: { can_create_visits: true, can_manage_services: true, can_view_financials: false },
    })
    const staff = await apiLogin(request, email, employee.generated_password)
    const client = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: 'Private Finance Guest' })
    const services = []
    for (const price of [30, 45]) services.push(await apiPost<{ id: number }>(request, owner, '/services/', {
      name: `Private treatment ${price}`, specialist_id: employee.user_id, duration_minutes: 30, price,
    }))
    const visit = await apiPost<{ id: number; price: number; items: { price: number }[] }>(request, owner, '/visits/', {
      client_id: client.id, specialist_id: employee.user_id, date_start: '2030-05-10T10:00:00Z',
      service_id: services[0].id, ...(chain ? { items: services.map(service => ({ service_id: service.id })) } : {}),
      status: 'completed', payment_method: 'cash',
    })
    for (const service of services) {
      const response = await request.put(`${apiUrl}/services/${service.id}`, { headers: owner.headers, data: { price: 300 } })
      expect(response.ok(), await response.text()).toBeTruthy()
    }
    await openAs(page, staff, '/app/visits')
    const row = page.getByRole('row').filter({ hasText: 'Private Finance Guest' })
    await expect(row).toBeVisible()
    await expect(row).not.toContainText('€')
    await row.getByRole('button', { name: 'Edit', exact: true }).click()
    const editor = page.getByRole('dialog', { name: 'Edit visit', exact: true })
    await waitForFormData(page)
    await field(editor, /^Note/).fill('Saved without financial access')
    await expect(field(editor, /^Note/)).toHaveValue('Saved without financial access')
    const saving = page.waitForResponse(response => response.request().method() === 'PUT'
      && new URL(response.url()).pathname === `/visits/${visit.id}`)
    await editor.getByRole('button', { name: 'Update Visit', exact: true }).click()
    const response = await saving
    expect(response.ok(), await response.text()).toBeTruthy()
    const payload = response.request().postDataJSON()
    expect(payload).not.toHaveProperty('price')
    expect(payload).not.toHaveProperty('payment_method')
    expect(payload).not.toHaveProperty('items')
    const result = await response.json()
    expect(result.price).toBeNull()
    expect(result.payment_method).toBeNull()
    expect(result.items.every((item: { price: number | null }) => item.price === null)).toBe(true)
    await expect(editor).toBeHidden()
    const stored = await request.get(`${apiUrl}/visits/${visit.id}`, { headers: owner.headers })
    expect(stored.ok()).toBeTruthy()
    expect(await stored.json()).toMatchObject({ note: 'Saved without financial access', price: visit.price,
      payment_method: 'cash', items: visit.items.map(item => ({ price: item.price })) })
  })
}
