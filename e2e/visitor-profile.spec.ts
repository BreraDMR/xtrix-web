import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiUrl } from './helpers'

type Session = { token: string; expiresAt: string }
type Fixture = { email: string; newEmail: string; password: string; accountId: number; staffId: number; clientId: number; visitId: number; businessId: number; sessions: Session[] }
function seed(): Fixture {
  if (!process.env.API_PYTHON || !process.env.E2E_API_DIR) throw new Error('Use scripts/e2e.sh')
  return JSON.parse(execFileSync(process.env.API_PYTHON, [path.resolve('e2e/fixtures/visitor-profile.py')], {
    cwd: tmpdir(), env: { ...process.env, PYTHONPATH: process.env.E2E_API_DIR }, encoding: 'utf8',
  })) as Fixture
}
function sql(query: string): string {
  if (!process.env.E2E_PG_CONTAINER || !process.env.E2E_PG_DB) throw new Error('Use scripts/e2e.sh')
  return execFileSync('docker', ['exec', process.env.E2E_PG_CONTAINER, 'psql', '-U', 'postgres', '-d', process.env.E2E_PG_DB, '-tAc', query], { encoding: 'utf8' }).trim()
}
function snapshot(f: Fixture) {
  return sql(`SELECT (SELECT row_to_json(v)::text FROM visits v WHERE id=${f.visitId}),
    (SELECT row_to_json(c)::text FROM clients c WHERE id=${f.clientId}),
    (SELECT row_to_json(g)::text FROM visitor_grants g WHERE account_id=${f.accountId}),
    (SELECT email || hashed_password FROM users WHERE id=${f.staffId})`)
}
function proofLink(email: string): string | null {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file || !fs.existsSync(file)) return null
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map(line => JSON.parse(line) as { recipient: string; text: string })
    .find(message => message.recipient === email)?.text
    .match(/https?:\/\/[^\s]+\/visitor\/email-change#token=[^\s]+/)?.[0] ?? null
}

// Real API, SQL and local capture mail. No visitor endpoint is intercepted.
for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`visitor profile security ${locale} ${theme} ${width}`, async ({ page, request }, testInfo) => {
        const f = seed()
        const t = (key: TranslationKey) => translations[key][locale]
        const before = snapshot(f)
        const visitorMe = (token: string) => request.get(`${apiUrl}/visitor/me`, { headers: { 'X-Visitor-Token': token } })
        const visitorLogin = async () => {
          const response = await request.post(`${apiUrl}/visitor/auth/login`, { data: { email: f.newEmail, password: f.password } })
          expect(response.status()).toBe(200)
          return (await response.json()).session_token as string
        }
        const uiLogin = async (email: string) => {
          await page.getByLabel(t('field.email'), { exact: true }).fill(email)
          await page.getByLabel(t('field.password'), { exact: true }).fill(f.password)
          await page.getByRole('button', { name: t('visitor.login.submit'), exact: true }).click()
        }
        const readSession = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('visitor_session')!) as Session)
        const crmLogin = await request.post(`${apiUrl}/users/login`, { data: { email: f.email, password: f.password } })
        expect(crmLogin.status()).toBe(200)
        const crmToken = (await crmLogin.json()).access_token as string
        const crmMe = () => request.get(`${apiUrl}/users/me`, { headers: { Authorization: `Bearer ${crmToken}` } })
        expect((await crmMe()).status()).toBe(200)
        await page.setViewportSize({ width, height: 1000 })
        await page.addInitScript(({ language, color }) => {
          localStorage.setItem('app_locale', language)
          localStorage.setItem('theme', color)
        }, { language: locale, color: theme })
        await page.goto('/visitor/login')
        await page.evaluate(({ f, crmToken }) => {
          localStorage.setItem('auth_token', crmToken)
          localStorage.setItem('auth_user', JSON.stringify({ id: f.staffId, full_name: 'Profile Owner', role: 'business_owner', business_id: f.businessId, employer_id: null }))
          sessionStorage.setItem('visitor_session', JSON.stringify(f.sessions[0]))
        }, { f, crmToken })
        const visitorHeaders: Record<string, string>[] = []
        page.on('request', req => {
          if (req.url().startsWith(`${apiUrl}/visitor/`)) visitorHeaders.push(req.headers())
        })
        await page.goto('/visitor/profile')
        await expect(page.getByText(t('visitor.profile.emailVerified'), { exact: true })).toBeVisible()
        await expect(page.locator('dd', { hasText: f.email })).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        await page.screenshot({ path: testInfo.outputPath('profile.png'), fullPage: true })
        await page.getByLabel(t('visitor.email.new'), { exact: true }).fill(f.newEmail)
        const staleRequest = page.waitForResponse(r => r.url() === `${apiUrl}/visitor/auth/email/change/request`)
        await page.getByRole('button', { name: t('visitor.email.submit'), exact: true }).click()
        expect((await staleRequest).status()).toBe(403)
        await expect(page.getByRole('heading', { name: t('visitor.login.reauthTitle'), exact: true })).toBeVisible()
        await uiLogin(f.email)
        await expect(page.getByText(t('visitor.email.sent').replace('{email}', f.newEmail), { exact: true })).toBeVisible()
        await expect.poll(() => proofLink(f.newEmail)).not.toBeNull()
        let current = await readSession()
        expect((await (await visitorMe(current.token)).json()).email).toBe(f.email)
        expect((await visitorMe(f.sessions[1].token)).status()).toBe(200)
        expect(snapshot(f)).toBe(before)
        // Expire recent-auth on the current session, keeping its ordinary 30-day TTL.
        const digest = createHash('sha256').update(current.token).digest('hex')
        sql(`UPDATE visitor_sessions SET created_at=now() at time zone 'utc' - interval '6 minutes' WHERE token_hash='${digest}'`)
        await page.goto(proofLink(f.newEmail)!)
        expect(new URL(page.url()).hash).toBe('')
        const staleConfirm = page.waitForResponse(r => r.url() === `${apiUrl}/visitor/auth/email/change/confirm`)
        await page.getByRole('button', { name: t('visitor.email.confirm'), exact: true }).click()
        expect((await staleConfirm).status()).toBe(403)
        await expect(page.getByRole('heading', { name: t('visitor.login.reauthTitle'), exact: true })).toBeVisible()
        const confirmed = page.waitForResponse(r => r.url() === `${apiUrl}/visitor/auth/email/change/confirm`)
        await uiLogin(f.email)
        expect((await confirmed).status()).toBe(204)
        await expect(page.getByRole('heading', { name: t('visitor.email.doneTitle'), exact: true })).toBeVisible()
        expect(await page.evaluate(() => sessionStorage.getItem('visitor_session'))).toBeNull()
        expect(await page.evaluate(() => sessionStorage.getItem('visitor_email_change_token'))).toBeNull()
        expect((await visitorMe(current.token)).status()).toBe(401)
        expect((await visitorMe(f.sessions[1].token)).status()).toBe(401)
        expect((await visitorMe(f.sessions[2].token)).status()).toBe(200)
        expect(sql(`SELECT email_canonical FROM visitor_accounts WHERE id=${f.accountId}`)).toBe(f.newEmail)
        expect(snapshot(f)).toBe(before)
        await page.screenshot({ path: testInfo.outputPath('email-changed.png'), fullPage: true })
        await page.getByRole('link', { name: t('visitor.backToLogin'), exact: true }).click()
        await uiLogin(f.newEmail)
        await expect(page).toHaveURL(/\/visitor\/visits$/)
        current = await readSession()
        await page.goto(proofLink(f.newEmail)!)
        const replay = page.waitForResponse(r => r.url() === `${apiUrl}/visitor/auth/email/change/confirm`)
        await page.getByRole('button', { name: t('visitor.email.confirm'), exact: true }).click()
        expect((await replay).status()).toBe(400)
        await expect(page.getByText(t('visitor.email.invalid'), { exact: true })).toBeVisible()
        expect((await visitorMe(current.token)).status()).toBe(200)
        await page.goto('/visitor/profile')
        await expect(page.locator('dd', { hasText: f.newEmail })).toBeVisible()
        const spare = await visitorLogin()
        const logout = page.waitForResponse(r => r.url() === `${apiUrl}/visitor/auth/logout`)
        await page.getByRole('button', { name: t('visitor.sessions.signOut'), exact: true }).click()
        const logoutResponse = await logout
        expect(logoutResponse.status()).toBe(204)
        expect(logoutResponse.request().headers()['x-visitor-token']).toBe(current.token)
        await expect(page).toHaveURL(/\/visitor\/login(?:\?|$)/)
        expect((await visitorMe(current.token)).status()).toBe(401)
        expect((await visitorMe(spare)).status()).toBe(200)
        await uiLogin(f.newEmail)
        await expect(page).toHaveURL(/\/visitor\/(?:visits|profile)$/)
        current = await readSession()
        await page.goto('/visitor/profile')
        await page.getByRole('button', { name: t('visitor.sessions.everywhere'), exact: true }).click()
        const dialog = page.getByRole('dialog', { name: t('visitor.sessions.everywhereTitle'), exact: true })
        await expect(dialog).toBeVisible()
        expect((await visitorMe(spare)).status()).toBe(200)
        await page.screenshot({ path: testInfo.outputPath('revoke-sessions.png'), fullPage: true })
        await dialog.getByRole('button', { name: t('visitor.sessions.everywhere'), exact: true }).click()
        await expect(page).toHaveURL(/\/visitor\/login(?:\?|$)/)
        expect((await visitorMe(current.token)).status()).toBe(401)
        expect((await visitorMe(spare)).status()).toBe(401)
        expect((await visitorMe(f.sessions[2].token)).status()).toBe(200)
        expect((await crmMe()).status()).toBe(200)
        expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe(crmToken)
        expect(visitorHeaders.every(headers => !headers.authorization)).toBe(true)
        expect(snapshot(f)).toBe(before)
        await testInfo.attach('profile-acceptance', { body: JSON.stringify({ recentAuthRequest: 403, recentAuthConfirm: 403, proofConfirmed: 204, proofReplay: 400, crmUnchanged: true, otherVisitorActive: true, logoutSingleAndAll: true }), contentType: 'application/json' })
      })
    }
  }
}
