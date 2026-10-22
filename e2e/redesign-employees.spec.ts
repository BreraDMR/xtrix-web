import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'
import { apiPost, apiUrl, field, newOwner, openAs, unique, waitForFormData, type Session } from './helpers'
import type { Schema } from '../src/api/types'

const teamName = (number: number) => `Directory Team ${String(number).padStart(3, '0')}`
let phoneCounter = 0
function phone() {
  phoneCounter += 1
  return `+4207${String(Date.now() % 100000).padStart(5, '0')}${String(phoneCounter).padStart(3, '0')}`
}
async function member(request: APIRequestContext, owner: Session, number: number, name = teamName(number)) {
  const email = `${unique('directory-staff')}@example.com`
  const contactPhone = phone()
  const data: Schema<'EmployeeCreateWithUser'> = { full_name: name, email, phone: contactPhone,
    position: `Therapist ${number}`, commission_percentage: 12.5, base_salary: 1234.5 }
  // Use the normal owner endpoint. Do not alter plans, limits or database rows.
  const saved = await apiPost<Schema<'EmployeeCreateResponse'>>(request, owner, '/employees/create-with-user', data)
  expect(saved).toMatchObject({ position: data.position, commission_percentage: 12.5, base_salary: 1234.5, is_active: true })
  return { saved, name, email, contactPhone }
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
}
async function cellVisible(cell: Locator) {
  await cell.scrollIntoViewIfNeeded()
  await expect(cell).toBeInViewport()
}

// The current employee endpoint and subscription middleware impose no employee-count
// quota. If that changes, fail on the real refusal; do not upgrade plans or bypass it.
test('complete employee pages support searching, real create/edit, CSV and inactive filtering', async ({ page, request }) => {
  test.setTimeout(180_000)
  const owner = await newOwner(request)
  let last: Awaited<ReturnType<typeof member>> | undefined
  for (let number = 1; number <= 125; number++) last = await member(request, owner, number)
  expect(last).toBeDefined()
  const finalMember = last!
  await openAs(page, owner, '/app/employees')
  const search = page.getByRole('searchbox', { name: 'Search employees...' })
  await expect(page.getByRole('heading', { name: 'Employees', exact: true })).toBeVisible()
  await expect(page.getByText(teamName(1), { exact: true })).toBeVisible()
  await expect(page.getByText(/Showing 1.*20 of 125 results/)).toBeVisible()
  await search.fill(finalMember.email)
  let row = page.getByRole('row').filter({ hasText: teamName(125) })
  await expect(row).toBeVisible()
  await expect(row).toContainText(finalMember.contactPhone)
  await search.fill('Directory Team')
  await page.getByRole('button', { name: '5', exact: true }).click()
  await page.getByRole('button', { name: '7', exact: true }).click()
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  await waitForFormData(page)
  await expect(field(page, /^Position$/)).toHaveValue('Therapist 125')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(search).toHaveValue('Directory Team')
  await expect(row).toBeVisible()
  await expect(page.getByText(teamName(1), { exact: true })).toHaveCount(0)

  await row.getByRole('button', { name: 'Edit', exact: true }).click()
  await waitForFormData(page)
  await expect(field(page, /^Position$/)).toHaveValue('Therapist 125')
  await field(page, /^Position$/).fill('Senior Therapist 125')
  await field(page, /^Commission/).fill('18.5')
  await field(page, /^Base Salary$/).fill('1450.75')
  const updated = page.waitForResponse(response => response.request().method() === 'PUT'
    && new URL(response.url()).pathname.endsWith(`/employees/${finalMember.saved.id}`))
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const editResponse = await updated
  expect(editResponse.ok(), await editResponse.text()).toBeTruthy()
  expect(await editResponse.json()).toMatchObject({ position: 'Senior Therapist 125', commission_percentage: 18.5, base_salary: 1450.75 })
  await expect(row).toContainText('Senior Therapist 125')
  await expect(row).toContainText('18.5%')
  await expect(search).toHaveValue('Directory Team')

  // The visible last page is only five rows; the CSV must contain all 125.
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const exporter = page.getByRole('dialog', { name: 'Export Data', exact: true })
  await exporter.getByRole('button', { name: /^CSV/ }).click()
  const downloaded = page.waitForEvent('download')
  await exporter.getByRole('button', { name: 'Export', exact: true }).click()
  const download = await downloaded
  const stream = await download.createReadStream()
  expect(stream).not.toBeNull()
  const buffers: Buffer[] = []
  for await (const chunk of stream!) buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const csv = Buffer.concat(buffers).toString('utf8')
  expect(csv).toContain(teamName(1))
  expect(csv).toContain(teamName(125))
  expect(csv).toContain('Senior Therapist 125')
  expect(csv).toContain('1450.75')
  expect(csv.match(/Directory Team \d{3}/g)).toHaveLength(125)
  await expect(exporter).toBeHidden()

  await page.getByRole('button', { name: 'Add Employee', exact: true }).click()
  await page.getByLabel('Full Name', { exact: false }).fill(teamName(126))
  const newEmail = `${unique('directory-ui-staff')}@example.com`
  await page.getByLabel('Email', { exact: true }).fill(newEmail)
  await page.getByLabel('Phone', { exact: true }).fill(phone())
  await field(page, /^Position$/).fill('New Therapist')
  await field(page, /^Commission/).fill('10')
  await field(page, /^Base Salary$/).fill('900')
  const created = page.waitForResponse(response => response.request().method() === 'POST'
    && new URL(response.url()).pathname.endsWith('/employees/create-with-user'))
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  const createResponse = await created
  expect(createResponse.ok(), await createResponse.text()).toBeTruthy()
  const employee = await createResponse.json() as Schema<'EmployeeCreateResponse'>
  expect(employee).toMatchObject({ position: 'New Therapist', base_salary: 900, commission_percentage: 10 })
  await expect(page.getByText('Employee Created Successfully!', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  row = page.getByRole('row').filter({ hasText: teamName(126) })
  await expect(row).toBeVisible()
  await expect(search).toHaveValue('Directory Team')
  await search.fill(newEmail)
  await expect(row).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  const fired = page.waitForResponse(response => response.request().method() === 'DELETE'
    && new URL(response.url()).pathname.endsWith(`/employees/${employee.id}`))
  await row.getByRole('button', { name: 'Fire', exact: true }).click()
  const fireResponse = await fired
  expect(fireResponse.ok(), await fireResponse.text()).toBeTruthy()
  await expect(row).toHaveCount(0)
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('inactive')
  await expect(row).toBeVisible()
  await expect(row.getByText('Inactive', { exact: true })).toBeVisible()
  await expect(row.getByRole('button', { name: 'Fire', exact: true })).toHaveCount(0)
  await expect(row.getByRole('button', { name: 'Salary', exact: true })).toBeVisible()
  await fits(page)
  await page.screenshot({ path: '.local-checks/redesign-employees-flow-en-1280.png', animations: 'disabled' })
})

const copy = {
  en: { title: 'Employees', status: 'Status', active: 'Active', inactive: 'Inactive', salary: 'Salary', search: 'Search employees...' },
  ru: { title: 'Сотрудники', status: 'Статус', active: 'Активен', inactive: 'Неактивен', salary: 'Зарплата', search: 'Поиск сотрудников...' },
  cz: { title: 'Zaměstnanci', status: 'Stav', active: 'Aktivní', inactive: 'Neaktivní', salary: 'Plat', search: 'Hledat zaměstnance...' },
} as const
for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} ${theme}: employee contacts, pay and statuses remain accessible at 1280 and 375`, async ({ page, request }) => {
      test.setTimeout(60_000)
      const owner = await newOwner(request)
      const active = await member(request, owner, 1, 'Long employee name with enough words to verify a narrow directory without losing contact details')
      const inactive = await member(request, owner, 2, 'Former team member')
      const response = await request.delete(`${apiUrl}/employees/${inactive.saved.id}`, { headers: owner.headers })
      expect(response.ok(), await response.text()).toBeTruthy()
      await openAs(page, owner, '/app/employees')
      const preferences = await request.put(`${apiUrl}/user-preferences/me`, { headers: owner.headers, data: { language: locale, theme } })
      expect(preferences.ok(), await preferences.text()).toBeTruthy()
      await page.reload()
      const text = copy[locale]
      await expect(page.getByRole('heading', { name: text.title, exact: true })).toBeVisible()
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      else await expect(page.locator('html')).not.toHaveClass(/dark/)
      const region = page.getByRole('region', { name: text.title, exact: true })
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 })
        const search = page.getByRole('searchbox', { name: text.search, exact: true })
        await search.clear()
        await page.getByRole('combobox', { name: text.status, exact: true }).selectOption('active')
        const row = page.getByRole('row').filter({ hasText: active.name })
        await expect(row).toBeVisible()
        await expect(page.getByText(inactive.name, { exact: true })).toHaveCount(0)
        await region.evaluate(element => { element.scrollLeft = 0 })
        await expect(row.getByText(active.email, { exact: true })).toBeInViewport()
        await expect(row.getByText(active.contactPhone, { exact: true })).toBeInViewport()
        await fits(page)
        await page.screenshot({ path: `.local-checks/redesign-employees-${locale}-${theme}-${width}-contacts.png`, animations: 'disabled' })
        await expect(region).toHaveAttribute('tabindex', '0')
        if (width === 375) expect(await region.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
        await cellVisible(row.getByText('Therapist 1', { exact: true }))
        await cellVisible(row.getByText('12.5%', { exact: true }))
        const cells = row.getByRole('cell')
        await expect(cells).toHaveCount(7)
        await cellVisible(cells.nth(3))
        expect(await cells.nth(3).innerText()).toMatch(/1[\s\u00a0\u202f,.]?234[,.]50/)
        await cellVisible(row.getByText(text.active, { exact: true }))
        await cellVisible(cells.nth(5))
        expect((await cells.nth(5).innerText()).trim()).not.toBe('-')
        await cellVisible(row.getByRole('button', { name: text.salary, exact: true }))
        await fits(page)
        await page.screenshot({ path: `.local-checks/redesign-employees-${locale}-${theme}-${width}-pay-actions.png`, animations: 'disabled' })
        await search.fill(active.contactPhone)
        await expect(row).toBeVisible()
        await search.clear()
        await page.getByRole('combobox', { name: text.status, exact: true }).selectOption('inactive')
        const former = page.getByRole('row').filter({ hasText: inactive.name })
        await expect(former).toBeVisible()
        await cellVisible(former.getByText(text.inactive, { exact: true }))
        await expect(page.getByText(active.name, { exact: true })).toHaveCount(0)
      }
    })
  }
}
