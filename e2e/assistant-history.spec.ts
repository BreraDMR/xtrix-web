import { test, expect } from '@playwright/test'
import { apiPost, configureAssistantHours, assistantOn, newOwner, openAs } from './helpers'

const CLIENT = 'Alice Assistant'

test('assistant history: send -> navigate -> close -> reload -> new chat -> old chat with isolated history', async ({ page, request, browser }) => {
  const owner = await newOwner(request)
  await assistantOn(request, owner)
  await configureAssistantHours(request, owner)
  await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: CLIENT, contact_phone: '+420777100200' })

  await openAs(page, owner, '/visits')
  await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()

  // Open assistant panel
  await page.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
  const panel = page.getByRole('dialog', { name: 'Sasha' })
  await expect(panel).toBeVisible()

  const input = panel.getByRole('textbox', { name: 'Type a request…' })
  await input.fill(`Book ${CLIENT} for the earliest free time`)
  await input.press('Enter')

  const card = panel.getByRole('article', { name: 'Book Alice Assistant at the earliest free time' })
  await expect(card).toBeVisible()

  // Confirm plan
  await card.getByRole('button', { name: 'Confirm' }).click()
  // The completed step is the success line; there is no duplicate summary.
  await expect(card.getByText('Sasha booked the visit')).toHaveCount(1)
  await expect(card.getByRole('button', { name: 'Confirm' })).toHaveCount(0)

  // Close panel
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()

  // Reload page
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Visits', level: 1 })).toBeVisible()

  // Re-open assistant: history is restored, card is already completed
  await page.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
  await expect(panel).toBeVisible()
  const restoredCard = panel.getByRole('article', { name: 'Book Alice Assistant at the earliest free time' })
  await expect(restoredCard).toBeVisible()
  await expect(restoredCard.getByRole('button', { name: 'Confirm' })).toHaveCount(0)

  // Start new chat
  await panel.getByRole('button', { name: /New chat|Новый чат/i }).click()
  // New chat has empty log
  await expect(panel.getByText('Sasha is ready to help')).toBeVisible()

  // Second user isolation check, in a separate context: pages of one context share the session
  const stranger = await newOwner(request)
  await assistantOn(request, stranger)
  const strangerContext = await browser.newContext({
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:3170',
    locale: 'en-GB',
    timezoneId: 'Europe/Prague',
  })
  const page2 = await strangerContext.newPage()
  await openAs(page2, stranger, '/visits')
  await page2.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
  const strangerPanel = page2.getByRole('dialog', { name: 'Sasha' })
  await expect(strangerPanel).toBeVisible()
  await expect(strangerPanel.getByText('Alice Assistant')).toHaveCount(0)
  await strangerContext.close()
})

test('reopening a corrected chat keeps only the newest plan confirmable', async ({ page, request }) => {
  const owner = await newOwner(request)
  await assistantOn(request, owner)
  await configureAssistantHours(request, owner)
  await apiPost(request, owner, '/clients/', { full_name: CLIENT, contact_phone: '+420777100201' })
  await openAs(page, owner, '/visits')
  await page.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
  const panel = page.getByRole('dialog', { name: 'Sasha' })
  const input = panel.getByRole('textbox', { name: 'Type a request…' })
  const cards = panel.getByRole('article', { name: 'Book Alice Assistant at the earliest free time' })
  await input.fill(`Book ${CLIENT} for the earliest free time`)
  await input.press('Enter')
  await expect(cards).toHaveCount(1)
  await input.fill('Please prepare a replacement plan before I confirm')
  await input.press('Enter')
  await expect(cards).toHaveCount(2)
  await expect(panel.getByRole('button', { name: 'Confirm', exact: true })).toHaveCount(1)

  await page.reload()
  await page.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
  await expect(cards).toHaveCount(2)
  await expect(cards.first().getByText('Replaced by a newer plan')).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Confirm', exact: true })).toHaveCount(1)
  await panel.getByRole('button', { name: 'Confirm', exact: true }).click()
  await expect(cards.last().getByText('Sasha booked the visit')).toHaveCount(1)

  await page.reload()
  await page.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
  await expect(cards.last().getByText('Sasha booked the visit')).toHaveCount(1)
  await expect(panel.getByRole('button', { name: 'Confirm', exact: true })).toHaveCount(0)
  const visits = await request.get(`${process.env.E2E_API_URL}/visits/`, { headers: owner.headers })
  expect(visits.ok()).toBeTruthy()
  expect((await visits.json()).total).toBe(1)
})
