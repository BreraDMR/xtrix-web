import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { apiPost, apiUrl, newOwner, openAs, unique, type Session } from './helpers'

// Fixed synthetic day: Monday 6 May 2030 in Prague (CEST, UTC+2). The browser clock starts
// there, so the calendar opens on the day the fixture was written for.
const TIME_ZONE = 'Europe/Prague'
const DAY = '2030-05-06'
const CLOCK = new Date('2030-05-06T10:00:00+02:00')
const EMPLOYEE_NAME = 'Maximilian Alexander Verylong Staffname'
const CLIENT_NAME = 'Anastasia Verylongsurname Client'

interface CalendarFixture {
  owner: Session
  ownerVisitId: number
  employeeVisitId: number
  dragVisitId?: number
}

async function calendarFixture(
  request: APIRequestContext,
  { withDragVisit = false }: { withDragVisit?: boolean } = {},
): Promise<CalendarFixture> {
  const owner = await newOwner(request)
  expect(owner.user.business_id).toBeTruthy()
  const business = await request.put(`${apiUrl}/businesses/${owner.user.business_id}`, {
    headers: owner.headers,
    data: { timezone: TIME_ZONE },
  })
  expect(business.ok(), await business.text()).toBeTruthy()

  const employee = await apiPost<{ employee_user_id: number }>(request, owner, '/employees/create-with-user', {
    full_name: EMPLOYEE_NAME,
    email: `${unique('staff')}@example.com`,
    position: 'Stylist',
  })
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', {
    full_name: CLIENT_NAME,
    contact_phone: '+420700000201',
  })
  const secondClient = await apiPost<{ id: number }>(request, owner, '/clients/', {
    full_name: 'Boris Client',
    contact_phone: '+420700000202',
  })

  for (const specialistId of [owner.user.id, employee.employee_user_id]) {
    await apiPost(request, owner, '/schedules/work', {
      specialist_id: specialistId,
      weekday: 0,
      start_time: '09:00',
      end_time: '18:00',
    })
  }
  // 12:00Z is 14:00 in Prague, inside the working day
  await apiPost(request, owner, '/schedules/blocks', {
    specialist_id: owner.user.id,
    start: '2030-05-06T12:00:00Z',
    end: '2030-05-06T13:00:00Z',
    reason: 'Lunch',
  })

  const visit = (clientId: number, specialistId: number, start: string, end: string) =>
    apiPost<{ id: number }>(request, owner, '/visits/', {
      client_id: clientId,
      specialist_id: specialistId,
      date_start: start,
      date_end: end,
      price: 40,
    })

  // both masters work at the same instant: 08:00Z must read as 10:00 in Prague
  const ownerVisitId = (await visit(client.id, owner.user.id, '2030-05-06T08:00:00Z', '2030-05-06T09:00:00Z')).id
  const employeeVisitId = (await visit(
    secondClient.id,
    employee.employee_user_id,
    '2030-05-06T08:00:00Z',
    '2030-05-06T09:00:00Z',
  )).id
  // 23:00Z the evening before is 01:00 on the same Prague day - close to the top of the grid,
  // where a drag does not need to scroll
  const dragVisitId = withDragVisit
    ? (await visit(client.id, owner.user.id, '2030-05-05T23:00:00Z', '2030-05-06T00:00:00Z')).id
    : undefined

  return { owner, ownerVisitId, employeeVisitId, dragVisitId }
}

async function installClock(page: Page) {
  await page.clock.install({ time: CLOCK })
  await page.clock.resume()
}

const pageOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test('day and week grids keep long names, Prague time and dark theme intact', async ({ page, request }) => {
  const fixture = await calendarFixture(request, { withDragVisit: true })
  const theme = await request.put(`${apiUrl}/user-preferences/me`, {
    headers: fixture.owner.headers,
    data: { theme: 'dark' },
  })
  expect(theme.ok(), await theme.text()).toBeTruthy()
  await installClock(page)
  await openAs(page, fixture.owner, '/app/calendar')

  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.locator('[data-calendar-grid]')).toHaveCount(2)

  // the employee and the owner each get a column, both visits sit at 10:00 Prague
  const ownerCard = page.locator(`[data-visit-id="${fixture.ownerVisitId}"]`)
  const employeeCard = page.locator(`[data-visit-id="${fixture.employeeVisitId}"]`)
  await expect(ownerCard).toHaveAttribute('aria-label', new RegExp(`${CLIENT_NAME}, 10:00–11:00`))
  await expect(employeeCard).toHaveAttribute('aria-label', new RegExp('Boris Client, 10:00–11:00'))
  await expect(ownerCard).toBeVisible()
  await expect(employeeCard).toBeVisible()
  const [ownerBox, employeeBox] = await Promise.all([ownerCard.boundingBox(), employeeCard.boundingBox()])
  expect(ownerBox && employeeBox).toBeTruthy()
  expect(ownerBox!.x + ownerBox!.width).toBeLessThanOrEqual(employeeBox!.x + 1)

  // Early appointments choose the initial scroll anchor; midnight is still rendered.
  await expect(page.locator(`[data-visit-id="${fixture.dragVisitId}"]`)).toBeInViewport()
  await expect.poll(() => page.locator('[data-calendar-scroll]').evaluate(element => element.scrollTop)).toBeLessThanOrEqual(64)
  await page.screenshot({ path: '.local-checks/redesign-calendar-dark-1280.png', fullPage: true })

  // a long staff name truncates inside its own header instead of widening the page
  const employeeHeader = page.locator(`[title="${EMPLOYEE_NAME}"]`)
  await expect(employeeHeader).toBeVisible()
  await expect(employeeHeader).toHaveCSS('text-overflow', 'ellipsis')
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1)

  // working windows, the lunch block and free gaps all render, even in the dark theme
  await expect(page.getByText('Free', { exact: true }).first()).toBeVisible()
  await expect(page.getByTitle('Lunch')).toBeVisible()
  await expect(page.getByTitle('Lunch')).toContainText('Blocked')
  await expect(page.getByText('Non-working hours', { exact: true })).toBeVisible()
  const cardBackground = await ownerCard.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(cardBackground).not.toBe('rgba(0, 0, 0, 0)')

  // the same visit lands on Monday in the week grid
  await page.getByRole('combobox', { name: 'Calendar view' }).selectOption('week')
  await expect(page.locator('[data-calendar-grid]')).toHaveCount(7)
  await expect(page.locator(`[data-calendar-grid="${DAY}"] [data-visit-id="${fixture.ownerVisitId}"]`)).toBeVisible()
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1)
  await page.getByRole('combobox', { name: 'Calendar view' }).selectOption('day')
  await expect(page.locator('[data-calendar-grid]')).toHaveCount(2)

  // an accessible dialog moves the visit and keeps its duration
  await ownerCard.click()
  const dialog = page.getByRole('dialog', { name: 'Move visit' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('input[type="date"]')).toHaveValue(DAY)
  await expect(dialog.locator('input[type="time"]')).toHaveValue('10:00')
  await dialog.locator('input[type="time"]').fill('16:00')
  await dialog.getByRole('button', { name: 'Move', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(ownerCard).toHaveAttribute('aria-label', /16:00–17:00/)

  // the owner's other visit cannot be moved onto the time just taken
  const dragCard = page.locator(`[data-visit-id="${fixture.dragVisitId}"]`)
  await expect(dragCard).toHaveAttribute('aria-label', /01:00–02:00/)
  await dragCard.click()
  await expect(dialog).toBeVisible()
  await dialog.locator('input[type="time"]').fill('16:00')
  await dialog.getByRole('button', { name: 'Move', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('This time is already taken')
  await expect(dragCard).toHaveAttribute('aria-label', /01:00–02:00/)
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  // dragging only previews; nothing is saved until the confirmation bar says so
  let putRequests = 0
  page.on('request', (r) => {
    if (r.method() === 'PUT' && /\/visits\/\d+/.test(r.url())) putRequests += 1
  })
  const grid = dragCard.locator('xpath=ancestor::*[@data-calendar-grid]')
  const previewBar = page.getByRole('region', { name: 'Move visit' })
  await dragCard.dragTo(grid, { targetPosition: { x: 80, y: 200 } })
  await expect(previewBar).toBeVisible()
  const previewLine = await previewBar.locator('p').nth(1).innerText()
  const previewSpan = previewLine.match(/(\d{2}:\d{2})–(\d{2}:\d{2})/)
  expect(previewSpan, previewLine).toBeTruthy()
  await previewBar.getByRole('button', { name: 'Cancel' }).click()
  await expect(previewBar).toBeHidden()
  expect(putRequests).toBe(0)
  await expect(dragCard).toHaveAttribute('aria-label', /01:00–02:00/)

  await dragCard.dragTo(grid, { targetPosition: { x: 80, y: 200 } })
  await expect(previewBar).toBeVisible()
  await previewBar.getByRole('button', { name: 'Move', exact: true }).click()
  await expect(previewBar).toBeHidden()
  await expect.poll(() => putRequests).toBe(1)
  await expect(dragCard).toHaveAttribute('aria-label', new RegExp(`${previewSpan![1]}–${previewSpan![2]}`))
})

test('the day and week grids and the move dialog fit a 375px screen', async ({ page, request }) => {
  const fixture = await calendarFixture(request)
  await page.setViewportSize({ width: 375, height: 812 })
  await installClock(page)
  await openAs(page, fixture.owner, '/app/calendar')

  await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible()
  await expect(page.locator('[data-calendar-grid]')).toHaveCount(2)
  const ownerCard = page.locator(`[data-visit-id="${fixture.ownerVisitId}"]`)
  await expect(ownerCard).toBeVisible()
  await expect(ownerCard).toHaveAttribute('aria-label', new RegExp(`${CLIENT_NAME}, 10:00–11:00`))
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1)

  const allHours = page.locator('[data-calendar-scroll]')
  await expect.poll(() => allHours.evaluate(element => element.scrollTop)).toBeGreaterThan(400)
  await expect(allHours.getByText('00:00', { exact: true })).toHaveCount(1)
  await expect(allHours.getByText('23:00', { exact: true })).toHaveCount(1)
  await page.screenshot({ path: '.local-checks/redesign-calendar-light-375.png', fullPage: true })

  // two staff columns are wider than a phone, so the grid scrolls inside its own box
  const scrollBox = await page.locator('[data-calendar-grid]').first().evaluate((el) => {
    let node = el.parentElement
    while (node && getComputedStyle(node).overflowX !== 'auto') node = node.parentElement
    return node ? { scrollWidth: node.scrollWidth, clientWidth: node.clientWidth } : null
  })
  expect(scrollBox).not.toBeNull()
  expect(scrollBox!.scrollWidth).toBeGreaterThan(scrollBox!.clientWidth)

  await ownerCard.click()
  const dialog = page.getByRole('dialog', { name: 'Move visit' })
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.y).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(375)
  expect(box!.y + box!.height).toBeLessThanOrEqual(812)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.getByRole('combobox', { name: 'Calendar view' }).selectOption('week')
  await expect(page.locator('[data-calendar-grid]')).toHaveCount(7)
  await expect(page.locator(`[data-calendar-grid="${DAY}"] [data-visit-id="${fixture.ownerVisitId}"]`)).toBeVisible()
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1)
})
