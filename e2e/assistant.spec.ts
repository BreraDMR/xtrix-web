import { test, expect } from '@playwright/test'
import { apiPost, configureAssistantHours, apiUrl, assistantOn, newOwner, openAs } from './helpers'

// scripts/e2e.sh runs the API with LLM_PROVIDER=fake: the "model" answers with
// e2e/fixtures/assistant-plan.json, which names the client instead of using ids. Nothing goes
// to a real model.
const CLIENT = 'Alice Assistant'

test('ask the assistant in text, check the plan, confirm, and the visit shows up', async ({ page, request }) => {
  const owner = await newOwner(request)
  await assistantOn(request, owner)
  await configureAssistantHours(request, owner)
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: CLIENT, contact_phone: '+420777100200' })
  await openAs(page, owner, '/visits')
  await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: CLIENT })).toHaveCount(0)

  await page.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
  const panel = page.getByRole('dialog', { name: 'Sasha' })
  await expect(panel.getByText(/^0 of \d+ requests this month$/)).toBeVisible()
  const input = panel.getByRole('textbox', { name: 'Type a request…' })
  await expect(input).toBeFocused()
  await input.fill(`Book ${CLIENT} for the earliest free time`)
  await input.press('Enter')

  const card = panel.getByRole('article', { name: 'Book Alice Assistant at the earliest free time' })
  await expect(card).toBeVisible()
  await expect(card.getByText('Find the client')).toBeVisible()
  await expect(card.getByText('Find free time')).toBeVisible()
  await expect(card.getByText('Book a visit')).toBeVisible()
  // the server filled in who and when, from the user's own data
  await expect(card.getByText(CLIENT, { exact: true })).toHaveCount(2)
  await expect(card.getByText('Olga Owner', { exact: true })).toHaveCount(2)
  await expect(card.getByText(/\d{2}:\d{2}–\d{2}:\d{2}$/)).toHaveCount(2)
  await expect(card.getByText('Booked from the chat')).toBeVisible()
  await expect(card.getByText(/Valid for \d+:\d\d/)).toBeVisible()

  await card.getByRole('button', { name: 'Confirm' }).click()
  await expect(card.getByText('Sasha booked the visit')).toBeVisible()
  await expect(card.getByText('Done')).toHaveCount(3)
  await expect(card.getByRole('button', { name: 'Confirm' })).toHaveCount(0)

  // the list behind the panel refreshed by itself
  await expect(page.getByRole('row').filter({ hasText: CLIENT })).toHaveCount(1)
  const visits = await (await request.get(`${apiUrl}/visits/`, { headers: owner.headers })).json()
  const list = Array.isArray(visits) ? visits : visits.items
  expect(list.filter((v: { client_id: number }) => v.client_id === client.id)).toHaveLength(1)

  // the plan is gone once used
  const again = await request.post(`${apiUrl}/assistant/execute`, { headers: owner.headers, data: { plan_id: 'anything' } })
  expect(again.status()).toBe(404)

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page.getByRole('button', { name: 'Open the assistant: Sasha' })).toBeFocused()
})
