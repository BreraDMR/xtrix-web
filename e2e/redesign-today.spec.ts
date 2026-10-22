import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { apiPost, apiUrl, field, newOwner, openAs, unique, waitForFormData, type Session } from './helpers'

// Prague is UTC+2 on this synthetic day. A UTC calendar-day filter would drop Early
// and include Tomorrow, so checking both edges exercises the real business range.
const DAY = '2030-05-06'
const CLOCK = new Date(`${DAY}T10:00:00+02:00`)
const OWNER = 'Alexandra Verylongsurname Owner'
const STAFF = 'Maximilian Alexander Staffname'
const SERVICE = 'Consultation and follow-up'
const NAMES = { early: 'Early Prague Client', late: 'Late Prague Client',
  yesterday: 'Yesterday Client', tomorrow: 'Tomorrow Client', created: 'New Workday Client' }

test.use({ timezoneId: 'Europe/Prague' })

type Fixture = { owner: Session; serviceId: number; newClientId: number; earlyClientId: number }

async function fixture(request: APIRequestContext): Promise<Fixture> {
  const owner = await newOwner(request, { fullName: OWNER })
  const business = await request.put(`${apiUrl}/businesses/${owner.user.business_id}`, {
    headers: owner.headers, data: { timezone: 'Europe/Prague' },
  })
  expect(business.ok(), await business.text()).toBeTruthy()
  // Persist first-run choices through the real endpoint; no overlays obscure the test.
  const onboarding = await request.patch(`${apiUrl}/onboarding/me`, {
    headers: owner.headers, data: { welcome_dismissed: true, checklist_dismissed: true, tour_dismissed: true },
  })
  expect(onboarding.ok(), await onboarding.text()).toBeTruthy()
  const employee = await apiPost<{ employee_user_id: number }>(request, owner, '/employees/create-with-user', {
    full_name: STAFF, email: `${unique('agenda-staff')}@example.com`, position: 'Specialist',
  })
  const service = await apiPost<{ id: number }>(request, owner, '/services/', {
    name: SERVICE, specialist_id: owner.user.id, specialist_ids: [employee.employee_user_id],
    duration_minutes: 30, price: 40,
  })
  const clients = new Map<string, number>()
  for (const name of Object.values(NAMES)) {
    const client = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: name })
    clients.set(name, client.id)
  }
  const add = (name: string, specialist_id: number, date_start: string, status = 'planned') =>
    apiPost<{ id: number }>(request, owner, '/visits/', {
      client_id: clients.get(name), specialist_id, service_id: service.id, service_name: SERVICE,
      date_start, date_end: new Date(Date.parse(date_start) + 30 * 60_000).toISOString(),
      price: 40, status,
    })
  await add(NAMES.yesterday, owner.user.id, '2030-05-05T21:00:00Z') // May 5, 23:00
  await add(NAMES.early, owner.user.id, '2030-05-05T22:30:00Z', 'completed') // May 6, 00:30
  await add(NAMES.late, employee.employee_user_id, '2030-05-06T21:00:00Z') // May 6, 23:00
  await add(NAMES.tomorrow, owner.user.id, '2030-05-06T22:30:00Z') // May 7, 00:30
  return { owner, serviceId: service.id, newClientId: clients.get(NAMES.created)!, earlyClientId: clients.get(NAMES.early)! }
}

async function clock(page: Page) {
  await page.clock.install({ time: CLOCK })
  await page.clock.resume()
}

function agenda(page: Page, name = "Today's appointments") {
  return page.getByRole('region', { name, exact: true })
}
function visitRow(region: Locator, name: string) {
  return region.getByRole('listitem').filter({ hasText: name })
}
async function fits(page: Page) {
  expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
    - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
}
async function screenshot(page: Page, name: string) {
  await mkdir('.local-checks', { recursive: true })
  await page.screenshot({ path: `.local-checks/redesign-today-${name}.png`, fullPage: true, animations: 'disabled' })
}

test('workday filters by Prague day, opens keyboard panels and refreshes after a real creation', async ({ page, request }) => {
  test.setTimeout(90_000)
  const data = await fixture(request)
  await page.setViewportSize({ width: 1280, height: 900 })
  await clock(page)
  const dayRequest = page.waitForRequest(r => {
    const url = new URL(r.url())
    return r.method() === 'GET' && url.pathname.endsWith('/visits/')
      && url.searchParams.get('date_from') === '2030-05-05T22:00:00.000Z'
  })
  await openAs(page, data.owner, '/app')
  await expect(page.getByRole('heading', { name: 'Workday', level: 1 })).toBeVisible()
  const range = new URL((await dayRequest).url()).searchParams
  expect(range.get('date_to')).toBe('2030-05-06T21:59:59.999Z')
  expect(range.get('sort_by')).toBe('date_start')
  expect(range.get('sort_order')).toBe('asc')
  const today = agenda(page)
  await expect(today.getByRole('listitem')).toHaveCount(2)
  await expect(visitRow(today, NAMES.early)).toContainText('00:30')
  await expect(visitRow(today, NAMES.late)).toContainText('23:00')
  await expect(today.getByText(NAMES.yesterday, { exact: true })).toHaveCount(0)
  await expect(today.getByText(NAMES.tomorrow, { exact: true })).toHaveCount(0)
  await expect(visitRow(today, NAMES.early)).toContainText(OWNER)
  await expect(visitRow(today, NAMES.late)).toContainText(STAFF)
  const overview = page.getByRole('region', { name: 'Business overview', exact: true })
  await expect(overview.locator('dd')).toHaveCount(11)
  await expect(overview.locator('dl > div').filter({ has: page.locator('dt', { hasText: /^Total Visits$/ }) }).locator('dd')).toHaveText('4')
  const ordered = await page.evaluate(() => {
    const agenda = document.querySelector('section[aria-label="Today\'s appointments"]')
    const overview = document.getElementById('business-overview-title')
    return !!agenda && !!overview && !!(agenda.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(ordered).toBe(true)

  const newButton = page.getByRole('button', { name: 'New Visit', exact: true })
  await newButton.focus()
  await page.keyboard.press('Enter')
  let panel = page.getByRole('dialog', { name: 'New Visit', exact: true })
  await expect(panel).toBeVisible()
  expect(await panel.evaluate(el => el instanceof HTMLDialogElement && el.open)).toBe(true)
  await page.keyboard.press('Tab')
  expect(await panel.evaluate(el => el.contains(document.activeElement))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(newButton).toBeFocused()

  const editButton = today.getByRole('button', { name: `Edit: ${NAMES.early}`, exact: true })
  await editButton.focus()
  await page.keyboard.press('Enter')
  panel = page.getByRole('dialog', { name: 'Edit visit', exact: true })
  await expect(panel).toBeVisible()
  await waitForFormData(page)
  await expect(field(panel, /^Client/)).toHaveValue(String(data.earlyClientId))
  await expect(field(panel, /^Start Date & Time/)).toHaveValue(`${DAY}T00:30`)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(editButton).toBeFocused()

  await newButton.click()
  panel = page.getByRole('dialog', { name: 'New Visit', exact: true })
  await expect(panel).toBeVisible()
  await waitForFormData(page)
  await field(panel, /^Client/).selectOption(String(data.newClientId))
  await field(panel, /^Service$/).selectOption(String(data.serviceId))
  // Selecting the service is asynchronous; wait for its actual details before typing dates.
  await expect(field(panel, /^Service Name/)).toHaveValue(SERVICE)
  await field(panel, /^Start Date & Time/).fill(`${DAY}T14:00`)
  await field(panel, /^End Date & Time/).fill(`${DAY}T14:30`)
  const saved = page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/visits/'))
  await panel.getByRole('button', { name: 'Create Visit', exact: true }).click()
  const response = await saved
  expect(response.ok(), await response.text()).toBeTruthy()
  const created = await response.json()
  expect(Date.parse(created.date_start)).toBe(Date.parse('2030-05-06T12:00:00Z'))
  await expect(panel).toBeHidden()
  await expect(today.getByRole('listitem')).toHaveCount(3)
  await expect(visitRow(today, NAMES.created)).toContainText('14:00')
  await expect(visitRow(today, NAMES.created)).toContainText(SERVICE)
  await expect(overview.locator('dl > div').filter({ has: page.locator('dt', { hasText: /^Total Visits$/ }) }).locator('dd')).toHaveText('5')
  await fits(page)
  await screenshot(page, 'create-en-desktop')
  await page.getByRole('link', { name: 'Open calendar', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/calendar$/)
})

const copies = {
  en: { heading: 'Workday', agenda: "Today's appointments", overview: 'Business overview',
    planned: 'Planned', completed: 'Completed', quick: 'Quick navigation', newVisit: 'New Visit' },
  ru: { heading: 'Рабочий день', agenda: 'Записи на сегодня', overview: 'Обзор бизнеса',
    planned: 'Запланирован', completed: 'Завершен', quick: 'Быстрая навигация', newVisit: 'Новый визит' },
  cz: { heading: 'Pracovní den', agenda: 'Dnešní návštěvy', overview: 'Přehled podnikání',
    planned: 'Plánováno', completed: 'Dokončeno', quick: 'Rychlá navigace', newVisit: 'Nová návštěva' },
} as const

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${locale} ${theme}: workday fits desktop and mobile without hiding staff or status`, async ({ page, request }) => {
      test.setTimeout(90_000)
      const data = await fixture(request)
      await clock(page)
      // openAs logs in with English labels. Apply the saved language only after that,
      // then reload so this also exercises the real preference synchronization.
      await openAs(page, data.owner, '/app')
      const preferences = await request.put(`${apiUrl}/user-preferences/me`, {
        headers: data.owner.headers, data: { language: locale, theme },
      })
      expect(preferences.ok(), await preferences.text()).toBeTruthy()
      await page.reload()
      const copy = copies[locale]
      await expect(page.getByRole('heading', { name: copy.heading, level: 1 })).toBeVisible()
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      else await expect(page.locator('html')).not.toHaveClass(/dark/)
      const today = agenda(page, copy.agenda)
      await expect(today.getByRole('listitem')).toHaveCount(2)
      await expect(page.getByRole('region', { name: copy.overview, exact: true }).locator('dd')).toHaveCount(11)
      for (const width of [1280, 375]) {
        await page.setViewportSize({ width, height: 900 })
        await page.evaluate(() => window.scrollTo(0, 0))
        await expect(visitRow(today, NAMES.early).getByText(OWNER, { exact: false })).toBeVisible()
        await expect(visitRow(today, NAMES.early).getByText(copy.completed, { exact: false })).toBeVisible()
        await expect(visitRow(today, NAMES.late).getByText(STAFF, { exact: false })).toBeVisible()
        await expect(visitRow(today, NAMES.late).getByText(copy.planned, { exact: false })).toBeVisible()
        await fits(page)
        const footer = today.locator('footer')
        await footer.scrollIntoViewIfNeeded()
        await expect(footer).toContainText('Europe/Prague')
        if (width === 375) {
          const bottomNav = page.getByRole('navigation', { name: copy.quick, exact: true })
          await expect(bottomNav).toBeVisible()
          const navBox = await bottomNav.boundingBox()
          const footerBox = await footer.boundingBox()
          expect(navBox && footerBox).toBeTruthy()
          expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(navBox!.y + 1)
          // The last business-summary value must remain above the fixed navigation
          // at the end of the document, not merely be scrollable under it.
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
          const lastValue = page.getByRole('region', { name: copy.overview, exact: true }).locator('dd').last()
          await expect(lastValue).toBeInViewport()
          const lastBox = await lastValue.boundingBox()
          expect(lastBox).not.toBeNull()
          expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(navBox!.y + 1)
        }
        await page.evaluate(() => window.scrollTo(0, 0))
        await screenshot(page, `${locale}-${theme}-${width}`)
        if (width === 375) {
          const newVisit = page.getByRole('button', { name: copy.newVisit, exact: true })
          await newVisit.click()
          const panel = page.getByRole('dialog', { name: copy.newVisit, exact: true })
          await expect(panel).toBeVisible()
          await waitForFormData(page)
          const box = await panel.boundingBox()
          expect(box!.x).toBeGreaterThanOrEqual(0)
          expect(box!.x + box!.width).toBeLessThanOrEqual(width)
          expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
          await page.keyboard.press('Escape')
          await expect(panel).toBeHidden()
          await expect(newVisit).toBeFocused()
        }
      }
    })
  }
}
