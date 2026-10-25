import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test'
import fs from 'fs'

export const apiUrl = process.env.E2E_API_URL || 'http://localhost:8170'
// The API clock is independent of page.clock. Keep the server-stamped expiry
// fixed too: hiding its text still leaves a variable line count on narrow screens.
export async function stabilizeTrialDate(page: Page) {
  await page.route('**/subscriptions/access', async route => {
    const response = await route.fetch()
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    await route.fulfill({ response, json: { ...data, trial_end: '2026-10-28T19:14:42Z' } })
  })
}

// the API refuses "123"/"abc" style runs, keep it that way when editing
export const PASSWORD = 'Ok!E2e-Owner-58x'

export interface SeedUser {
  id: number
  email: string
  password: string
  role: string
}

// logins made by the API's scripts/seed_demo.py, scripts/e2e.sh saves its output for us
export function seedUser(key: 'owner_a' | 'employee_a' | 'employee_a_noperm' | 'solo' | 'owner_b' | 'admin'): SeedUser {
  const file = process.env.E2E_SEED_FILE
  if (!file) throw new Error('E2E_SEED_FILE is not set - run the suite with scripts/e2e.sh')
  return JSON.parse(fs.readFileSync(file, 'utf8')).users[key]
}

let counter = 0
export function unique(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${counter}${Math.floor(Math.random() * 1000)}`
}

export interface Session {
  email: string
  password: string
  token: string
  user: { id: number; full_name: string; role: string; business_id?: number | null }
  headers: { Authorization: string }
}

// the caller says what shape it expects back, nothing checks it
async function ok<T = unknown>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

export async function apiLogin(request: APIRequestContext, email: string, password: string): Promise<Session> {
  const { access_token: token } = await ok<{ access_token: string }>(await request.post(`${apiUrl}/users/login`, { data: { email, password } }))
  const headers = { Authorization: `Bearer ${token}` }
  const user = await ok<Session['user']>(await request.get(`${apiUrl}/users/me`, { headers }))
  return { email, password, token, user, headers }
}

export async function apiPost<T = unknown>(request: APIRequestContext, s: Session, path: string, data: unknown) {
  return ok<T>(await request.post(`${apiUrl}${path}`, { headers: s.headers, data }))
}

// A brand-new owner (with a business unless told otherwise), so tests don't share state.
export async function newOwner(
  request: APIRequestContext,
  { business = true, fullName = 'Olga Owner' }: { business?: boolean; fullName?: string } = {},
): Promise<Session> {
  const email = `${unique('owner')}@example.com`
  await ok(await request.post(`${apiUrl}/users/`, {
    data: { email, full_name: fullName, password: PASSWORD, role: 'business_owner' },
  }))
  let s = await apiLogin(request, email, PASSWORD)
  await ok(await request.put(`${apiUrl}/user-preferences/me`, { headers: s.headers, data: { language: 'en' } }))
  if (business) {
    await apiPost(request, s, '/businesses/', { name: 'Test Salon', business_type: 'salon', currency: 'EUR' })
    s = await apiLogin(request, email, PASSWORD)
  }
  return s
}

export async function loginThroughForm(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

// Logs in through the form (how tokens are kept is the app's business, not the test's)
// and opens the page.
export async function openAs(page: Page, s: { email: string; password: string }, path = '/') {
  await loginThroughForm(page, s.email, s.password)
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  if (new URL(page.url()).pathname !== path) await page.goto(path)
}

// Edit forms load their record in an effect (twice in dev, StrictMode) - typing before
// that lands gets overwritten.
export async function waitForFormData(page: Page) {
  await page.waitForLoadState('networkidle')
}

// Some forms (visit, business) still have labels that aren't tied to their inputs,
// so take the first control that sits next to the label text.
export function field(scope: Page | Locator, label: RegExp): Locator {
  return scope.locator('label', { hasText: label }).locator('xpath=..').locator('input, select, textarea').first()
}

// native browser validation (required, type=email...) - the form is not sent at all
export async function isInvalid(input: Locator): Promise<boolean> {
  return input.evaluate((el) => !(el as HTMLInputElement).checkValidity())
}

// the assistant needs the API from its own branch on; scripts/e2e.sh runs it with fake providers
export async function assistantOn(request: APIRequestContext, s: Session) {
  const response = await request.get(`${apiUrl}/assistant/status`, { headers: s.headers })
  // an API from before the assistant has no such route
  test.skip(response.status() === 404, 'this API has no /assistant endpoints')
  expect(response.ok(), await response.text()).toBeTruthy()
  expect((await response.json()).enabled, 'the API should run with LLM_PROVIDER=fake').toBe(true)
}

// Booking through the assistant needs the same working hours as any other booking.
export async function configureAssistantHours(request: APIRequestContext, owner: Session) {
  const params = { specialist_id: owner.user.id, duration_minutes: 60 }
  const before = await request.get(`${apiUrl}/visits/next_slot`, { headers: owner.headers, params })
  expect(before.status(), await before.text()).toBe(404)
  const business = await request.put(`${apiUrl}/businesses/${owner.user.business_id}`, {
    headers: owner.headers,
    data: { timezone: 'Europe/Prague', booking_horizon_days: 30, booking_lead_time_minutes: 0 },
  })
  expect(business.ok(), await business.text()).toBeTruthy()
  for (let weekday = 0; weekday < 7; weekday++) {
    await apiPost(request, owner, '/schedules/work', {
      specialist_id: owner.user.id, weekday, start_time: '09:00', end_time: '18:00',
    })
  }
  const schedule = await request.get(`${apiUrl}/schedules/work`, {
    headers: owner.headers, params: { specialist_id: owner.user.id },
  })
  expect(schedule.ok(), await schedule.text()).toBeTruthy()
  expect(await schedule.json()).toHaveLength(7)
  const after = await request.get(`${apiUrl}/visits/next_slot`, { headers: owner.headers, params })
  expect(after.status(), await after.text()).toBe(200)
}
