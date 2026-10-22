import { test, expect, type Route } from '@playwright/test'
import { apiUrl, newOwner, openAs } from './helpers'

test('an old preferences update never retries with another stored account before its storage event', async ({ page, request }) => {
  const first = await newOwner(request)
  const second = await newOwner(request)
  const login = await request.post(`${apiUrl}/users/login`, {
    data: { email: second.email, password: second.password },
  })
  expect(login.ok()).toBeTruthy()
  const next = await login.json()
  await openAs(page, first, '/app/settings')
  const writes: string[] = []
  let refresh: Route | undefined
  await page.route('**/user-preferences/me', async route => {
    if (route.request().method() !== 'PUT') return route.continue()
    writes.push(route.request().headers().authorization)
    return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Expired' } }) })
  })
  await page.route('**/users/refresh', route => { refresh = route })
  await page.getByRole('button', { name: /^Русский/ }).click()
  await expect.poll(() => Boolean(refresh)).toBe(true)
  // Another tab has persisted its login, but this tab has not received storage yet.
  // Writes in this page deliberately do not emit storage to its own listeners.
  await page.evaluate(({ access, refreshToken, user }) => {
    localStorage.setItem('auth_user', JSON.stringify(user))
    localStorage.setItem('auth_token', access)
    localStorage.setItem('auth_refresh_token', refreshToken)
  }, { access: next.access_token, refreshToken: next.refresh_token, user: second.user })
  await refresh!.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
    access_token: 'old-refreshed-response', refresh_token: 'old-refresh-response',
  }) })
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('auth_user') || '{}').id)).toBe(second.user.id)
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
  expect(writes).toHaveLength(1)
  expect(writes).not.toContain(`Bearer ${next.access_token}`)
  const stored = await page.evaluate(() => localStorage.getItem('auth_token'))
  expect(stored).toBe(next.access_token)
  const preferences = await request.get(`${apiUrl}/user-preferences/me`, { headers: { Authorization: `Bearer ${next.access_token}` } })
  expect(preferences.ok()).toBeTruthy()
  expect((await preferences.json()).language).toBe('en')
})
