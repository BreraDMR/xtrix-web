import { test, expect, type Page } from '@playwright/test'
import { apiPost, newOwner, openAs, stabilizeTrialDate, type Session } from './helpers'

// The everyday phone/tablet path: Today, the agenda, search and a new visit at 375 and 768 px.
// The browser clock sits on a Monday in 2030, so the seeded visits are "today" for the page.
const CLOCK_START = new Date('2030-06-17T07:30:00+02:00')

async function noPageScroll(page: Page, where: string) {
  const sizes = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  expect(sizes.scroll - sizes.client, `${where}: page scrolls sideways`).toBeLessThanOrEqual(1)
}

let owner: Session
test.beforeAll(async ({ request }) => {
  owner = await newOwner(request, { fullName: 'Olga Owner-Longname Nováková' })
  const service = await apiPost<{ id: number }>(request, owner, '/services/', {
    name: 'Balayage with toner and blow-dry', duration_minutes: 60, price: 120, specialist_id: owner.user.id,
  })
  await apiPost(request, owner, '/employees/create-with-user', {
    full_name: 'Bára Stylistová-Dlouhá', email: `mobile-staff-${Date.now()}@example.com`, position: 'Stylist',
    base_salary: 1000, commission_percentage: 10,
  })
  const names = ['Alžběta Konečná-Procházková', 'Boris Kral', 'Cecile Dvorak']
  for (const [index, name] of names.entries()) {
    const client = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: name, contact_phone: `+42070000120${index}` })
    await apiPost(request, owner, '/visits/', {
      client_id: client.id, specialist_id: owner.user.id, service_id: service.id, price: 120,
      date_start: `2030-06-17T${String(7 + index * 2).padStart(2, "0")}:00:00Z`,
    })
  }
})

for (const width of [375, 768]) {
  test.describe(`daily work at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 812 })
      await page.clock.install({ time: CLOCK_START })
      await page.clock.resume()
      await stabilizeTrialDate(page)
    })

    test('Today fits the screen, the week chart labels stay apart and a whole agenda row opens the visit', async ({ page }) => {
      await openAs(page, owner, '/app')
      await expect(page.getByRole('heading', { name: 'Workday', level: 1 })).toBeVisible()
      const week = page.getByRole('region', { name: 'This week' })
      await expect(week.locator('.recharts-xAxis .recharts-cartesian-axis-tick')).toHaveCount(7)
      await noPageScroll(page, 'Today')

      // each day label keeps its own space on the axis
      const labels = await week.locator('.recharts-xAxis .recharts-cartesian-axis-tick text').evaluateAll(nodes =>
        nodes.map(node => { const box = node.getBoundingClientRect(); return { left: box.left, right: box.right } }))
      for (let index = 1; index < labels.length; index++) {
        expect(labels[index].left, `day ${index} label overlaps the previous one`).toBeGreaterThanOrEqual(labels[index - 1].right)
      }
      const weekBox = await week.boundingBox()
      expect(weekBox!.x + weekBox!.width).toBeLessThanOrEqual(width)

      // the row, not only the 20 px name, is the target - tap the service line
      const row = page.getByRole('listitem').filter({ hasText: 'Boris Kral' })
      await expect(row.getByRole('button', { name: 'Edit: Boris Kral' })).toBeVisible()
      expect((await row.boundingBox())!.height, 'agenda row height').toBeGreaterThanOrEqual(44)
      // a tap on the service line, away from the name, still opens the visit (a raw mouse click:
      // locator.click() would refuse, since the stretched button is what sits on top there)
      const service = (await row.getByText('Balayage with toner and blow-dry').boundingBox())!
      await page.mouse.click(service.x + service.width / 2, service.y + service.height / 2)
      const editor = page.getByRole('dialog', { name: 'Edit visit' })
      await expect(editor).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(editor).toBeHidden()
    })

    test('the closed phone menu stays out of the tab order and the menu button is a real target', async ({ page }) => {
      await openAs(page, owner, '/app/clients')
      await expect(page.getByRole('heading', { name: 'Clients', level: 1 })).toBeVisible()
      const menu = page.getByRole('button', { name: 'Menu', exact: true })
      await expect(menu).toBeVisible()
      const box = await menu.boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(40)
      expect(box!.height).toBeGreaterThanOrEqual(40)
      // closed off-canvas links are not reachable by Tab or a screen reader
      const sidebarLink = page.locator('#workspace-navigation').getByRole('link', { name: 'Waitlist' })
      await expect(sidebarLink).toBeHidden()
      await menu.click()
      await expect(page.getByRole('dialog', { name: 'PRIMARY' })).toBeVisible()
      await expect(sidebarLink).toBeVisible()
      await sidebarLink.click()
      await expect(page.getByRole('heading', { name: 'Waitlist', level: 1 })).toBeVisible()
      await expect(sidebarLink).toBeHidden()
      await noPageScroll(page, 'Waitlist')
    })

    test('a long owner name leaves the header room for the page name', async ({ page }) => {
      await openAs(page, owner, '/app/clients')
      await expect(page.getByRole('heading', { name: 'Clients', level: 1 })).toBeVisible()
      const header = page.locator('header.crm-header')
      // the name stays readable for screen readers, but on screen below 1280 px only the avatar shows
      await expect(header.getByText('Olga Owner-Longname Nováková', { exact: true })).toHaveCount(2)
      await expect(header.getByText('Olga Owner-Longname Nováková', { exact: true }).filter({ visible: true })).toHaveCount(1)
      expect(await header.getByText('Olga Owner-Longname Nováková', { exact: true }).evaluateAll(els =>
        Math.max(...els.map(el => el.getBoundingClientRect().width)))).toBeLessThanOrEqual(1)
      if (width >= 640) {
        // the breadcrumb is shown from sm up, and the page name in it is not cut
        const crumb = header.getByText('Clients', { exact: true })
        await expect(crumb).toBeVisible()
        expect(await crumb.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
      }
    })

    test('search, the visit list and a new visit work without sideways scrolling', async ({ page }) => {
      await openAs(page, owner, '/app/clients')
      const search = page.getByRole('searchbox').first()
      await search.fill('Boris')
      await expect(page.getByRole('button', { name: 'Open: Boris Kral' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Open: Cecile Dvorak' })).toHaveCount(0)
      await noPageScroll(page, 'Clients search')

      await page.goto('/app/visits')
      await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()
      // the export button says what it does on a phone too, not just an icon in a wide pill
      await expect(page.getByRole('button', { name: 'Export', exact: true })).toHaveText('Export', { useInnerText: true })
      await noPageScroll(page, 'Visits')

      await page.goto('/app/calendar')
      const grid = page.locator('[data-calendar-grid]').first()
      await expect(grid).toBeVisible()
      await noPageScroll(page, 'Calendar')
      // two staff columns scroll inside their own area on a phone, never the page
      const ownScroll = await grid.evaluate(node => {
        for (let parent = node.parentElement; parent; parent = parent.parentElement) {
          if (/(auto|scroll)/.test(getComputedStyle(parent).overflowX)) return parent.getBoundingClientRect().right <= document.documentElement.clientWidth
        }
        return false
      })
      expect(ownScroll).toBe(true)

      await page.getByRole('button', { name: 'New Visit', exact: true }).click()
      const panel = page.getByRole('dialog', { name: 'New Visit', exact: true })
      await expect(panel).toBeVisible()
      const panelBox = await panel.boundingBox()
      expect(panelBox!.x).toBeGreaterThanOrEqual(0)
      expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(width)
      await expect(panel.getByRole('button', { name: 'Create Visit' })).toBeVisible()
      await noPageScroll(page, 'New visit')
      await page.screenshot({ path: `.local-checks/mobile-daily-new-visit-${width}.png` })
    })
  })
}

test('on a wide screen the long owner name stays on one line in the header', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await openAs(page, owner, '/app/clients')
  const name = page.locator('header.crm-header').getByText('Olga Owner-Longname Nováková', { exact: true }).filter({ visible: true })
  await expect(name).toHaveCount(1)
  // one line of 13 px text, cut with an ellipsis rather than wrapped
  expect((await name.boundingBox())!.height).toBeLessThanOrEqual(24)
})
