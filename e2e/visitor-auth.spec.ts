import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { test, expect } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiUrl, newOwner, openAs, PASSWORD, unique } from './helpers'

function registrationLink(recipient: string): string | null {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file || !fs.existsSync(file)) return null
  const messages = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean)
    .map(line => JSON.parse(line) as { recipient: string; text: string })
  return messages.find(message => message.recipient === recipient)?.text
    .match(/https?:\/\/[^\s]+\/visitor\/register#token=[^\s]+/)?.[0] ?? null
}

function accountCounts() {
  const container = process.env.E2E_PG_CONTAINER
  const database = process.env.E2E_PG_DB
  if (!container || !database) throw new Error('Run with scripts/e2e.sh and the throwaway database')
  return execFileSync('docker', ['exec', container, 'psql', '-U', 'postgres', '-d', database, '-tAc',
    'SELECT (SELECT count(*) FROM users), (SELECT count(*) FROM businesses), (SELECT count(*) FROM subscriptions), (SELECT count(*) FROM visitor_accounts)'],
  { encoding: 'utf8' }).trim().split('|').map(Number)
}

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`visitor email registration and login ${locale} ${theme} ${width}`, async ({ page, request }, testInfo) => {
        const t = (key: TranslationKey) => translations[key][locale]
        await page.setViewportSize({ width, height: 900 })
        await page.addInitScript(({ language, color }) => {
          localStorage.setItem('app_locale', language)
          localStorage.setItem('theme', color)
        }, { language: locale, color: theme })
        const email = `${unique('visitor-auth')}@example.com`
        const before = accountCounts()
        const crmRequests: string[] = []
        page.on('request', req => {
          if (/\/(users|businesses|subscriptions)(\/|\?|$)/.test(new URL(req.url()).pathname)) crmRequests.push(req.url())
        })
        await page.goto('/visitor/signup')
        await expect(page.getByRole('heading', { name: t('visitor.signup.title') })).toBeVisible()
        await expect(page.getByRole('link', { name: t('visitor.login.crmLink') })).toHaveAttribute('href', '/login')
        await page.getByLabel(t('field.email'), { exact: true }).fill(email)
        await page.getByRole('button', { name: t('visitor.signup.submit'), exact: true }).click()
        await expect(page.getByRole('heading', { name: t('visitor.request.sentTitle') })).toBeVisible()
        await expect.poll(() => registrationLink(email)).not.toBeNull()
        // Requesting the proof must not activate an account or a business trial.
        expect(accountCounts()).toEqual(before)
        await page.goto(registrationLink(email)!)
        await expect(page.getByLabel(t('visitor.password.new'), { exact: true })).toBeVisible()
        expect(new URL(page.url()).hash).toBe('')
        await page.getByLabel(t('visitor.password.new'), { exact: true }).fill(PASSWORD)
        await page.getByLabel(t('visitor.password.repeat'), { exact: true }).fill(PASSWORD)
        await page.getByRole('button', { name: t('visitor.register.submit'), exact: true }).click()
        await expect(page).toHaveURL(/\/visitor\/visits$/)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        const after = accountCounts()
        expect(after.slice(0, 3)).toEqual(before.slice(0, 3))
        expect(after[3]).toBe(before[3] + 1)
        expect(crmRequests).toEqual([])
        const token = await page.evaluate(() => {
          if (localStorage.getItem('visitor_session')) throw new Error('Visitor credential leaked to shared storage')
          return JSON.parse(sessionStorage.getItem('visitor_session') || '{}').token as string
        })
        expect(token).toBeTruthy()
        const me = await request.get(`${apiUrl}/visitor/me`, { headers: { 'X-Visitor-Token': token } })
        expect(me.ok()).toBeTruthy()
        expect((await me.json()).email).toBe(email)
        await page.reload()
        await expect(page).toHaveURL(/\/visitor\/visits$/)
        await page.goto('/visitor/login?reauth=1')
        await page.getByLabel(t('field.email'), { exact: true }).fill(email)
        await page.getByLabel(t('field.password'), { exact: true }).fill(PASSWORD)
        await page.getByRole('button', { name: t('visitor.login.submit'), exact: true }).click()
        await expect(page).toHaveURL(/\/visitor\/profile$/)
        expect(accountCounts()).toEqual(after)
        expect(crmRequests).toEqual([])
        await testInfo.attach('account-counts', { body: JSON.stringify({ before, after, crmRequests }), contentType: 'application/json' })
        await page.screenshot({ path: testInfo.outputPath('visitor-profile.png'), fullPage: true })
      })
    }
  }
}

test('simultaneous CRM and visitor sessions stay independent across tabs and a visitor 401', async ({ page, context, request }) => {
  const owner = await newOwner(request)
  await openAs(page, owner, '/visitor/signup')
  const email = `${unique('visitor-isolation')}@example.com`
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Send the link' }).click()
  await expect.poll(() => registrationLink(email)).not.toBeNull()
  await page.goto(registrationLink(email)!)
  await page.getByLabel('New password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Repeat the password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Create the account', exact: true }).click()
  await expect(page).toHaveURL(/\/visitor\/visits$/)
  const crmToken = await page.evaluate(() => localStorage.getItem('auth_token'))
  const other = await context.newPage()
  await other.goto('/visitor/visits')
  await expect(other).toHaveURL(/\/visitor\/login\?/)
  await page.reload()
  await expect(page).toHaveURL(/\/visitor\/visits$/)
  const sent: { path: string; authorization?: string; visitor?: string }[] = []
  const refreshes: string[] = []
  page.on('request', req => {
    const path = new URL(req.url()).pathname
    if (path.endsWith('/users/refresh')) refreshes.push(path)
    if (path.startsWith('/visitor/')) sent.push({ path, authorization: req.headers().authorization, visitor: req.headers()['x-visitor-token'] })
  })
  await page.route('**/visitor/visits?*', route => route.fulfill({
    status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Expired visitor session', status_code: 401 } }),
  }))
  await page.reload()
  await expect(page).toHaveURL(/\/visitor\/login\?/)
  expect(sent.some(req => req.visitor)).toBe(true)
  expect(sent.every(req => !req.authorization)).toBe(true)
  expect(refreshes).toEqual([])
  expect(await page.evaluate(() => localStorage.getItem('auth_token'))).toBe(crmToken)
  expect(await page.evaluate(() => sessionStorage.getItem('visitor_session'))).toBeNull()
  await page.goto('/app')
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  await other.close()
})
