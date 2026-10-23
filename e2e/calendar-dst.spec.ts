import { test, expect } from '@playwright/test'
import { newOwner, apiPost, apiUrl, openAs, unique } from './helpers'

for (const timezoneId of ['Europe/Prague', 'Pacific/Pago_Pago', 'Pacific/Kiritimati']) {
  test.describe(`calendar in ${timezoneId}`, () => {
    test.use({ timezoneId })

    test('keeps the repeated hour, overnight segments and dragged origin', async ({ page, request }) => {
      const owner = await newOwner(request)
      const business = await request.put(`${apiUrl}/businesses/${owner.user.business_id}`, {
        headers: owner.headers,
        data: { timezone: 'Europe/Prague' },
      })
      expect(business.ok(), await business.text()).toBeTruthy()
      const employee = await apiPost<{ employee_user_id: number }>(request, owner, '/employees/create-with-user', {
        full_name: 'DST Second Master', email: `${unique('dststaff')}@example.com`, position: 'Stylist',
      })
      const client = await apiPost<{ id: number }>(request, owner, '/clients/', {
        full_name: 'DST Synthetic Client', contact_phone: '+420700001301',
      })
      const create = (staff: number, start: string, end: string) => apiPost<{ id: number }>(request, owner, '/visits/', {
        client_id: client.id, specialist_id: staff, date_start: start, date_end: end, price: 10,
      })
      const overnight = await create(owner.user.id, '2026-10-24T21:30:00Z', '2026-10-24T23:00:00Z')
      const fold = await create(owner.user.id, '2026-10-25T00:45:00Z', '2026-10-25T01:15:00Z')
      const staffFold = await create(employee.employee_user_id, '2026-10-25T00:45:00Z', '2026-10-25T01:15:00Z')
      await page.clock.install({ time: new Date('2026-10-25T12:00:00Z') })
      await page.clock.resume()
      await openAs(page, owner, '/app/calendar')

      const grids = page.locator('[data-calendar-grid="2026-10-25"]')
      const tail = page.locator(`[data-visit-id="${overnight.id}"]`)
      const foldCard = page.locator(`[data-visit-id="${fold.id}"]`)
      const staffCard = page.locator(`[data-visit-id="${staffFold.id}"]`)
      await expect(grids).toHaveCount(2)
      await expect(tail).toBeVisible()
      await expect(foldCard).toHaveCSS('height', '32px')
      await expect(staffCard).toBeVisible()
      await expect(foldCard).toHaveAttribute('aria-label', /02:45 GMT\+2–02:15 GMT\+1/)
      await expect(page.getByText('02:00 GMT+2', { exact: true })).toHaveCount(1)
      await expect(page.getByText('02:00 GMT+1', { exact: true })).toHaveCount(1)
      expect(await grids.first().evaluate(el => el.getBoundingClientRect().height)).toBe(1600)

      await page.getByRole('button', { name: 'Previous', exact: true }).click()
      await expect(page.locator('[data-calendar-grid="2026-10-24"]')).toHaveCount(2)
      await expect(tail).toHaveCSS('top', '1504px')
      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(tail).toHaveCSS('top', '0px')
      await page.getByRole('combobox', { name: 'Calendar view' }).selectOption('week')
      await expect(page.locator('[data-calendar-grid]')).toHaveCount(7)
      for (const key of ['2026-10-24', '2026-10-25']) {
        await expect(page.locator(`[data-calendar-grid="${key}"] [data-visit-id="${overnight.id}"]`)).toHaveCount(1)
      }
      await expect(page.locator(`[data-calendar-grid="2026-10-25"] [data-visit-id="${fold.id}"]`)).toHaveCSS('height', '32px')
      await expect(page.getByText('02:00 GMT+2', { exact: true })).toHaveCount(1)
      await expect(page.getByText('02:00 GMT+1', { exact: true })).toHaveCount(1)

      await page.getByRole('combobox', { name: 'Calendar view' }).selectOption('day')
      const grid = tail.locator('xpath=ancestor::*[@data-calendar-grid]')
      await tail.dragTo(grid, { sourcePosition: { x: 20, y: 2 }, targetPosition: { x: 80, y: 2 } })
      const preview = page.getByRole('region', { name: 'Move visit' })
      await expect(preview).toBeVisible()
      const sent = page.waitForRequest(req => req.method() === 'PUT' && req.url().endsWith(`/visits/${overnight.id}`))
      await preview.getByRole('button', { name: 'Move', exact: true }).click()
      const payload = (await sent).postDataJSON()
      await expect(preview).toBeHidden()
      expect(payload.date_start).toBe('2026-10-24T21:30:00.000Z')
      expect(payload.date_end).toBe('2026-10-24T23:00:00.000Z')
    })
  })
}
