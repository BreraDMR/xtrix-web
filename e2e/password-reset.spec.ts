import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

import { test, expect } from '@playwright/test'
import { apiUrl, newOwner } from './helpers'

const NEW_PASSWORD = 'New!E2e-Reset-91q'

interface ResetMail {
  recipient: string
  subject: string
  text: string
}

function runNotificationJob() {
  const python = process.env.API_PYTHON
  const apiDir = process.env.E2E_API_DIR
  if (!python || !apiDir) throw new Error('API_PYTHON and E2E_API_DIR are required for the capture mail test')
  execFileSync(python, ['scripts/run_jobs.py', 'reminders'], {
    cwd: apiDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function readResetMail(recipient: string): ResetMail {
  const file = process.env.CAPTURE_MAIL_FILE
  if (!file) throw new Error('CAPTURE_MAIL_FILE is not set')
  const rows = fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ResetMail)
  const message = rows.find(
    (row) => row.recipient === recipient && row.subject === 'Reset your Xtrix password',
  )
  if (!message) throw new Error(`No reset email for ${recipient} in ${file}`)
  return message
}

function resetLink(message: ResetMail): string {
  const match = message.text.match(/https?:\/\/[^\s]+\/reset-password#token=[^\s]+/)
  if (!match) throw new Error('The reset email has no reset link')
  return match[0]
}

test('a captured reset email changes the password and ends old sessions', async ({ page, request }) => {
  const owner = await newOwner(request, { business: false, fullName: 'Rita Reset' })

  const oldLogin = await request.post(`${apiUrl}/users/login`, {
    data: { email: owner.email, password: owner.password },
  })
  expect(oldLogin.status()).toBe(200)
  const oldAuth = (await oldLogin.json()) as { access_token: string; refresh_token: string }
  const oldSession = await request.get(`${apiUrl}/users/me`, {
    headers: { Authorization: `Bearer ${oldAuth.access_token}` },
  })
  expect(oldSession.status()).toBe(200)

  await page.goto('/forgot-password')
  await expect(page.getByRole('heading', { name: 'Forgot password?', level: 1 })).toBeVisible()
  await page.getByLabel('Email').fill(owner.email)
  const requested = page.waitForResponse(
    (response) => response.url().endsWith('/auth/password-reset/request') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Send reset link' }).click()
  expect((await requested).status()).toBe(200)
  await expect(page.getByText('Check your email')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('If an account with this email exists')

  runNotificationJob()
  const link = resetLink(readResetMail(owner.email))
  expect(link).toContain('/reset-password#token=')

  await page.goto(link)
  await expect(page.getByText('Choose a new password for your account.')).toBeVisible()
  expect(new URL(page.url()).hash).toBe('')

  const confirmed = page.waitForResponse(
    (response) => response.url().endsWith('/auth/password-reset/confirm') && response.request().method() === 'POST',
  )
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Repeat new password').fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Change password' }).click()
  expect((await confirmed).status()).toBe(200)
  await expect(page.getByText('Password changed')).toBeVisible()
  await expect(page.getByText(/other sessions were signed out/)).toBeVisible()

  const staleAccess = await request.get(`${apiUrl}/users/me`, {
    headers: { Authorization: `Bearer ${oldAuth.access_token}` },
  })
  expect(staleAccess.status()).toBe(401)
  const staleRefresh = await request.post(`${apiUrl}/users/refresh`, {
    data: { refresh_token: oldAuth.refresh_token },
  })
  expect(staleRefresh.status()).toBe(401)
  const oldPassword = await request.post(`${apiUrl}/users/login`, {
    data: { email: owner.email, password: owner.password },
  })
  expect(oldPassword.status()).toBe(401)
  const newPassword = await request.post(`${apiUrl}/users/login`, {
    data: { email: owner.email, password: NEW_PASSWORD },
  })
  expect(newPassword.status()).toBe(200)

  await page.getByRole('link', { name: 'Back to sign in' }).click()
  await page.getByLabel('Email').fill(owner.email)
  await page.getByLabel('Password').fill(owner.password)
  const failedLogin = page.waitForResponse(
    (response) => response.url().endsWith('/users/login') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Sign in' }).click()
  expect((await failedLogin).status()).toBe(401)
  await expect(page.getByText('Invalid credentials')).toBeVisible()

  await page.getByLabel('Password').fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()

  await page.goto(link)
  await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD)
  await page.getByLabel('Repeat new password').fill(NEW_PASSWORD)
  const replay = page.waitForResponse(
    (response) => response.url().endsWith('/auth/password-reset/confirm') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Change password' }).click()
  expect((await replay).status()).toBe(400)
  await expect(page.getByText('Link is not valid')).toBeVisible()
  await expect(page.getByText(/invalid, has expired, or has already been used/)).toBeVisible()
})
