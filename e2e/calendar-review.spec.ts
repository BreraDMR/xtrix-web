import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiPost, apiUrl, newOwner, openAs, unique, type Session } from './helpers'

// CAL-09 review: a busy synthetic day, not an empty calendar. Two masters, 25 visits on
// Monday 6 May 2030 in Prague - back-to-back 15-minute services, half-hour cuts at the same
// instants in both columns, and a late visit that crosses midnight.

type Language = 'en' | 'ru' | 'cz'

const TIME_ZONE = 'Europe/Prague'
const DAY = '2030-05-06'
const CLOCK = new Date('2030-05-06T08:30:00+02:00')
const STAFF_NAME = 'Maximilian Alexander Verylong Staffname'

interface BusyDay {
  owner: Session
  staffId: number
  ownerVisits: number[]
  staffVisits: number[]
  nightVisit: number
}

const iso = (minutesFromNine: number) =>
  // 09:00 Prague is 07:00Z in May
  new Date(Date.UTC(2030, 4, 6, 7, 0) + minutesFromNine * 60_000).toISOString()

async function busyDay(request: APIRequestContext): Promise<BusyDay> {
  const owner = await newOwner(request)
  const business = await request.put(`${apiUrl}/businesses/${owner.user.business_id}`, {
    headers: owner.headers, data: { timezone: TIME_ZONE },
  })
  expect(business.ok(), await business.text()).toBeTruthy()

  const staff = await apiPost<{ employee_user_id: number }>(request, owner, '/employees/create-with-user', {
    full_name: STAFF_NAME, email: `${unique('cal-staff')}@example.com`, position: 'Stylist',
  })
  for (const specialistId of [owner.user.id, staff.employee_user_id]) {
    await apiPost(request, owner, '/schedules/work', {
      specialist_id: specialistId, weekday: 0, start_time: '09:00', end_time: '18:00',
    })
  }
  // 17:00-18:00 Prague, after the last visit
  await apiPost(request, owner, '/schedules/blocks', {
    specialist_id: staff.employee_user_id, start: '2030-05-06T15:00:00Z', end: '2030-05-06T16:00:00Z', reason: 'Training',
  })

  const clients: number[] = []
  for (let index = 0; index < 6; index += 1) {
    clients.push((await apiPost<{ id: number }>(request, owner, '/clients/', {
      full_name: `Review Client ${index + 1}`, contact_phone: `+42070000${String(300 + index)}`,
    })).id)
  }
  const visit = async (index: number, specialistId: number, start: number, minutes: number) =>
    (await apiPost<{ id: number }>(request, owner, '/visits/', {
      client_id: clients[index % clients.length], specialist_id: specialistId,
      date_start: iso(start), date_end: iso(start + minutes), price: 25 + index, service_name: `Service ${index}`,
    })).id

  const ownerVisits: number[] = []
  const staffVisits: number[] = []
  // owner: eight 15-minute services 09:00-11:00, then four 30-minute cuts 11:00-13:00
  for (let index = 0; index < 8; index += 1) ownerVisits.push(await visit(index, owner.user.id, index * 15, 15))
  for (let index = 0; index < 4; index += 1) ownerVisits.push(await visit(8 + index, owner.user.id, 120 + index * 30, 30))
  // staff: twelve 30-minute cuts 09:00-15:00, so 11:00-13:00 matches the owner slot for slot
  for (let index = 0; index < 12; index += 1) staffVisits.push(await visit(12 + index, staff.employee_user_id, index * 30, 30))
  // 23:30-00:30 Prague: shows up clipped at the top of Monday
  const nightVisit = (await apiPost<{ id: number }>(request, owner, '/visits/', {
    client_id: clients[0], specialist_id: staff.employee_user_id,
    date_start: '2030-05-05T21:30:00Z', date_end: '2030-05-05T22:30:00Z', price: 60, service_name: 'Night colour',
  })).id
  return { owner, staffId: staff.employee_user_id, ownerVisits, staffVisits, nightVisit }
}

const pageOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

async function boxes(cards: Locator[]) {
  const result = []
  for (const card of cards) {
    const box = await card.boundingBox()
    expect(box).not.toBeNull()
    result.push(box!)
  }
  return result
}

const overlaps = (a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }) =>
  a.x < b.x + b.width - 1 && b.x < a.x + a.width - 1 && a.y < b.y + b.height - 1 && b.y < a.y + a.height - 1

const CASES: { language: Language; theme: 'light' | 'dark'; width: number }[] = [
  { language: 'en', theme: 'light', width: 1280 },
  { language: 'ru', theme: 'dark', width: 375 },
  { language: 'cz', theme: 'dark', width: 1280 },
  { language: 'en', theme: 'dark', width: 375 },
]

for (const { language, theme, width } of CASES) {
  test(`a busy day of 25 visits stays readable (${language}, ${theme}, ${width})`, async ({ page, request }) => {
    const t = (key: TranslationKey) => translations[key][language]
    const fixture = await busyDay(request)
    await page.setViewportSize({ width, height: 900 })
    await page.clock.install({ time: CLOCK })
    await page.clock.resume()
    // openAs waits for the English logout button, so the language goes in after the login
    await openAs(page, fixture.owner, '/app/calendar')
    const prefs = await request.put(`${apiUrl}/user-preferences/me`, {
      headers: fixture.owner.headers, data: { theme, language },
    })
    expect(prefs.ok(), await prefs.text()).toBeTruthy()
    await page.reload()

    await expect(page.getByRole('heading', { name: t('calendar.title'), level: 1 })).toBeVisible()
    await expect.poll(() => page.locator('html').evaluate((el) => el.classList.contains('dark'))).toBe(theme === 'dark')
    await expect(page.locator('[data-calendar-grid]')).toHaveCount(2)
    const all = [...fixture.ownerVisits, ...fixture.staffVisits, fixture.nightVisit]
    await expect(page.locator('[data-visit-id]')).toHaveCount(all.length)

    // every card names its client, time, price and status in the user's language
    const first = page.locator(`[data-visit-id="${fixture.ownerVisits[0]}"]`)
    await expect(first).toHaveAttribute('aria-label', new RegExp(`Review Client 1, 09:00–09:15, ${t('visits.price')} .*25`))
    await expect(page.locator(`[data-visit-id="${fixture.nightVisit}"]`)).toHaveAttribute('aria-label', /23:30–00:30/)

    // no card covers another one: not within a column, not across columns
    const cards = await boxes(all.map((id) => page.locator(`[data-visit-id="${id}"]`)))
    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        expect(overlaps(cards[i], cards[j]), `visit ${all[i]} covers visit ${all[j]}`).toBe(false)
      }
    }
    // the same 11:00 slot sits in two different columns at the same height
    const [ownerCut, staffCut] = await boxes([
      page.locator(`[data-visit-id="${fixture.ownerVisits[8]}"]`),
      page.locator(`[data-visit-id="${fixture.staffVisits[4]}"]`),
    ])
    expect(Math.abs(ownerCut.y - staffCut.y)).toBeLessThanOrEqual(1)
    expect(ownerCut.x + ownerCut.width).toBeLessThanOrEqual(staffCut.x + 1)

    await expect(page.getByTitle('Training')).toContainText(t('calendar.blocked'))
    await expect(page.locator(`[title="${STAFF_NAME}"] span.truncate`)).toHaveCSS('text-overflow', 'ellipsis')
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1)
    await page.screenshot({ path: test.info().outputPath(`calendar-day-${language}-${theme}-${width}.png`), fullPage: true })

    // keyboard path: focus a card, Enter opens the move dialog, Escape leaves it alone
    await first.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: t('calendar.moveTitle') })
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('input[type="time"]')).toHaveValue('09:00')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // week view keeps all of Monday's visits; Next/Previous/Today stay on one anchor date
    const view = page.getByRole('combobox', { name: t('calendar.view') })
    await view.selectOption('week')
    await expect(page.locator('[data-calendar-grid]')).toHaveCount(7)
    await expect(page.locator(`[data-calendar-grid="${DAY}"] [data-visit-id]`)).toHaveCount(all.length)
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1)
    await page.screenshot({ path: test.info().outputPath(`calendar-week-${language}-${theme}-${width}.png`), fullPage: true })

    await page.getByRole('button', { name: t('calendar.next'), exact: true }).click()
    await expect(page.locator('[data-calendar-grid="2030-05-13"]')).toHaveCount(1)
    await expect(page.locator('[data-visit-id]')).toHaveCount(0)
    await view.selectOption('day')
    await expect(page.locator('[data-calendar-grid="2030-05-13"]')).toHaveCount(2)
    await page.getByRole('button', { name: t('calendar.previous'), exact: true }).click()
    await expect(page.locator('[data-calendar-grid="2030-05-12"]')).toHaveCount(2)
    await page.getByRole('button', { name: t('calendar.today'), exact: true }).click()
    await expect(page.locator(`[data-calendar-grid="${DAY}"]`)).toHaveCount(2)
    await expect(page.locator('[data-visit-id]')).toHaveCount(all.length)
  })
}
