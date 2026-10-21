import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { test, expect, type APIRequestContext } from '@playwright/test'
import { apiLogin, apiUrl, newOwner, openAs, seedUser, unique, type Session } from './helpers'

interface ImportBatch {
  id: number
  status: string
  source_filename: string
  source_hash: string
  headers: string[]
  suggested_mapping: Record<string, string>
  mapping_version: number
  preview_version: number
  duplicate_policy: string
  row_count: number
  valid_count: number
  error_count: number
  create_count: number
  update_count: number
  skip_count: number
  created_count: number
  updated_count: number
  skipped_count: number
  failed_count: number
  last_checkpoint: number
}

interface ImportSummary {
  batch: ImportBatch
  already_completed: boolean
}

interface Page<T> {
  items: T[]
  total: number
}

const IMPORT_PATH = '/businesses/me/imports'

function csv(headers: string[], rows: string[][]): string {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`
  return [headers, ...rows].map((row) => row.map(quote).join(',')).join('\n')
}

async function json<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

async function upload(
  request: APIRequestContext,
  owner: Session,
  content: string,
  filename = 'clients.csv',
): Promise<ImportBatch> {
  return json<ImportBatch>(
    await request.post(`${apiUrl}${IMPORT_PATH}`, {
      headers: owner.headers,
      multipart: { file: { name: filename, mimeType: 'text/csv', buffer: Buffer.from(content, 'utf8') } },
    }),
  )
}

async function preview(
  request: APIRequestContext,
  owner: Session,
  batch: ImportBatch,
  policy = 'skip',
): Promise<ImportBatch> {
  const mapped = await request.put(`${apiUrl}${IMPORT_PATH}/${batch.id}/mapping`, {
    headers: owner.headers,
    data: { mapping: batch.suggested_mapping },
  })
  expect(mapped.ok(), await mapped.text()).toBeTruthy()
  return json<ImportBatch>(
    await request.post(`${apiUrl}${IMPORT_PATH}/${batch.id}/preview`, {
      headers: owner.headers,
      data: { duplicate_policy: policy },
    }),
  )
}

function confirmBody(batch: ImportBatch) {
  return {
    source_hash: batch.source_hash,
    mapping_version: batch.mapping_version,
    preview_version: batch.preview_version,
    duplicate_policy: batch.duplicate_policy,
  }
}

async function totals(request: APIRequestContext, owner: Session) {
  const clients = await json<Page<unknown>>(
    await request.get(`${apiUrl}/clients/?per_page=100`, { headers: owner.headers }),
  )
  const visits = await json<Page<unknown>>(
    await request.get(`${apiUrl}/visits/?per_page=100`, { headers: owner.headers }),
  )
  return { clients: clients.total, visits: visits.total }
}

function psql(statement: string) {
  const container = process.env.E2E_PG_CONTAINER
  const database = process.env.E2E_PG_DB
  if (!container || !database) throw new Error('E2E_PG_CONTAINER and E2E_PG_DB are required')
  execFileSync('docker', [
    'exec', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-c', statement,
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
}

function batchIdFromUrl(page: { url(): string }): number {
  const value = new URL(page.url()).searchParams.get('batch')
  if (!value) throw new Error(`no batch id in ${page.url()}`)
  return Number(value)
}

test('an owner imports clients and visits, sees row errors, survives a reload and confirms once', async ({
  page,
  request,
}) => {
  const owner = await newOwner(request, { fullName: 'Import Owner' })
  const suffix = unique('import')
  const existingPhone = '+420700900113'
  const existing = await json<{ id: number }>(
    await request.post(`${apiUrl}/clients/`, {
      headers: owner.headers,
      data: { full_name: 'Existing Guest', contact_phone: '+420 700 900 113' },
    }),
  )
  const before = await totals(request, owner)
  expect(before.clients).toBe(1)

  const content = csv(
    ['Name', 'Phone', 'Email', 'Visit date', 'Service', 'Price'],
    [
      ['Imported Alice', '+420700900111', `alice-${suffix}@example.com`, '2026-09-10 10:00', 'Haircut', '30'],
      ['Imported Bob', '+420700900112', `bob-${suffix}@example.com`, '2026-09-11 14:00', 'Haircut', '45'],
      ['Bad Phone', 'abc', '', '', '', ''],
      ['Existing Guest', existingPhone, '', '', '', ''],
    ],
  )

  await openAs(page, owner, '/app/import')
  await expect(page.getByRole('heading', { name: 'Import clients and visit history', level: 1 })).toBeVisible()

  await page.getByLabel('Choose CSV or XLSX').setInputFiles({
    name: 'clients.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(content, 'utf8'),
  })
  await page.getByRole('button', { name: 'Upload file' }).click()

  await expect(page.getByRole('heading', { name: 'Match the file columns' })).toBeVisible()
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Name')
  await expect(page.getByLabel('Phone', { exact: true })).toHaveValue('Phone')
  await expect(page.getByLabel('Visit date', { exact: true })).toHaveValue('Visit date')
  await page.getByRole('button', { name: 'Build preview' }).click()

  await expect(page.getByRole('heading', { name: 'Check the preview' })).toBeVisible()
  const table = page.getByRole('table')
  await expect(table.getByText('Invalid phone')).toBeVisible()
  await expect(table.getByText('Existing Guest')).toBeVisible()
  await expect(table.getByText('Skip', { exact: true })).toBeVisible()
  await expect(table.getByText('Create', { exact: true })).toHaveCount(2)

  const batchId = batchIdFromUrl(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Check the preview' })).toBeVisible()
  await expect(page.getByText(/Valid/).first()).toBeVisible()

  let confirmRequests = 0
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().endsWith(`/imports/${batchId}/confirm`)) confirmRequests += 1
  })
  await page.getByRole('button', { name: 'Confirm import' }).dblclick()

  await expect(page.getByRole('heading', { name: 'Import finished' })).toBeVisible()
  await expect(page.getByText('Created 2, updated 0, skipped 1, failed 0.')).toBeVisible()
  await expect(page.getByText(/Some rows could not be imported/)).toBeVisible()
  await expect(page.getByText(/Finished/)).toBeVisible()
  expect(confirmRequests).toBe(1)

  const batch = await json<ImportBatch>(
    await request.get(`${apiUrl}${IMPORT_PATH}/${batchId}`, { headers: owner.headers }),
  )
  expect(batch.status).toBe('completed_with_errors')
  expect(batch.created_count).toBe(2)
  expect(batch.skipped_count).toBe(1)
  expect(batch.failed_count).toBe(0)
  expect(batch.last_checkpoint).toBe(5)

  const replay = await json<ImportSummary>(
    await request.post(`${apiUrl}${IMPORT_PATH}/${batchId}/confirm`, {
      headers: owner.headers,
      data: confirmBody(batch),
    }),
  )
  expect(replay.already_completed).toBe(true)
  expect(replay.batch.created_count).toBe(2)

  const after = await totals(request, owner)
  expect(after.clients).toBe(before.clients + 2)
  expect(after.visits).toBe(before.visits + 2)

  const imported = await json<Page<{ id: number; contact_phone: string }>>(
    await request.get(`${apiUrl}/clients/?phone=${encodeURIComponent('+420700900111')}`, {
      headers: owner.headers,
    }),
  )
  expect(imported.total).toBe(1)
  const existingAfter = await json<{ full_name: string }>(
    await request.get(`${apiUrl}/clients/${existing.id}`, { headers: owner.headers }),
  )
  expect(existingAfter.full_name).toBe('Existing Guest')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download CSV report' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('import_report.csv')
  const path = await download.path()
  if (!path) throw new Error('the report download has no path')
  const report = readFileSync(path, 'utf8')
  expect(report).toContain('Imported Alice')
  expect(report).toContain('invalid_phone')
  expect(report).toContain('summary')
})

test('duplicate policy update rewrites the matched client and foreign batches stay hidden', async ({
  page,
  request,
}) => {
  const owner = await newOwner(request, { fullName: 'Policy Owner' })
  const suffix = unique('policy')
  const phone = '+420700900120'
  const existing = await json<{ id: number }>(
    await request.post(`${apiUrl}/clients/`, {
      headers: owner.headers,
      data: { full_name: 'Repeat Guest', contact_phone: phone },
    }),
  )
  const before = await totals(request, owner)

  const content = csv(
    ['Name', 'Phone', 'Email'],
    [['Repeat Updated', phone, `repeat-${suffix}@example.com`]],
  )
  const uploaded = await upload(request, owner, content)
  const previewed = await preview(request, owner, uploaded, 'skip')
  expect(previewed.skip_count).toBe(1)

  await openAs(page, owner, `/app/import?batch=${previewed.id}`)
  await expect(page.getByRole('heading', { name: 'Check the preview' })).toBeVisible()
  const table = page.getByRole('table')
  await expect(table.getByText('Repeat Updated')).toBeVisible()
  await expect(table.getByText('Skip', { exact: true })).toBeVisible()

  await page
    .getByLabel('If the phone or email already exists')
    .last()
    .selectOption({ label: 'Update the existing client' })
  await page.getByRole('button', { name: 'Rebuild preview' }).click()
  await expect(table.getByText('Update', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Confirm import' }).click()
  await expect(page.getByRole('heading', { name: 'Import finished' })).toBeVisible()
  await expect(page.getByText('Created 0, updated 1, skipped 0, failed 0.')).toBeVisible()

  const updated = await json<{ full_name: string; contact_phone: string }>(
    await request.get(`${apiUrl}/clients/${existing.id}`, { headers: owner.headers }),
  )
  expect(updated.full_name).toBe('Repeat Updated')
  expect(updated.contact_phone).toBe(phone)
  expect((await totals(request, owner)).clients).toBe(before.clients)

  const other = await newOwner(request, { fullName: 'Other Import Owner' })
  const foreignRead = await request.get(`${apiUrl}${IMPORT_PATH}/${previewed.id}`, {
    headers: other.headers,
  })
  expect(foreignRead.status()).toBe(404)
  const foreignRows = await request.get(`${apiUrl}${IMPORT_PATH}/${previewed.id}/rows`, {
    headers: other.headers,
  })
  expect(foreignRows.status()).toBe(404)
  const foreignReport = await request.get(`${apiUrl}${IMPORT_PATH}/${previewed.id}/report.csv`, {
    headers: other.headers,
  })
  expect(foreignReport.status()).toBe(404)

  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await openAs(page, other, `/app/import?batch=${previewed.id}`)
  await expect(page.getByText('This import was not found.')).toBeVisible()
})

test('a paused batch continues from its checkpoint and finishes without duplicates', async ({
  page,
  request,
}) => {
  const owner = await newOwner(request, { fullName: 'Resume Owner' })
  const suffix = unique('resume')
  const firstPhone = '+420700900131'
  const secondPhone = '+420700900132'
  const content = csv(
    ['Name', 'Phone', 'Email'],
    [
      ['Paused First', firstPhone, `first-${suffix}@example.com`],
      ['Paused Second', secondPhone, `second-${suffix}@example.com`],
    ],
  )
  const uploaded = await upload(request, owner, content)
  const previewed = await preview(request, owner, uploaded)
  expect(previewed.create_count).toBe(2)

  // The first row was committed before the worker stopped: mark it the way the executor
  // would have and leave the batch in the importing state.
  const firstClient = await json<{ id: number }>(
    await request.post(`${apiUrl}/clients/`, {
      headers: owner.headers,
      data: { full_name: 'Paused First', contact_phone: firstPhone },
    }),
  )
  psql(
    `UPDATE import_rows SET status = 'imported', action = 'create', client_id = ${firstClient.id}, ` +
      `processed_at = now() WHERE batch_id = ${previewed.id} AND row_number = 2; ` +
      `UPDATE import_batches SET status = 'importing', last_checkpoint = 2, created_count = 1, ` +
      `mapping_version = ${previewed.mapping_version}, preview_version = ${previewed.preview_version} ` +
      `WHERE id = ${previewed.id};`,
  )

  await openAs(page, owner, `/app/import?batch=${previewed.id}`)
  await expect(page.getByRole('heading', { name: 'Import paused' })).toBeVisible()
  await expect(page.getByText(/Last saved row: 2/)).toBeVisible()
  await expect(page.getByText(/Created 1, updated 0/)).toBeVisible()

  await page.getByRole('button', { name: 'Continue import' }).click()
  await expect(page.getByRole('heading', { name: 'Import finished' })).toBeVisible()
  await expect(page.getByText('Created 2, updated 0, skipped 0, failed 0.')).toBeVisible()

  const batch = await json<ImportBatch>(
    await request.get(`${apiUrl}${IMPORT_PATH}/${previewed.id}`, { headers: owner.headers }),
  )
  expect(batch.status).toBe('completed')
  expect(batch.created_count).toBe(2)
  expect(batch.last_checkpoint).toBe(3)
  const second = await json<Page<unknown>>(
    await request.get(`${apiUrl}/clients/?phone=${encodeURIComponent(secondPhone)}`, {
      headers: owner.headers,
    }),
  )
  expect(second.total).toBe(1)
  const after = await totals(request, owner)
  expect(after.clients).toBe(2)
})

test('staff cannot open imports and does not see the navigation entry', async ({ page, request }) => {
  const employee = seedUser('employee_a_noperm')
  const session = await apiLogin(request, employee.email, employee.password)
  const denied = await request.get(`${apiUrl}${IMPORT_PATH}`, { headers: session.headers })
  expect(denied.status()).toBe(403)

  await openAs(page, employee, '/app')
  const sidebar = page.locator('#workspace-navigation')
  await expect(sidebar.getByRole('link', { name: 'Import', exact: true })).toHaveCount(0)

  await page.goto('/app/import')
  await expect(page.getByText('You do not have access to imports.')).toBeVisible()
})
