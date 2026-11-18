import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'

type Session = { token: string; expiresAt: string }
type Fixture = {
  session: Session; emptySession: Session
  salons: { id: number; name: string }[]
  entries: { id: number; business_id: number; category: string }[]
}
let fixture: Fixture
test.beforeAll(() => {
  if (!process.env.E2E_API_DIR || !process.env.API_PYTHON) throw new Error('Use scripts/e2e.sh')
  fixture = JSON.parse(execFileSync(process.env.API_PYTHON, [path.resolve('e2e/fixtures/visitor-feed.py')], {
    cwd: tmpdir(), env: { ...process.env, PYTHONPATH: process.env.E2E_API_DIR }, encoding: 'utf8',
  })) as Fixture
})

function databaseSnapshot() {
  if (!process.env.E2E_PG_CONTAINER || !process.env.E2E_PG_DB) throw new Error('Use scripts/e2e.sh')
  return execFileSync('docker', ['exec', process.env.E2E_PG_CONTAINER, 'psql', '-U', 'postgres', '-d', process.env.E2E_PG_DB,
    '-tAc', `SELECT (SELECT md5(string_agg(row_to_json(v)::text, '' ORDER BY id)) FROM visits v),
      (SELECT count(*) FROM visitor_grants), (SELECT count(*) FROM visitor_accounts)`], { encoding: 'utf8' }).trim()
}

for (const locale of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`visitor feed ${locale} ${theme} ${width}`, async ({ page }, testInfo) => {
        const t = (key: TranslationKey) => translations[key][locale]
        await page.setViewportSize({ width, height: 900 })
        await page.addInitScript(({ language, color, session }) => {
          localStorage.setItem('app_locale', language)
          localStorage.setItem('theme', color)
          if (!sessionStorage.getItem('visitor_session')) sessionStorage.setItem('visitor_session', JSON.stringify(session))
        }, { language: locale, color: theme, session: fixture.emptySession })
        const before = databaseSnapshot()
        await page.goto('/visitor/visits')
        await expect(page.getByRole('heading', { name: t('visitor.feed.emptyTitle') })).toBeVisible()
        await page.evaluate(session => sessionStorage.setItem('visitor_session', JSON.stringify(session)), fixture.session)
        await page.reload()
        const cards = page.locator('main ul > li')
        const more = page.getByRole('button', { name: t('visitor.feed.more'), exact: true })
        const salon = page.getByRole('combobox', { name: t('visitor.feed.salon'), exact: true })
        const ids = async () => cards.locator('a').evaluateAll(links => links.map(link => Number(new URL((link as HTMLAnchorElement).href).pathname.split('/').at(-1))))
        const expected = (category: string, business?: number) => fixture.entries
          .filter(row => (category === 'all' || row.category === category) && (!business || row.business_id === business))
          .map(row => row.id).sort((a, b) => a - b)
        const expectIds = async (category: string, business?: number) => {
          expect((await ids()).sort((a, b) => a - b)).toEqual(expected(category, business))
        }
        await expect(cards).toHaveCount(25)
        await more.click()
        await expect(cards).toHaveCount(30)
        await expect(more).toHaveCount(0)
        await expectIds('upcoming')
        await expect(cards.filter({ hasText: locale === 'cz' ? 'Kč' : 'CZK' }).first()).toBeVisible()
        await expect(cards.filter({ hasText: '€' }).first()).toBeVisible()
        await expect(cards.filter({ hasText: fixture.salons[0].name }).first()).toContainText('Europe/Prague')
        await expect(cards.filter({ hasText: fixture.salons[1].name }).first()).toContainText('Pacific/Kiritimati')
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: testInfo.outputPath('visitor-feed.png') })
        await salon.selectOption(String(fixture.salons[1].id))
        await expect(cards).toHaveCount(15)
        await expectIds('upcoming', fixture.salons[1].id)
        await page.getByRole('tab', { name: t('visitor.feed.past'), exact: true }).click()
        await expect(cards).toHaveCount(14)
        await expectIds('past', fixture.salons[1].id)
        await expect(cards.first()).toContainText('2020')
        await salon.selectOption('')
        await expect(cards).toHaveCount(25)
        await more.click()
        await expect(cards).toHaveCount(28)
        await expectIds('past')
        await page.getByRole('tab', { name: t('visitor.feed.cancelled'), exact: true }).click()
        await expect(cards).toHaveCount(2)
        await expectIds('cancelled')
        await page.getByRole('tab', { name: t('visitor.feed.all'), exact: true }).click()
        await expect(cards).toHaveCount(25)
        await more.click()
        await expect(cards).toHaveCount(50)
        await more.click()
        await expect(cards).toHaveCount(60)
        await expectIds('all')
        await expect(more).toHaveCount(0)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        expect(databaseSnapshot()).toBe(before)
        await testInfo.attach('history-ids', { body: JSON.stringify({ expected: expected('all'), actual: await ids(), unchangedDatabase: true }), contentType: 'application/json' })
      })
    }
  }
}
