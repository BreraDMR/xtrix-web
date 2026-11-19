import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiLogin, apiUrl, PASSWORD } from './helpers'

// CPA-20: one person goes the whole way on the real stack - signs up through the mail
// link, finds an empty cabinet, gets linked by two salons, books one more visit as a
// guest, reads details, survives a broken call and a salon that stopped paying, then
// signs out and back in. Only the synthetic salons and the "stopped paying" switch use SQL.
type Salon = {
  key: 'a' | 'b'; businessId: number; name: string; ownerId: number; ownerEmail: string
  clientId: number; visits: { upcoming: number; past: number }; slug?: string
}
type Fixture = { email: string; crmPassword: string; salons: [Salon, Salon] }

function seed(): Fixture {
  if (!process.env.API_PYTHON || !process.env.E2E_API_DIR) throw new Error('Use scripts/e2e.sh')
  return JSON.parse(execFileSync(process.env.API_PYTHON, [path.resolve('e2e/fixtures/visitor-journey.py')], {
    cwd: tmpdir(), env: { ...process.env, PYTHONPATH: process.env.E2E_API_DIR }, encoding: 'utf8',
  })) as Fixture
}
function sql(query: string): string {
  if (!process.env.E2E_PG_CONTAINER || !process.env.E2E_PG_DB) throw new Error('Use scripts/e2e.sh')
  return execFileSync('docker', ['exec', process.env.E2E_PG_CONTAINER, 'psql', '-U', 'postgres', '-d', process.env.E2E_PG_DB, '-tAc', query], { encoding: 'utf8' }).trim()
}
function registrationLink(email: string): string | null {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file || !fs.existsSync(file)) return null
  const messages = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map(line => JSON.parse(line) as { recipient: string; text: string })
  return messages.find(message => message.recipient === email)?.text
    .match(/https?:\/\/[^\s]+\/visitor\/register#token=[^\s]+/)?.[0] ?? null
}
async function fitsScreen(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
}

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`visitor journey ${locale} ${theme} ${width}`, async ({ page, request }, testInfo) => {
        test.setTimeout(120_000)
        const fixture = seed()
        const [a, b] = fixture.salons
        const t = (key: TranslationKey) => translations[key][locale]
        const shot = (name: string) => page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true })
        await page.setViewportSize({ width, height: 900 })
        await page.addInitScript(({ language, color }) => {
          localStorage.setItem('app_locale', language)
          localStorage.setItem('theme', color)
        }, { language: locale, color: theme })
        const crmCalls: string[] = []
        page.on('request', req => {
          if (/^\/(users|businesses|subscriptions|clients)(\/|\?|$)/.test(new URL(req.url()).pathname)) crmCalls.push(req.url())
        })
        const clientsByEmail = () => sql(`SELECT count(*) FROM clients WHERE contact_email='${fixture.email}'`)
        const otherSalonVisits = () => sql(`SELECT md5(string_agg(row_to_json(v)::text, '' ORDER BY id)) FROM visits v WHERE business_id=${b.businessId}`)

        // 1. Signup through the captured mail, then an empty cabinet.
        await page.goto('/visitor/signup')
        await page.getByLabel(t('field.email'), { exact: true }).fill(fixture.email)
        await page.getByRole('button', { name: t('visitor.signup.submit'), exact: true }).click()
        await expect(page.getByRole('heading', { name: t('visitor.request.sentTitle') })).toBeVisible()
        await expect.poll(() => registrationLink(fixture.email)).not.toBeNull()
        await page.goto(registrationLink(fixture.email)!)
        await page.getByLabel(t('visitor.password.new'), { exact: true }).fill(PASSWORD)
        await page.getByLabel(t('visitor.password.repeat'), { exact: true }).fill(PASSWORD)
        await page.getByRole('button', { name: t('visitor.register.submit'), exact: true }).click()
        await expect(page).toHaveURL(/\/visitor\/visits$/)
        await expect(page.getByRole('heading', { name: t('visitor.feed.emptyTitle') })).toBeVisible()
        // Signing up alone links nothing, even though both salons know this email.
        expect(sql(`SELECT count(*) FROM visitor_grants g JOIN visitor_accounts va ON va.id=g.account_id WHERE va.email_canonical='${fixture.email}'`)).toBe('0')
        await fitsScreen(page)
        await shot('1-empty')

        // 2. Both salons invite the person from their CRM; the cabinet now spans two CRMs.
        for (const salon of [a, b]) {
          const owner = await apiLogin(request, salon.ownerEmail, fixture.crmPassword)
          const issued = await request.post(`${apiUrl}/clients/${salon.clientId}/visitor-invitations`, { headers: owner.headers, data: { email: fixture.email } })
          expect(issued.status(), await issued.text()).toBe(201)
          const { token } = await issued.json() as { token: string }
          await page.goto(`/visitor/claim#invite=${encodeURIComponent(token)}`)
          await expect(page).toHaveURL(/\/visitor\/visits$/)
          await expect(page.getByText(t('visitor.claim.savedInvite'), { exact: true })).toBeVisible()
        }
        const cards = page.locator('main ul > li')
        const shown = () => cards.locator('a').evaluateAll(links => links.map(link => Number(new URL((link as HTMLAnchorElement).href).pathname.split('/').at(-1))))
        const ids = async () => (await shown()).sort((x, y) => x - y)
        await expect(cards).toHaveCount(2)
        expect(await ids()).toEqual([a.visits.upcoming, b.visits.upcoming].sort((x, y) => x - y))
        await expect(cards.filter({ hasText: a.name })).toHaveCount(1)
        await expect(cards.filter({ hasText: b.name })).toHaveCount(1)
        const salonFilter = page.getByRole('combobox', { name: t('visitor.feed.salon'), exact: true })
        await expect(salonFilter.locator('option', { hasText: a.name })).toHaveCount(1)
        await expect(salonFilter.locator('option', { hasText: b.name })).toHaveCount(1)
        await page.getByRole('tab', { name: t('visitor.feed.past'), exact: true }).click()
        await expect(cards).toHaveCount(2)
        expect(await ids()).toEqual([a.visits.past, b.visits.past].sort((x, y) => x - y))
        await fitsScreen(page)
        await shot('2-two-salons')

        // 3. A guest booking at salon A with the same email lands on the same CRM card, and
        // the cabinet shows it once - before and after "save to account".
        const clientsBefore = clientsByEmail()
        const salonBBefore = otherSalonVisits()
        await page.goto(`/booking/${a.slug}`)
        await page.getByRole('button', { name: /Journey Cut/ }).click()
        await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
        await page.getByRole('button', { name: t('booking.anyMaster'), exact: true }).click()
        const slot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
        await expect(slot).toBeVisible()
        await slot.click()
        await page.locator('input[name="full_name"]').fill('Journey Visitor')
        await page.locator('input[name="email"]').fill(fixture.email)
        await page.getByRole('checkbox', { name: t('booking.processingConsent'), exact: true }).check()
        await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
        const booked = page.waitForResponse(r => r.url().endsWith('/bookings') && r.request().method() === 'POST')
        await page.getByRole('button', { name: t('booking.confirm'), exact: true }).click()
        const bookingResponse = await booked
        expect(bookingResponse.status()).toBe(200)
        const booking = await bookingResponse.json() as { id: number }
        expect(clientsByEmail()).toBe(clientsBefore)
        expect(sql(`SELECT client_id FROM visits WHERE id=${booking.id}`)).toBe(String(a.clientId))
        await page.getByRole('link', { name: t('visitor.save.action'), exact: true }).click()
        await expect(page).toHaveURL(/\/visitor\/visits$/)
        await expect(cards).toHaveCount(3)
        // nearest first: the fresh booking is the earliest free slot, then A in 5 days, then B in 6
        expect(await shown()).toEqual([booking.id, a.visits.upcoming, b.visits.upcoming])
        expect(clientsByEmail()).toBe(clientsBefore)
        expect(otherSalonVisits()).toBe(salonBBefore)

        // 4. Details of a working salon, then a broken actions call that recovers on retry.
        let failActions = true
        await page.route(`**/visitor/visits/${a.visits.upcoming}/actions`, route => failActions
          ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Synthetic outage', status_code: 503 } }) })
          : route.fallback())
        await page.goto(`/visitor/visits/${a.visits.upcoming}`)
        await expect(page.getByRole('heading', { level: 1, name: a.name })).toBeVisible()
        await expect(page.getByText(t('visitor.action.loadFailed'), { exact: true })).toBeVisible()
        await expect(page.locator('main')).toContainText('Journey A upcoming')
        await fitsScreen(page)
        await shot('4-partial-error')
        failActions = false
        await page.getByRole('button', { name: t('common.retry'), exact: true }).click()
        await expect(page.getByRole('button', { name: t('visitor.action.confirm'), exact: true })).toBeVisible()

        // 5. Salon B stops paying: its visits stay readable, but nothing can be changed online.
        sql(`UPDATE subscriptions SET current_period_end = now() - interval '10 days' WHERE user_id=${b.ownerId}`)
        await page.goto(`/visitor/visits/${b.visits.upcoming}`)
        await expect(page.getByRole('heading', { level: 1, name: b.name })).toBeVisible()
        await expect(page.getByText(t('visitor.reason.unavailableSalon'), { exact: true })).toBeVisible()
        for (const action of ['confirm', 'cancel', 'reschedule'] as const) {
          await expect(page.getByRole('button', { name: t(`visitor.action.${action}`), exact: true })).toHaveCount(0)
        }
        await fitsScreen(page)
        await shot('5-blocked-salon')
        await page.goto('/visitor/visits')
        await expect(cards).toHaveCount(3)

        // 6. Sign out, the cabinet is closed; sign back in with the password and see the same visits.
        const oldToken = await page.evaluate(() => JSON.parse(sessionStorage.getItem('visitor_session')!).token as string)
        await page.goto('/visitor/profile')
        await page.getByRole('button', { name: t('visitor.sessions.signOut'), exact: true }).click()
        await expect(page).toHaveURL(/\/visitor\/login/)
        await expect.poll(async () => (await request.get(`${apiUrl}/visitor/me`, { headers: { 'X-Visitor-Token': oldToken } })).status()).toBe(401)
        await page.goto('/visitor/visits')
        await expect(page).toHaveURL(/\/visitor\/login\?/)
        await page.getByLabel(t('field.email'), { exact: true }).fill(fixture.email)
        await page.getByLabel(t('field.password'), { exact: true }).fill(PASSWORD)
        await page.getByRole('button', { name: t('visitor.login.submit'), exact: true }).click()
        await expect(page).toHaveURL(/\/visitor\/visits$/)
        await expect(cards).toHaveCount(3)
        expect(await shown()).toEqual([booking.id, a.visits.upcoming, b.visits.upcoming])
        await fitsScreen(page)
        await shot('6-back-in')

        // The visitor side never touched a CRM endpoint from the browser.
        expect(crmCalls).toEqual([])
        expect(clientsByEmail()).toBe(clientsBefore)
        await testInfo.attach('journey', {
          body: JSON.stringify({ salons: [a.businessId, b.businessId], booking: booking.id, clientsByEmail: clientsBefore, crmCalls }),
          contentType: 'application/json',
        })
      })
    }
  }
}
