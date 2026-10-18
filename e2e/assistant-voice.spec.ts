import { test, expect } from '@playwright/test'
import { assistantOn, newOwner, openAs } from './helpers'

// STT_PROVIDER=fake in scripts/e2e.sh "hears" this whatever is said, nothing goes to a speech service
const HEARD = 'Book Alice Assistant for the earliest free time'

// Chromium's fake microphone plays a test tone, so MediaRecorder makes a real webm file
// and the upload goes through the API's own audio checks
test.use({
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  permissions: ['microphone'],
})

test('dictate a request: the heard text lands in the input and is not sent', async ({ page, request }) => {
  const owner = await newOwner(request)
  await assistantOn(request, owner)
  await openAs(page, owner, '/')
  await page.getByRole('button', { name: 'Open the assistant: Sasha' }).click()
  const panel = page.getByRole('dialog', { name: 'Sasha' })

  const plans: string[] = []
  page.on('request', (r) => { if (r.url().endsWith('/assistant/plan')) plans.push(r.url()) })
  await panel.getByRole('button', { name: 'Dictate' }).click()
  await expect(panel.getByRole('timer')).toContainText('Recording 0:01 / 1:00')
  const upload = page.waitForResponse((r) => r.url().endsWith('/assistant/transcribe'))
  await panel.getByRole('button', { name: 'Stop and transcribe' }).click()
  expect((await upload).status()).toBe(200)

  await expect(panel.getByRole('textbox', { name: 'Type a request…' })).toHaveValue(HEARD)
  expect(plans).toEqual([])
})
