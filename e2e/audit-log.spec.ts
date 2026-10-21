import { readFileSync } from 'node:fs'

import { test, expect, type APIRequestContext } from '@playwright/test'
import { apiLogin, apiPost, apiUrl, newOwner, openAs, seedUser, unique, type Session } from './helpers'

const DAY_MS = 24 * 60 * 60 * 1000

interface AuditEvent {
  id: number
  action: string
  entity_type: string
  entity_id: number
  actor_name: string | null
  actor_role: string | null
  request_id: string | null
  changes: Record<string, unknown> | null
}

interface AuditPage {
  items: AuditEvent[]
  total: number
  page: number
  per_page: number
  pages: number
}

interface AuditFixture {
  owner: Session
  clientName: string
  clientEmail: string
  visitNote: string
  visitId: number
  clientId: number
}

async function postWithRequestId<T>(
  request: APIRequestContext,
  session: Session,
  path: string,
  requestId: string,
  data: unknown,
): Promise<T> {
  const response = await request.post(`${apiUrl}${path}`, {
    headers: { ...session.headers, 'X-Request-ID': requestId },
    data,
  })
  expect(response.ok(), `${path} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

async function seedAuditSalon(request: APIRequestContext): Promise<AuditFixture> {
  const owner = await newOwner(request, { fullName: 'Audit Owner' })
  const service = await apiPost<{ id: number }>(request, owner, '/services/', {
    name: 'Audit Cut',
    duration_minutes: 60,
    price: 35,
    specialist_id: owner.user.id,
  })
  const clientName = unique('Audit Guest')
  const clientEmail = `${unique('audit')}@example.com`
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', {
    full_name: clientName,
    contact_email: clientEmail,
  })
  const visitNote = `secret-note-${unique('audit')}`
  const visit = await postWithRequestId<{ id: number }>(
    request,
    owner,
    '/visits/',
    'e2e-visit-create-1',
    {
      client_id: client.id,
      specialist_id: owner.user.id,
      service_id: service.id,
      date_start: new Date(Date.now() + 2 * DAY_MS).toISOString(),
      date_end: new Date(Date.now() + 2 * DAY_MS + 60 * 60 * 1000).toISOString(),
      note: visitNote,
      status: 'planned',
    },
  )

  const updated = await request.put(`${apiUrl}/visits/${visit.id}`, {
    headers: { ...owner.headers, 'X-Request-ID': 'e2e-visit-update-1' },
    data: { note: `${visitNote}-updated` },
  })
  expect(updated.ok(), await updated.text()).toBeTruthy()

  const secretEmail = `secret-${unique('audit')}@example.com`
  const clientUpdate = await request.put(`${apiUrl}/clients/${client.id}`, {
    headers: { ...owner.headers, 'X-Request-ID': 'e2e-client-update-1' },
    data: { contact_email: secretEmail },
  })
  expect(clientUpdate.ok(), await clientUpdate.text()).toBeTruthy()

  return {
    owner,
    clientName,
    clientEmail: secretEmail,
    visitNote,
    visitId: visit.id,
    clientId: client.id,
  }
}

async function auditPage(request: APIRequestContext, session: Session, query = ''): Promise<AuditPage> {
  const response = await request.get(`${apiUrl}/businesses/me/audit${query}`, {
    headers: session.headers,
  })
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as AuditPage
}

async function auditCsv(request: APIRequestContext, session: Session, query = ''): Promise<string> {
  const response = await request.get(`${apiUrl}/businesses/me/audit/export/csv${query}`, {
    headers: session.headers,
  })
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return await response.text()
}

test('a visit change becomes an event, exports stay clean and the second salon sees nothing', async ({
  page,
  request,
}) => {
  const fixture = await seedAuditSalon(request)
  const other = await newOwner(request, { fullName: 'Other Owner' })

  const journal = await auditPage(request, fixture.owner)
  const byAction = (action: string) => journal.items.find((item) => item.action === action)
  const created = byAction('visit.created')
  const updated = byAction('visit.updated')
  const clientUpdated = byAction('client.updated')
  if (!created || !updated || !clientUpdated) throw new Error(`missing events: ${journal.items.map((item) => item.action).join(', ')}`)

  expect(created.entity_id).toBe(fixture.visitId)
  expect(created.request_id).toBe('e2e-visit-create-1')
  expect(created.actor_name).toBe('Audit Owner')
  expect(created.actor_role).toBe('business_owner')
  expect(created.changes?.items_count).toBe(1)
  expect(JSON.stringify(created)).not.toContain(fixture.visitNote)

  expect(updated.entity_id).toBe(fixture.visitId)
  expect(updated.request_id).toBe('e2e-visit-update-1')
  expect(updated.changes?.fields).toContain('note')
  expect(JSON.stringify(updated)).not.toContain(fixture.visitNote)

  expect(clientUpdated.entity_id).toBe(fixture.clientId)
  expect(clientUpdated.request_id).toBe('e2e-client-update-1')
  expect(clientUpdated.changes?.fields).toEqual(['contact_email'])
  expect(JSON.stringify(journal)).not.toContain(fixture.clientEmail)

  const csv = await auditCsv(request, fixture.owner)
  expect(csv).toContain('visit.created')
  expect(csv).toContain('client.updated')
  expect(csv).not.toContain(fixture.clientEmail)
  expect(csv).not.toContain(fixture.visitNote)
  expect(csv).not.toContain(fixture.clientName)

  // The second business is scoped to its own empty journal, even when it asks for another actor.
  const foreign = await auditPage(request, other)
  expect(foreign.total).toBe(0)
  expect(JSON.stringify(foreign)).not.toContain(fixture.clientName)
  const filteredForeign = await auditPage(request, other, `?actor_user_id=${fixture.owner.user.id}`)
  expect(filteredForeign.total).toBe(0)
  const foreignCsv = await auditCsv(request, other)
  expect(foreignCsv).not.toContain(fixture.clientEmail)
  expect(foreignCsv).not.toContain(fixture.clientName)

  await openAs(page, fixture.owner, '/app/audit')
  await expect(page.getByRole('heading', { name: 'Action log', level: 1 })).toBeVisible()
  await expect(page.getByText('Read-only history')).toBeVisible()

  const table = page.getByRole('table')
  await expect(table.getByText('Visit created')).toBeVisible()
  await expect(table.getByText('Visit updated')).toBeVisible()
  await expect(table.getByText('Client card updated')).toBeVisible()
  await expect(table.getByText('e2e-visit-create-1')).toBeVisible()
  await expect(table.getByText('e2e-client-update-1')).toBeVisible()
  await expect(table.getByText('Changed: Note')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(fixture.clientEmail)
  await expect(page.locator('body')).not.toContainText(fixture.visitNote)
  await expect(page.getByRole('button', { name: /edit|delete/i })).toHaveCount(0)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('business_audit_export.csv')
  const filePath = await download.path()
  if (!filePath) throw new Error('the CSV download has no path')
  const downloadedCsv = readFileSync(filePath, 'utf8')
  expect(downloadedCsv).toContain('client.updated')
  expect(downloadedCsv).not.toContain(fixture.clientEmail)
  expect(downloadedCsv).not.toContain(fixture.visitNote)
  expect(downloadedCsv).not.toContain(fixture.clientName)

  const filters = page.locator('form').filter({ hasText: 'Filters' })
  await filters.locator('select').first().selectOption('client.updated')
  await filters.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByRole('table').getByText('Client card updated')).toBeVisible()
  await expect(page.getByRole('table').getByText('Visit created')).toHaveCount(0)
  await expect(page.getByRole('table').getByText('e2e-client-update-1')).toBeVisible()

  await filters.locator('select').first().selectOption('payment.paid')
  await filters.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('No entries match the selected filters.')).toBeVisible()
})

test('staff cannot open the action log and has no navigation entry', async ({ page, request }) => {
  const employee = seedUser('employee_a_noperm')
  const session = await apiLogin(request, employee.email, employee.password)
  const denied = await request.get(`${apiUrl}/businesses/me/audit`, { headers: session.headers })
  expect(denied.status()).toBe(403)

  await openAs(page, employee, '/app')
  const sidebar = page.locator('#workspace-navigation')
  await expect(sidebar.getByRole('link', { name: 'Action log', exact: true })).toHaveCount(0)

  await page.goto('/app/audit')
  await expect(page.getByText('You do not have access to the action log.')).toBeVisible()
})

test('an owner finds the action log in navigation', async ({ page }) => {
  const owner = seedUser('owner_a')
  await openAs(page, owner, '/app')

  const sidebar = page.locator('#workspace-navigation')
  const link = sidebar.getByRole('link', { name: 'Action log', exact: true })
  await expect(link).toBeVisible()
  await link.click()

  await expect(page).toHaveURL(/\/app\/audit$/)
  await expect(page.getByRole('heading', { name: 'Action log', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible()
})

const matrixText = {
  en: { title: 'Action log', readOnly: 'Read-only history', clientUpdated: 'Client card updated' },
  ru: { title: 'Журнал действий', readOnly: 'История только для чтения', clientUpdated: 'Карточка клиента изменена' },
  cz: { title: 'Protokol akcí', readOnly: 'Historie jen pro čtení', clientUpdated: 'Karta klienta upravena' },
}

for (const language of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`action log layout: ${language}, ${theme}`, async ({ page, request }) => {
      const fixture = await seedAuditSalon(request)
      await openAs(page, fixture.owner, '/app/audit')
      expect((await request.put(`${apiUrl}/user-preferences/me`, {
        headers: fixture.owner.headers,
        data: { language, theme },
      })).ok()).toBeTruthy()
      await page.reload()

      const text = matrixText[language]
      await expect(page.getByRole('heading', { name: text.title, level: 1 })).toBeVisible()
      await expect(page.getByText(text.readOnly)).toBeVisible()
      await expect(page.getByRole('table').getByText(text.clientUpdated)).toBeVisible()
      if (theme === 'dark') await expect(page.locator('html')).toHaveClass(/dark/)
      else await expect(page.locator('html')).not.toHaveClass(/dark/)

      await page.waitForLoadState('networkidle')
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.screenshot({ path: `.local-checks/audit-${language}-${theme}-1280.png`, fullPage: true })

      await page.setViewportSize({ width: 375, height: 812 })
      const mobileList = page.locator('main ul[role="list"]')
      await expect(mobileList.getByText(text.clientUpdated)).toBeVisible()
      await expect(page.getByRole('table')).toBeHidden()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
      await page.screenshot({ path: `.local-checks/audit-${language}-${theme}-375.png`, fullPage: true })
    })
  }
}
