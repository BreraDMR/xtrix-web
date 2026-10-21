import { test, expect, request as apiRequest, type Locator, type Page } from '@playwright/test'
import { PASSWORD, apiLogin, apiPost, apiUrl, openAs } from './helpers'

// Visual baselines for the key screens. All data here is fixed and sits in June 2030, and the
// browser clock starts in that month (and runs normally, so chart animations finish), so only
// things the server stamps with "now" move - those get masked. Update after an intended UI change: npm run e2e -- --update-snapshots
const OWNER = { email: 'shots.owner@example.com', password: PASSWORD }
const CLOCK_START = new Date('2030-06-15T10:00:00+02:00')

async function ensureData() {
  const request = await apiRequest.newContext()
  try {
    const login = await request.post(`${apiUrl}/users/login`, { data: OWNER })
    if (login.ok()) return // made by an earlier run against the same database

    const signup = await request.post(`${apiUrl}/users/`, { data: { ...OWNER, full_name: 'Mira Shot', role: 'business_owner' } })
    expect(signup.ok(), await signup.text()).toBeTruthy()
    let owner = await apiLogin(request, OWNER.email, OWNER.password)
    await request.put(`${apiUrl}/user-preferences/me`, { headers: owner.headers, data: { language: 'en' } })
    const business = await apiPost<{ id: number }>(request, owner, '/businesses/', { name: 'Studio Shot', business_type: 'salon', currency: 'EUR' })
    owner = await apiLogin(request, OWNER.email, OWNER.password)

    const service = await apiPost<{ id: number }>(request, owner, '/services/', {
      name: 'Haircut', duration_minutes: 60, price: 40, specialist_id: owner.user.id,
    })
    const clients: { id: number }[] = []
    for (const [name, phone, email] of [
      ['Alice Brown', '+420700000101', 'alice.brown@example.com'],
      ['Boris Kral', '+420700000102', 'boris.kral@example.com'],
      ['Cecile Dvorak', '+420700000103', 'cecile.dvorak@example.com'],
    ]) {
      clients.push(await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: name, contact_phone: phone, contact_email: email }))
    }
    const visit = (client: { id: number }, start: string, extra = {}) => apiPost(request, owner, '/visits/', {
      client_id: client.id, specialist_id: owner.user.id, service_id: service.id, date_start: start, price: 40, ...extra,
    })
    await visit(clients[0], '2030-06-10T08:00:00Z', { status: 'completed', payment_method: 'cash' })
    await visit(clients[1], '2030-06-14T12:00:00Z')
    await visit(clients[2], '2030-06-20T07:00:00Z')

    const categories = await (await request.get(`${apiUrl}/expenses/categories`, { headers: owner.headers })).json()
    await apiPost(request, owner, '/expenses/', {
      business_id: business.id, category_id: categories.find((c: { code: string }) => c.code === 'rent')?.id,
      amount: 500, currency: 'EUR', description: 'Studio rent', expense_date: '2030-06-05', payment_method: 'transfer',
    })
    await apiPost(request, owner, '/employees/create-with-user', {
      full_name: 'Ema Shot', email: 'shots.staff@example.com', position: 'Stylist', base_salary: 1200, commission_percentage: 15,
    })
  } finally {
    await request.dispose()
  }
}

// recharts draws its pies in JS (400ms delay + 1500ms), and a screenshot taken meanwhile can
// look "stable" half-drawn, so pages with charts just get the time to finish
const CHART_ANIMATION_MS = 2500

const screens: { name: string; path: string; heading?: string; charts?: boolean; mask?: (page: Page) => Locator[] }[] = [
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/app', heading: 'Dashboard', charts: true },
  { name: 'clients', path: '/clients', heading: 'Clients' },
  { name: 'visits', path: '/visits', heading: 'Visits' },
  // "Hired At" is the day the employee was made, i.e. the day of the run
  { name: 'employees', path: '/employees', heading: 'Employees', mask: (page) => [page.getByText(/^\d{2}\/\d{2}\/\d{4}$/)] },
  { name: 'finance', path: '/finance', heading: 'Financial Reports', charts: true },
  { name: 'settings', path: '/settings', heading: 'Settings' },
]

test.describe('screenshots', () => {
  test.beforeAll(ensureData)

  for (const width of [1280, 375]) {
    for (const screen of screens) {
      test(`${screen.name} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: width > 400 ? 800 : 812 })
        await page.clock.install({ time: CLOCK_START })
        await page.clock.resume()
        if (screen.heading) {
          await openAs(page, OWNER, screen.path)
          await expect(page.getByRole('heading', { name: screen.heading, level: 1 })).toBeVisible()
        } else {
          await page.goto(screen.path)
        }
        await page.waitForLoadState('networkidle')
        // fullPage would resize the viewport during the shot, and that restarts the chart
        // animations - so grow the viewport to the whole page first
        const height = await page.evaluate(() => document.documentElement.scrollHeight)
        await page.setViewportSize({ width, height })
        if (screen.charts) await page.waitForTimeout(CHART_ANIMATION_MS)
        if (screen.heading) {
          const trialText = page.locator('main > div[role="status"] > p')
          await expect(trialText).toBeVisible()
          await expect(trialText).toContainText('300 visits and 50 AI requests per day.')
        }
        // Only the server-stamped trial text is dynamic. Keep the banner box and link visible.
        const trialStyle = await page.addStyleTag({ content: 'main > div[role="status"] > p { visibility: hidden !important; }' })
        try {
          await expect(page).toHaveScreenshot(`${screen.name}-${width}.png`, { mask: screen.mask?.(page) })
        } finally {
          await trialStyle.evaluate(element => element.parentNode?.removeChild(element))
        }
      })
    }

    // the assistant panel over the dashboard: a side panel on a wide screen, full screen on a phone
    test(`assistant panel at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width > 400 ? 800 : 812 })
      await page.clock.install({ time: CLOCK_START })
      await page.clock.resume()
      await openAs(page, OWNER, '/app')
      await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(CHART_ANIMATION_MS)
      await page.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
      const panel = page.getByRole('dialog', { name: 'Sasha' })
      await expect(panel.getByText('Sasha is ready to help')).toBeVisible()
      await page.waitForLoadState('networkidle')
      const trialText = page.locator('main > div[role="status"] > p')
      await expect(trialText).toBeVisible()
      await expect(trialText).toContainText('300 visits and 50 AI requests per day.')
      // Hide the underlying text only, without masking any part of the overlaid chat.
      const trialStyle = await page.addStyleTag({ content: 'main > div[role="status"] > p { visibility: hidden !important; }' })
      try {
        await expect(page).toHaveScreenshot(`assistant-${width}.png`)
      } finally {
        await trialStyle.evaluate(element => element.parentNode?.removeChild(element))
      }
    })
  }
})
