import { expect, test } from '@playwright/test'
import { apiLogin, apiUrl, newOwner, openAs, seedUser } from './helpers'

const labels = {
  en: { collapse: 'Collapse menu', expand: 'Expand menu', clients: 'Clients', primary: 'PRIMARY', menu: 'Menu', dashboard: 'Dashboard' },
  ru: { collapse: 'Свернуть меню', expand: 'Развернуть меню', clients: 'Клиенты', primary: 'ОСНОВНОЕ', menu: 'Меню', dashboard: 'Главная' },
  cz: { collapse: 'Sbalit nabídku', expand: 'Rozbalit nabídku', clients: 'Klienti', primary: 'ZÁKLADNÍ', menu: 'Menu', dashboard: 'Přehled' },
}

for (const language of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`compact navigation, reload and mobile keyboard: ${language}, ${theme}`, async ({ page, request }) => {
      const owner = await newOwner(request)
      await openAs(page, owner, '/clients')
      expect((await request.put(`${apiUrl}/user-preferences/me`, {
        headers: owner.headers, data: { language, theme },
      })).ok()).toBeTruthy()
      await page.reload()
      const text = labels[language]
      const sidebar = page.locator('#workspace-navigation')
      await expect(page.getByRole('button', { name: text.collapse })).toBeVisible()
      await expect(sidebar).toHaveCSS('width', '248px')
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      else await expect(page.locator('html')).not.toHaveClass(/dark/)
      await page.getByRole('button', { name: text.collapse }).click()
      await expect(sidebar).toHaveCSS('width', '76px')
      const workspace = await sidebar.locator('.crm-business').boundingBox()
      const badge = await sidebar.locator('.crm-business > span').boundingBox()
      expect(Math.abs((workspace!.x + workspace!.width / 2) - (badge!.x + badge!.width / 2))).toBeLessThanOrEqual(1)
      const clients = sidebar.getByRole('link', { name: text.clients, exact: true })
      await expect(clients).toHaveAttribute('title', text.clients)
      await expect(clients).toHaveAttribute('aria-current', 'page')
      await sidebar.getByRole('link', { name: 'Xtrix' }).focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/app$/)
      await clients.click()
      await page.reload()
      await expect(page.getByRole('button', { name: text.expand })).toHaveAttribute('aria-expanded', 'false')
      await expect(sidebar).toHaveCSS('width', '76px')
      const panel = await sidebar.boundingBox()
      const main = await page.locator('main').boundingBox()
      expect(main!.x).toBeGreaterThanOrEqual(panel!.x + panel!.width)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280)
      await page.screenshot({ path: `.local-checks/nav-${language}-${theme}-1280.png`, fullPage: true })

      await page.setViewportSize({ width: 375, height: 900 })
      await expect(page.getByRole('button', { name: text.expand })).toBeHidden()
      const menu = page.getByRole('button', { name: text.menu, exact: true })
      await menu.click()
      await expect(page.getByRole('dialog', { name: text.primary })).toBeVisible()
      await expect(sidebar).toHaveCSS('width', '248px')
      await expect(clients).toBeVisible()
      await expect(clients.locator('.crm-navtext')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog', { name: text.primary })).toHaveCount(0)
      await expect(menu).toBeFocused()
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
      await page.screenshot({ path: `.local-checks/nav-${language}-${theme}-375.png`, fullPage: true })
    })
  }
}

test('compact navigation keeps staff permissions', async ({ page, request }) => {
  const employee = seedUser('employee_a')
  const session = await apiLogin(request, employee.email, employee.password)
  expect((await request.put(`${apiUrl}/user-preferences/me`, {
    headers: session.headers, data: { language: 'en' },
  })).ok()).toBeTruthy()
  await openAs(page, employee, '/clients')
  await page.getByRole('button', { name: 'Collapse menu' }).click()
  const sidebar = page.locator('#workspace-navigation')
  await expect(sidebar.getByRole('link', { name: 'Clients', exact: true })).toBeVisible()
  for (const name of ['Finance', 'Employees', 'Subscription', 'Inventory']) {
    await expect(sidebar.getByRole('link', { name, exact: true })).toHaveCount(0)
  }
})

test('menu groups keep deep links and the header starts a new visit from any page', async ({ page, request }) => {
  const owner = await newOwner(request)
  await openAs(page, owner, '/clients')
  await page.goto('/app/audit')
  const nav = page.getByRole('navigation', { name: 'PRIMARY', exact: true })
  const reports = nav.getByRole('group', { name: 'REPORTS', exact: true })
  for (const name of ['Payments', 'Analytics', 'Action log']) {
    await expect(reports.getByRole('link', { name, exact: true })).toBeVisible()
  }
  await expect(reports.getByRole('link', { name: 'Action log', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('group', { name: 'MANAGE', exact: true }).getByRole('link', { name: 'Payments', exact: true })).toHaveCount(0)
  await expect(page.locator('#workspace-navigation')).toContainText('Business owner')

  await page.goto('/app/clients')
  const create = page.getByRole('banner').getByRole('button', { name: 'New Visit', exact: true })
  await expect(page.getByRole('button', { name: 'New Visit', exact: true })).toHaveCount(1)
  await create.focus()
  await page.keyboard.press('Enter')
  const panel = page.getByRole('dialog', { name: 'New Visit', exact: true })
  await expect(panel).toBeVisible()
  await expect(page).toHaveURL(/\/app\/clients$/)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(create).toBeFocused()
})

test('staff see no report group and their own role', async ({ page, request }) => {
  const employee = seedUser('employee_a')
  const session = await apiLogin(request, employee.email, employee.password)
  expect((await request.put(`${apiUrl}/user-preferences/me`, {
    headers: session.headers, data: { language: 'en' },
  })).ok()).toBeTruthy()
  await openAs(page, employee, '/clients')
  const nav = page.getByRole('navigation', { name: 'PRIMARY', exact: true })
  await expect(nav.getByRole('group', { name: 'PRIMARY', exact: true })).toBeVisible()
  await expect(nav.getByRole('group', { name: 'REPORTS', exact: true })).toHaveCount(0)
  await expect(page.locator('#workspace-navigation')).toContainText('Specialist')
})
