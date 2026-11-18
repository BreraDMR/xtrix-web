import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiUrl } from './helpers'

type Account = { email: string; password: string; session: { token: string; expiresAt: string } }
type Fixture = { slug: string; businessId: number; accounts: Account[] }
function seed(): Fixture {
  if (!process.env.API_PYTHON || !process.env.E2E_API_DIR) throw new Error('Use scripts/e2e.sh')
  return JSON.parse(execFileSync(process.env.API_PYTHON, [path.resolve('e2e/fixtures/visitor-claim.py')], {
    cwd: tmpdir(), env: { ...process.env, PYTHONPATH: process.env.E2E_API_DIR }, encoding: 'utf8',
  })) as Fixture
}
function sql(query: string): string {
  if (!process.env.E2E_PG_CONTAINER || !process.env.E2E_PG_DB) throw new Error('Use scripts/e2e.sh')
  return execFileSync('docker', ['exec', process.env.E2E_PG_CONTAINER, 'psql', '-U', 'postgres', '-d', process.env.E2E_PG_DB, '-tAc', query], { encoding: 'utf8' }).trim()
}
function snapshot() {
  return sql(`SELECT (SELECT md5(string_agg(row_to_json(v)::text, '' ORDER BY id)) FROM visits v),
    (SELECT md5(string_agg(row_to_json(c)::text, '' ORDER BY id)) FROM clients c),
    (SELECT md5(string_agg(row_to_json(i)::text, '' ORDER BY id)) FROM visit_items i)`)
}
function registrationLink(email: string): string | null {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file || !fs.existsSync(file)) return null
  const messages = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map(line => JSON.parse(line) as { recipient: string; text: string })
  return messages.find(message => message.recipient === email)?.text
    .match(/https?:\/\/[^\s]+\/visitor\/register#token=[^\s]+/)?.[0] ?? null
}

// All booking and claim calls hit the real API. Only synthetic account setup uses SQL.
for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`guest booking claim ${locale} ${theme} ${width}`, async ({ page, context, request }, testInfo) => {
        const fixture = seed()
        const [owner, other] = fixture.accounts
        const t = (key: TranslationKey) => translations[key][locale]
        await page.setViewportSize({ width, height: 900 })
        await page.addInitScript(({ language, color }) => {
          localStorage.setItem('app_locale', language)
          localStorage.setItem('theme', color)
        }, { language: locale, color: theme })
        const writes: { path: string; data: unknown; authorization?: string }[] = []
        const watch = (tab: Page) => tab.on('request', req => {
          const url = new URL(req.url())
          if (url.origin === apiUrl && req.method() === 'POST' && url.pathname.includes('/claims/')) {
            writes.push({ path: url.pathname, data: req.postDataJSON(), authorization: req.headers().authorization })
          }
        })
        watch(page)
        await page.goto(`/booking/${fixture.slug}`)
        await expect(page.getByText(t('booking.noAccount'))).toBeVisible()
        await page.getByRole('button', { name: /Guest Claim Cut/ }).click()
        await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
        await page.getByRole('button', { name: t('booking.anyMaster'), exact: true }).click()
        const slot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
        await expect(slot).toBeVisible()
        await slot.click()
        await page.locator('input[name="full_name"]').fill('Synthetic Guest')
        // One case goes through registration in a separate tab; the rest exercise login.
        const signup = locale === 'en' && theme === 'light' && width === 1280
        const email = signup ? owner.email.replace('claim-owner-', 'claim-new-') : owner.email
        await page.locator('input[name="email"]').fill(email)
        await page.getByRole('checkbox', { name: t('booking.processingConsent'), exact: true }).check()
        await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
        const booked = page.waitForResponse(r => r.url().endsWith('/bookings') && r.request().method() === 'POST')
        await page.getByRole('button', { name: t('booking.confirm'), exact: true }).click()
        const bookingResponse = await booked
        expect(bookingResponse.status()).toBe(200)
        const booking = await bookingResponse.json() as { id: number; manage_token: string }
        expect(writes).toEqual([])
        expect(sql(`SELECT count(*) FROM visitor_grants WHERE visit_id=${booking.id}`)).toBe('0')
        expect(await page.evaluate(() => sessionStorage.getItem('visitor_session'))).toBeNull()
        const before = snapshot()
        const receiptsBefore = sql('SELECT count(*) FROM visitor_claims')
        await page.getByRole('link', { name: t('visitor.save.action'), exact: true }).click()
        await expect(page.getByRole('link', { name: t('visitor.login.submit'), exact: true })).toBeVisible()
        expect(new URL(page.url()).hash).toBe('')
        expect(writes).toEqual([])
        let cabinet = page
        if (signup) {
          await page.getByRole('link', { name: t('visitor.login.createAccount'), exact: true }).click()
          await page.getByLabel(t('field.email'), { exact: true }).fill(email)
          await page.getByRole('button', { name: t('visitor.signup.submit'), exact: true }).click()
          await expect.poll(() => registrationLink(email)).not.toBeNull()
          cabinet = await context.newPage()
          watch(cabinet)
          await cabinet.goto(registrationLink(email)!)
          await cabinet.getByLabel(t('visitor.password.new'), { exact: true }).fill(owner.password)
          await cabinet.getByLabel(t('visitor.password.repeat'), { exact: true }).fill(owner.password)
          await cabinet.getByRole('button', { name: t('visitor.register.submit'), exact: true }).click()
        } else {
          await page.getByRole('link', { name: t('visitor.login.submit'), exact: true }).click()
          await page.getByLabel(t('field.email'), { exact: true }).fill(owner.email)
          await page.getByLabel(t('field.password'), { exact: true }).fill(owner.password)
          await page.getByRole('button', { name: t('visitor.login.submit'), exact: true }).click()
        }
        await expect(cabinet).toHaveURL(/\/visitor\/visits$/)
        await expect(cabinet.getByText(t('visitor.claim.savedBooking'), { exact: true })).toBeVisible()
        await expect(cabinet.locator(`a[href="/visitor/visits/${booking.id}"]`)).toBeVisible()
        const session = await cabinet.evaluate(() => JSON.parse(sessionStorage.getItem('visitor_session')!) as Account['session'])
        const headers = { 'X-Visitor-Token': session.token }
        const feed = await request.get(`${apiUrl}/visitor/visits`, { headers })
        expect(feed.status()).toBe(200)
        expect((await feed.json()).entries.map((entry: { id: number }) => entry.id)).toEqual([booking.id])
        expect(writes).toEqual([{ path: '/visitor/claims/manage', data: { token: booking.manage_token }, authorization: undefined }])
        expect(snapshot()).toBe(before)
        expect(Number(sql('SELECT count(*) FROM visitor_claims'))).toBe(Number(receiptsBefore) + 1)
        // A deliberate repeat through /manage remains idempotent and ignores URL ids.
        await cabinet.goto(`/manage#token=${encodeURIComponent(booking.manage_token)}`)
        await cabinet.getByRole('link', { name: t('visitor.save.action'), exact: true }).click()
        await expect(cabinet).toHaveURL(/\/visitor\/visits$/)
        await cabinet.goto(`/visitor/claim?business_id=999999&client_id=999999#token=${encodeURIComponent(booking.manage_token)}`)
        await expect(cabinet).toHaveURL(/\/visitor\/visits$/)
        expect(writes).toHaveLength(3)
        expect(writes.every(write => JSON.stringify(write.data) === JSON.stringify({ token: booking.manage_token }) && !write.authorization)).toBe(true)
        for (const id of ['business_id', 'client_id', 'visit_id', 'account_id']) {
          const bad = await request.post(`${apiUrl}/visitor/claims/manage`, { headers, data: { token: booking.manage_token, [id]: 999999 } })
          expect(bad.status()).toBe(422)
        }
        // A different visitor gets a conflict and cannot read the original visit.
        const rival = await context.newPage()
        await rival.addInitScript(session => sessionStorage.setItem('visitor_session', JSON.stringify(session)), other.session)
        const refused = rival.waitForResponse(r => r.url() === `${apiUrl}/visitor/claims/manage`)
        await rival.goto(`/visitor/claim#token=${encodeURIComponent(booking.manage_token)}`)
        expect((await refused).status()).toBe(409)
        await expect(rival).toHaveURL(/\/visitor\/visits$/)
        const hidden = await request.get(`${apiUrl}/visitor/visits/${booking.id}`, { headers: { 'X-Visitor-Token': other.session.token } })
        expect(hidden.status()).toBe(404)
        await rival.close()
        expect(sql(`SELECT count(*) FROM visitor_grants WHERE visit_id=${booking.id}`)).toBe('1')
        expect(Number(sql('SELECT count(*) FROM visitor_claims'))).toBe(Number(receiptsBefore) + 1)
        expect(snapshot()).toBe(before)
        expect(await cabinet.evaluate(() => localStorage.getItem('visitor_pending_claim'))).toBeNull()
        expect(await cabinet.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await cabinet.screenshot({ path: testInfo.outputPath('claimed-visit.png'), fullPage: true })
        await testInfo.attach('claim-acceptance', { body: JSON.stringify({ visitId: booking.id, unchangedCrm: true, grants: 1, writes: writes.length, signup }), contentType: 'application/json' })
        if (cabinet !== page) {
          // The original tab cannot revive the consumed link after cross-tab signup.
          await page.goto('/visitor/claim')
          await expect(page.getByRole('heading', { name: t('visitor.claim.noLinkTitle') })).toBeVisible()
          await cabinet.close()
        }
      })
    }
  }
}
