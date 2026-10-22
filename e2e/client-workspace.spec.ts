import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { apiPost, apiUrl, newOwner, openAs, seedUser, waitForFormData, type Session } from './helpers'

const DAY_MS = 24 * 60 * 60 * 1000

function utcSlot(offsetMs: number, hour: number): string {
  const date = new Date(Date.now() + offsetMs)
  date.setUTCHours(hour, 0, 0, 0)
  return date.toISOString().slice(0, 19)
}

interface WorkspaceFixture {
  owner: Session
  clientId: number
  completedVisitId: number
}

// Own owner, client and visits, so the card's counters and next visit don't depend
// on the time of day the seed happened to run.
async function seedWorkspace(request: APIRequestContext): Promise<WorkspaceFixture> {
  const owner = await newOwner(request)
  const service = await apiPost<{ id: number }>(request, owner, '/services/', {
    name: 'Consultation',
    duration_minutes: 60,
    price: 40,
    specialist_id: owner.user.id,
  })
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', {
    full_name: 'Workspace Client',
    contact_phone: '+420777100200',
    contact_email: 'workspace.client@example.com',
  })
  const base = { client_id: client.id, specialist_id: owner.user.id, service_id: service.id }
  const completed = await apiPost<{ id: number }>(request, owner, '/visits/', {
    ...base,
    date_start: utcSlot(-DAY_MS, 10),
    status: 'completed',
    price: 30,
    payment_method: 'cash',
  })
  await apiPost(request, owner, '/visits/', {
    ...base,
    date_start: utcSlot(DAY_MS, 11),
    status: 'planned',
    price: 40,
  })

  const template = await apiPost<{ id: number }>(request, owner, '/businesses/me/questionnaires/', {
    name: 'Health intake',
    fields: [{ key: 'allergies', type: 'text', label: 'Allergies', required: false }],
  })
  await apiPost(request, owner, `/businesses/me/questionnaires/${template.id}/publish`, {
    service_id: service.id,
  })
  const issued = await apiPost<{ token: string }>(
    request,
    owner,
    `/visits/${completed.id}/questionnaire-token`,
    {},
  )
  const submitted = await request.post(`${apiUrl}/public/questionnaires/answers`, {
    headers: { 'X-Questionnaire-Token': issued.token },
    data: { answers: { allergies: 'None' } },
  })
  expect(submitted.ok(), await submitted.text()).toBeTruthy()
  return { owner, clientId: client.id, completedVisitId: completed.id }
}

async function openWorkspaceFromList(page: Page, name: string) {
  const row = page.getByRole('row').filter({ hasText: name })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: `Open: ${name}`, exact: true }).click()
  await page.getByRole('dialog', { name: 'Client record' }).getByRole('link', { name: 'Open full page' }).click()
}

function stat(page: Page, label: string) {
  return page.locator('dl.grid').getByText(label, { exact: true }).locator('..')
}

test('owner reads the card, edits notes and tags and keeps the filtered list', async ({ page, request }) => {
  const fixture = await seedWorkspace(request)
  await openAs(page, fixture.owner, '/clients?q=Workspace')
  await openWorkspaceFromList(page, 'Workspace Client')
  await expect(page).toHaveURL(new RegExp(`/app/clients/${fixture.clientId}$`))
  await expect(page.getByRole('heading', { name: 'Workspace Client', level: 1 })).toBeVisible()
  await expect(page.getByText('+420777100200')).toBeVisible()

  await expect(stat(page, 'Visits')).toContainText('2')
  await expect(stat(page, 'Completed')).toContainText('1')
  await expect(stat(page, 'Cancelled')).toContainText('0')
  await expect(stat(page, 'Paid')).toContainText('30.00 €')

  const nextVisit = page.getByRole('heading', { name: 'Next visit' }).locator('..')
  await expect(nextVisit).toContainText('Consultation')
  await expect(nextVisit).not.toContainText('No upcoming visits')

  const history = page.getByRole('heading', { name: 'Visit history' }).locator('..')
  const completed = history.locator(`[data-visit-id="${fixture.completedVisitId}"]`)
  await expect(completed).toContainText('Consultation')
  await expect(completed).toContainText('30.00 €')

  // a failed save gives the text back and never leaves a fake saved note behind
  await page.route(`**/clients/${fixture.clientId}/notes`, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 500, contentType: 'text/plain', body: 'boom' })
    } else {
      await route.continue()
    }
  })
  const noteInput = page.getByLabel('A note only your team can see')
  await noteInput.fill('Draft that fails')
  await page.getByRole('button', { name: 'Add note' }).click()
  const notesCard = page.getByRole('heading', { name: 'Notes', exact: true }).locator('..')
  await expect(notesCard.getByRole('alert')).toContainText('Could not save the note')
  await expect(noteInput).toHaveValue('Draft that fails')
  await expect(page.locator('li').filter({ hasText: 'Draft that fails' })).toHaveCount(0)
  await page.unroute(`**/clients/${fixture.clientId}/notes`)

  const noteText = 'Prefers quiet mornings'
  await noteInput.fill(noteText)
  await page.getByRole('button', { name: 'Add note' }).click()
  let savedNote = page.locator('li').filter({ hasText: noteText })
  await expect(savedNote).toBeVisible()
  await expect(savedNote).toContainText('Olga Owner')

  await savedNote.getByRole('button', { name: 'Edit', exact: true }).click()
  const noteEditor = notesCard.getByLabel('Edit', { exact: true })
  await noteEditor.fill('Prefers quiet mornings and tea')
  await noteEditor.locator('xpath=..').getByRole('button', { name: 'Save', exact: true }).click()
  savedNote = page.locator('li').filter({ hasText: 'Prefers quiet mornings and tea' })
  await expect(savedNote).toBeVisible()

  const tagsCard = page.getByRole('heading', { name: 'Tags', exact: true }).locator('..')
  await tagsCard.getByLabel('Add a tag').fill('VIP')
  await tagsCard.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(tagsCard.getByRole('list', { name: 'Tags' }).getByText('VIP')).toBeVisible()
  await tagsCard.getByLabel('Preferences').fill('Prefers mornings')
  await tagsCard.getByRole('button', { name: 'Save tags and preferences' }).click()
  await expect(tagsCard.getByRole('button', { name: 'Save tags and preferences' })).toBeDisabled()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Workspace Client', level: 1 })).toBeVisible()
  await expect(page.locator('li').filter({ hasText: 'Prefers quiet mornings and tea' })).toBeVisible()
  await expect(tagsCard.getByRole('list', { name: 'Tags' }).getByText('VIP')).toBeVisible()
  await expect(tagsCard.getByLabel('Preferences')).toHaveValue('Prefers mornings')

  await completed.getByRole('button', { name: 'Details' }).click()
  const questionnaire = page.getByRole('heading', { name: 'Questionnaire' }).locator('..')
  await expect(questionnaire).toContainText('Allergies')
  await expect(questionnaire).toContainText('None')
  const files = page.getByRole('heading', { name: 'Files' }).locator('..')
  await expect(files).toContainText('No files')

  await page.getByRole('button', { name: 'Print', exact: true }).click()
  const report = page.getByRole('heading', { name: 'Personal Report - Workspace Client' })
  await expect(report).toBeVisible()
  await report.locator('..').getByRole('button').click()
  await expect(report).toBeHidden()

  await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
  await waitForFormData(page)
  await expect(page.getByLabel(/^Full Name/)).toHaveValue('Workspace Client')
  await page.getByLabel(/^Phone/).fill('+420777123456')
  await page.getByRole('button', { name: 'Update Client' }).click()
  await expect(page.getByText('+420777123456')).toBeVisible()

  // the list keeps its search on the way back, and the card still fits a phone
  await page.goto('/clients?q=Workspace')
  await openWorkspaceFromList(page, 'Workspace Client')
  await page.setViewportSize({ width: 375, height: 900 })
  await expect(page.getByRole('heading', { name: 'Workspace Client', level: 1 })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await page.getByRole('button', { name: 'Back to clients' }).click()
  await expect(page).toHaveURL(/\/clients\?q=Workspace$/)
  await expect(page.getByRole('searchbox')).toHaveValue('Workspace')
  await expect(page.getByTitle('Export')).toBeVisible()
})

test('limited staff sees history but no money and cannot change notes or tags', async ({ page }) => {
  const employee = seedUser('employee_a_noperm')
  await openAs(page, employee, '/clients?q=Clara')
  await openWorkspaceFromList(page, 'Clara Client')
  await expect(page.getByRole('heading', { name: 'Clara Client', level: 1 })).toBeVisible()

  await expect(stat(page, 'Visits')).toContainText('2')
  await expect(stat(page, 'Completed')).toContainText('1')
  await expect(stat(page, 'Paid')).toHaveCount(0)
  await expect(page.getByText('30.00 €')).toHaveCount(0)

  const history = page.getByRole('heading', { name: 'Visit history' }).locator('..')
  await expect(history).toContainText('Haircut')
  await expect(history).not.toContainText('30.00 €')

  const notesCard = page.getByRole('heading', { name: 'Notes', exact: true }).locator('..')
  const noteInput = notesCard.getByLabel('A note only your team can see')
  await noteInput.fill('Not allowed')
  await notesCard.getByRole('button', { name: 'Add note' }).click()
  await expect(notesCard.getByRole('alert')).toContainText(
    'You do not have permission to change this client',
  )
  await expect(noteInput).toHaveValue('Not allowed')
  await expect(page.locator('li').filter({ hasText: 'Not allowed' })).toHaveCount(0)

  const tagsCard = page.getByRole('heading', { name: 'Tags', exact: true }).locator('..')
  await tagsCard.getByLabel('Add a tag').fill('blocked')
  await tagsCard.getByRole('button', { name: 'Add', exact: true }).click()
  await tagsCard.getByRole('button', { name: 'Save tags and preferences' }).click()
  await expect(tagsCard.getByRole('alert')).toContainText(
    'You do not have permission to change this client',
  )
})


test('client side panel keeps the filtered sorted page and updates it after editing', async ({ page, request }) => {
  const owner = await newOwner(request)
  for (let index = 1; index <= 25; index++) {
    await apiPost(request, owner, '/clients/', { full_name: `Panel Client ${String(index).padStart(2, '0')}`, gender: 'female' })
  }
  await openAs(page, owner, '/app/clients?q=Panel&gender=female&per_page=10')
  await page.getByRole('columnheader', { name: 'Name', exact: true }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()
  const opener = page.getByRole('button', { name: 'Open: Panel Client 12', exact: true })
  await expect(opener).toBeVisible()
  const address = page.url()
  const before = await page.locator('tbody tr td:first-child').allTextContents()
  await opener.focus()
  await page.keyboard.press('Enter')
  const panel = page.getByRole('dialog', { name: 'Client record' })
  await expect(panel.getByRole('heading', { name: 'Panel Client 12', level: 3 })).toBeVisible()
  await expect(page).toHaveURL(address)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(opener).toBeFocused()
  expect(await page.locator('tbody tr td:first-child').allTextContents()).toEqual(before)
  await expect(page.getByRole('searchbox')).toHaveValue('Panel')
  await opener.click()
  await panel.getByRole('button', { name: 'Edit', exact: true }).click()
  await waitForFormData(page)
  await panel.getByLabel(/^Full Name/).fill('Other Guest')
  await panel.getByRole('button', { name: 'Update Client' }).click()
  await expect(panel.getByRole('heading', { name: 'Other Guest', level: 3 })).toBeVisible()
  await expect(page.locator('tbody tr').filter({ hasText: 'Panel Client 12' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page.getByRole('searchbox')).toBeFocused()
  await expect(page.getByRole('searchbox')).toHaveValue('Panel')
  await expect(page).toHaveURL(address)
  const names = await page.locator('tbody tr td:first-child').allTextContents()
  expect(names.join(' ')).toContain('Panel Client 11')
  expect(names.join(' ')).toContain('Panel Client 21')
  expect(names.join(' ')).not.toContain('Other Guest')
  await page.screenshot({ path: '.local-checks/redesign-clients-1280.png', fullPage: true })

  await page.setViewportSize({ width: 375, height: 900 })
  await page.getByRole('button', { name: 'Open: Panel Client 11', exact: true }).click()
  await expect(panel).toBeVisible()
  const box = await panel.boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.width).toBeLessThanOrEqual(375)
  expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  await panel.getByRole('button', { name: 'Print', exact: true }).click()
  const report = panel.getByRole('heading', { name: 'Personal Report - Panel Client 11', exact: true })
  await expect(report).toBeVisible()
  await report.locator('..').getByRole('button').click()
  await expect(report).toBeHidden()
  await page.screenshot({ path: '.local-checks/redesign-client-panel-375.png' })
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
})
