import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import type { Schema } from '../src/api/types'
import { formatClock, formatMoney } from '../src/components/visitor/format'

type Fixture = {
  session: { token: string; expiresAt: string }
  entries: { id: number; state: string; salon: string }[]
}
let fixture: Fixture

test.beforeAll(() => {
  if (!process.env.E2E_API_DIR || !process.env.API_PYTHON) throw new Error('Use scripts/e2e.sh')
  fixture = JSON.parse(execFileSync(process.env.API_PYTHON, [path.resolve('e2e/fixtures/visitor-detail.py')], {
    cwd: tmpdir(), env: { ...process.env, PYTHONPATH: process.env.E2E_API_DIR }, encoding: 'utf8',
  })) as Fixture
})

function databaseSnapshot() {
  if (!process.env.E2E_PG_CONTAINER || !process.env.E2E_PG_DB) throw new Error('Use scripts/e2e.sh')
  return execFileSync('docker', ['exec', process.env.E2E_PG_CONTAINER, 'psql', '-U', 'postgres', '-d', process.env.E2E_PG_DB,
    '-tAc', `SELECT (SELECT md5(string_agg(row_to_json(v)::text, '' ORDER BY id)) FROM visits v),
      (SELECT md5(string_agg(row_to_json(i)::text, '' ORDER BY id)) FROM visit_items i),
      (SELECT md5(string_agg(row_to_json(s)::text, '' ORDER BY id)) FROM subscriptions s),
      (SELECT count(*) FROM visitor_grants), (SELECT count(*) FROM visitor_accounts)`], { encoding: 'utf8' }).trim()
}

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`visitor detail ${locale} ${theme} ${width}`, async ({ page }, testInfo) => {
        const t = (key: TranslationKey) => translations[key][locale]
        await page.setViewportSize({ width, height: 900 })
        await page.addInitScript(({ language, color, session }) => {
          localStorage.setItem('app_locale', language)
          localStorage.setItem('theme', color)
          sessionStorage.setItem('visitor_session', JSON.stringify(session))
        }, { language: locale, color: theme, session: fixture.session })
        const before = databaseSnapshot()
        const writes: string[] = []
        page.on('request', request => {
          if (new URL(request.url()).pathname.startsWith('/visitor/') && !['GET', 'OPTIONS'].includes(request.method())) writes.push(request.url())
        })
        for (const entry of fixture.entries) {
          const detailResponse = page.waitForResponse(response => new URL(response.url()).origin === process.env.E2E_API_URL && new URL(response.url()).pathname === `/visitor/visits/${entry.id}`)
          await page.goto(`/visitor/visits/${entry.id}`)
          const response = await detailResponse
          if (entry.state === 'deleted') {
            expect(response.status()).toBe(404)
            await expect(page.getByText(t('visitor.visit.gone'), { exact: true })).toBeVisible()
            await expect(page.getByText('Detail Street 12, Prague')).toHaveCount(0)
            continue
          }
          expect(response.status()).toBe(200)
          const visit = await response.json() as Schema<'VisitorHistoryVisit'>
          expect(Object.keys(visit).sort()).toEqual(['id', 'business_id', 'start', 'end', 'status', 'confirmed_at', 'service_name', 'staff_name', 'price', 'items', 'business'].sort())
          await expect(page.getByRole('heading', { level: 1, name: entry.salon })).toBeVisible()
          await expect(page.getByRole('heading', { level: 2 })).toHaveText(formatClock(visit.start, visit.business.timezone, locale) + '–' + formatClock(visit.end, visit.business.timezone, locale))
          const main = page.locator('main')
          await expect(main).toContainText(t('visitor.time.salonZone').replace('{zone}', visit.business.timezone!))
          await expect(main).toContainText(t('visitor.visit.confirmedAt').split('{when}')[0].trim())
          await expect(main.getByText('Detail Street 12, Prague')).toBeVisible()
          await expect(main.getByRole('link', { name: '+420600111222' })).toHaveAttribute('href', 'tel:+420600111222')
          await expect(main.getByRole('link', { name: 'detail@example.com' })).toHaveAttribute('href', 'mailto:detail@example.com')
          const services = page.getByRole('region', { name: t('visitor.visit.services'), exact: true })
          const items = services.getByRole('listitem')
          await expect(items).toHaveCount(2)
          await expect(items.nth(0)).toContainText('Detail Haircut')
          await expect(items.nth(0)).toContainText(formatMoney('650.00', 'CZK', locale))
          await expect(items.nth(1)).toContainText('Detail Styling')
          await expect(items.nth(1)).toContainText(t('visitor.price.onRequest'))
          await expect(main).toContainText(formatMoney('1050.00', 'CZK', locale))
          await expect(main).not.toContainText('PRIVATE')
          if (entry.state === 'active') {
            for (const action of ['confirm', 'cancel', 'reschedule'] as const) {
              await expect(page.getByRole('button', { name: t(`visitor.action.${action}`), exact: true })).toBeVisible()
            }
          } else {
            await expect(page.getByText(t(entry.state === 'expired' ? 'visitor.reason.unavailableSalon' : 'visitor.reason.completed'), { exact: true })).toBeVisible()
            for (const action of ['confirm', 'cancel', 'reschedule'] as const) {
              await expect(page.getByRole('button', { name: t(`visitor.action.${action}`), exact: true })).toHaveCount(0)
            }
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
          await page.screenshot({ path: testInfo.outputPath(`detail-${entry.state}.png`), fullPage: true })
        }
        await page.reload()
        await expect(page.getByText(t('visitor.visit.gone'), { exact: true })).toBeVisible()
        expect(writes).toEqual([])
        expect(databaseSnapshot()).toBe(before)
        await testInfo.attach('detail-acceptance', { body: JSON.stringify({ states: fixture.entries.map(entry => entry.state), unchangedDatabase: true, writes }), contentType: 'application/json' })
      })
    }
  }
}
