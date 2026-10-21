import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test'
import { apiPost, apiUrl, newOwner, openAs, unique, type Session } from './helpers'

const DAY_MS = 24 * 60 * 60 * 1000

const INTAKE_FIELDS = [
  {
    key: 'hair_length',
    type: 'text',
    label: 'Hair length',
    required: true,
    max_length: 100,
  },
  {
    key: 'notes',
    type: 'long_text',
    label: 'Anything we should know?',
    required: false,
    max_length: 500,
  },
  {
    key: 'visit_type',
    type: 'single_choice',
    label: 'Visit type',
    required: true,
    options: [
      { value: 'first', label: 'First visit' },
      { value: 'repeat', label: 'Repeat visit' },
    ],
  },
  {
    key: 'services',
    type: 'multi_choice',
    label: 'Services of interest',
    required: true,
    max_selected: 2,
    options: [
      { value: 'cut', label: 'Cut' },
      { value: 'color', label: 'Color' },
      { value: 'styling', label: 'Styling' },
    ],
  },
  {
    key: 'returning',
    type: 'boolean',
    label: 'Booked with us before?',
    required: true,
  },
]

interface IntakeFixture {
  owner: Session
  visitId: number
  token: string
  templateName: string
  clientName: string
}

async function seedIntake(
  request: APIRequestContext,
  templateName = 'Salon intake',
): Promise<IntakeFixture> {
  const owner = await newOwner(request)
  const service = await apiPost<{ id: number }>(request, owner, '/services/', {
    name: 'Salon consultation',
    duration_minutes: 60,
    price: 40,
    specialist_id: owner.user.id,
  })
  const clientName = unique('Quest Guest')
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', {
    full_name: clientName,
    contact_email: `${unique('quest')}@example.com`,
  })
  const visit = await apiPost<{ id: number }>(request, owner, '/visits/', {
    client_id: client.id,
    specialist_id: owner.user.id,
    service_id: service.id,
    date_start: new Date(Date.now() + DAY_MS).toISOString(),
    date_end: new Date(Date.now() + DAY_MS + 60 * 60 * 1000).toISOString(),
    status: 'planned',
  })
  const template = await apiPost<{ id: number }>(request, owner, '/businesses/me/questionnaires/', {
    name: templateName,
    description: 'A few details before your visit.',
    fields: INTAKE_FIELDS,
  })
  await apiPost(request, owner, `/businesses/me/questionnaires/${template.id}/publish`, {
    service_id: service.id,
  })
  const issued = await apiPost<{ token: string }>(
    request,
    owner,
    `/visits/${visit.id}/questionnaire-token`,
    {},
  )
  return { owner, visitId: visit.id, token: issued.token, templateName, clientName }
}

function question(page: Page, label: string): Locator {
  return page.locator('div.rounded-xl').filter({ hasText: label })
}

function questionnaireLink(token: string): string {
  return `/questionnaire#token=${encodeURIComponent(token)}`
}

test('guest answers from a booking link and the owner reads the card', async ({ page, request, browser }) => {
  const fixture = await seedIntake(request)
  const guestContext = await browser.newContext({
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:3170',
    locale: 'en-GB',
    timezoneId: 'Europe/Prague',
    viewport: { width: 1280, height: 800 },
  })
  const guest = await guestContext.newPage()
  try {
    await guest.goto(questionnaireLink(fixture.token))
    await expect(guest.getByRole('heading', { name: fixture.templateName })).toBeVisible()
    expect(new URL(guest.url()).hash).toBe('')

    await question(guest, 'Hair length').locator('input').fill('Shoulder length')
    await guest.reload()
    await expect(guest.getByRole('heading', { name: fixture.templateName })).toBeVisible()
    await expect(question(guest, 'Hair length').locator('input')).toHaveValue('Shoulder length')

    await question(guest, 'Anything we should know?')
      .locator('textarea')
      .fill('I prefer morning appointments.')
    await question(guest, 'Visit type').getByRole('radio', { name: 'Repeat visit' }).check()
    await question(guest, 'Services of interest').getByRole('checkbox', { name: 'Cut' }).check()
    await question(guest, 'Services of interest').getByRole('checkbox', { name: 'Color' }).check()
    await question(guest, 'Booked with us before?').getByRole('radio', { name: 'Yes' }).check()

    const submitted = guest.waitForResponse(
      (response) => response.url().endsWith('/public/questionnaires/answers') && response.request().method() === 'POST',
    )
    await guest.getByRole('button', { name: 'Send answers' }).click()
    const response = await submitted
    expect(response.status()).toBe(200)
    await expect(guest.getByRole('heading', { name: 'Thank you' })).toBeVisible()
    await expect(guest.getByText('Your answers were sent to the business.')).toBeVisible()

    await guest.goto(questionnaireLink(fixture.token))
    // same-document hash navigation keeps the submitted screen, reopen the page for real
    await guest.reload()
    await expect(guest.getByRole('heading', { name: 'Already submitted' })).toBeVisible()
    await expect(guest.getByRole('button', { name: 'Send answers' })).toHaveCount(0)
  } finally {
    await guestContext.close()
  }

  await openAs(page, fixture.owner, '/app/visits')
  await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()
  const row = page.getByRole('row').filter({ hasText: fixture.clientName })
  await expect(row).toHaveCount(1)
  await row.getByRole('button', { name: 'Edit' }).click()

  const card = page.locator('section').filter({ has: page.getByRole('heading', { name: fixture.templateName }) })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Version 1')
  await expect(card).toContainText('Shoulder length')
  await expect(card).toContainText('I prefer morning appointments.')
  await expect(card).toContainText('Repeat visit')
  await expect(card).toContainText('Cut, Color')
  await expect(card).toContainText('Booked with us before?')
  await expect(card).toContainText('Yes')
})

test('answers replay, tenant checks and attachment rules stay enforced', async ({ page, request }) => {
  const first = await seedIntake(request)
  const second = await seedIntake(request, 'Other intake')
  const answers = {
    hair_length: 'Long',
    notes: 'First answer',
    visit_type: 'first',
    services: ['cut'],
    returning: false,
  }

  const submitted = await request.post(`${apiUrl}/public/questionnaires/answers`, {
    headers: { 'X-Questionnaire-Token': first.token },
    data: { answers },
  })
  expect(submitted.status()).toBe(200)
  const firstResult = (await submitted.json()) as { version: number; submitted_at: string }
  expect(firstResult.version).toBe(1)

  const replay = await request.post(`${apiUrl}/public/questionnaires/answers`, {
    headers: { 'X-Questionnaire-Token': first.token },
    data: { answers },
  })
  expect(replay.status()).toBe(200)
  expect(((await replay.json()) as { submitted_at: string }).submitted_at).toBe(firstResult.submitted_at)

  const changed = await request.post(`${apiUrl}/public/questionnaires/answers`, {
    headers: { 'X-Questionnaire-Token': first.token },
    data: { answers: { ...answers, notes: 'Changed answer' } },
  })
  expect(changed.status()).toBe(409)

  const foreignForm = await request.get(`${apiUrl}/public/questionnaires`, {
    headers: { 'X-Questionnaire-Token': second.token },
  })
  expect(foreignForm.ok(), await foreignForm.text()).toBeTruthy()
  expect(((await foreignForm.json()) as { name: string }).name).toBe(second.templateName)

  const foreignCard = await request.get(`${apiUrl}/visits/${first.visitId}/questionnaire`, {
    headers: second.owner.headers,
  })
  expect(foreignCard.status()).toBe(403)

  const ownCard = await request.get(`${apiUrl}/visits/${first.visitId}/questionnaire`, {
    headers: first.owner.headers,
  })
  expect(ownCard.ok(), await ownCard.text()).toBeTruthy()
  const own = (await ownCard.json()) as { answers: Record<string, unknown>; version: number }
  expect(own.version).toBe(1)
  expect(own.answers).toEqual(answers)

  await page.goto('/questionnaire#token=not-a-real-token')
  await expect(page.getByRole('heading', { name: 'This link is unavailable' })).toBeVisible()
  await expect(page.getByText(first.templateName)).toHaveCount(0)

  const forbiddenType = await request.post(`${apiUrl}/public/questionnaires/attachments`, {
    headers: { 'X-Questionnaire-Token': first.token },
    data: { filename: 'payload.exe', content_type: 'application/x-msdownload', size_bytes: 1024 },
  })
  expect(forbiddenType.status()).toBe(422)

  const oversized = await request.post(`${apiUrl}/public/questionnaires/attachments`, {
    headers: { 'X-Questionnaire-Token': first.token },
    data: { filename: 'photo.png', content_type: 'image/png', size_bytes: 10 * 1024 * 1024 + 1 },
  })
  expect(oversized.status()).toBe(422)
})
