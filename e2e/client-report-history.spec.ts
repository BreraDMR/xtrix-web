import { expect, test, type Download } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { apiPost, field, newOwner, openAs } from './helpers'

async function bytes(download: Download) {
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

test('personal report downloads all 125 visits as CSV and PDF and rejects a failed later page', async ({ page, request }) => {
  test.setTimeout(120_000)
  const owner = await newOwner(request)
  const client = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: 'Browser History Client' })
  const other = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: 'Outside report' })
  for (let index = 0; index < 125; index++) {
    const start = new Date(Date.UTC(2030, 0, 1 + index, 10))
    await apiPost(request, owner, '/visits/', {
      client_id: client.id, specialist_id: owner.user.id, service_name: `RPT${String(index + 1).padStart(3, '0')}`,
      date_start: start.toISOString(), date_end: new Date(start.getTime() + 30 * 60_000).toISOString(), price: 5,
    })
  }
  await apiPost(request, owner, '/visits/', {
    client_id: other.id, specialist_id: owner.user.id, service_name: 'PRIVATEOTHER',
    date_start: '2030-06-01T10:00:00Z', date_end: '2030-06-01T10:30:00Z', price: 500,
  })
  await page.clock.install({ time: new Date('2030-05-06T10:00:00+02:00') })
  await page.clock.resume()
  await openAs(page, owner, `/app/clients/${client.id}`)
  await page.getByRole('button', { name: 'Print', exact: true }).click()
  const title = page.getByRole('heading', { name: 'Personal Report - Browser History Client', exact: true })
  const report = title.locator('..').locator('..')
  await field(report, /^Select Report Type$/).selectOption('visits')
  await field(report, /^From Date$/).fill('2030-01-01')
  await field(report, /^To Date$/).fill('2030-12-31')
  await expect(report.getByRole('row')).toHaveCount(126)
  await expect(report.getByText('RPT125', { exact: true })).toBeVisible()

  for (const format of ['CSV', 'PDF'] as const) {
    await report.getByRole('button', { name: 'Export / Print', exact: true }).click()
    await page.getByRole('button', { name: new RegExp(`^${format}`) }).click()
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export', exact: true }).click()
    const content = await bytes(await pending)
    const text = content.toString(format === 'PDF' ? 'latin1' : 'utf8')
    expect(text).toContain('RPT001')
    expect(text).toContain('RPT125')
    expect(text).not.toContain('PRIVATEOTHER')
    expect(text.match(/RPT\d{3}/g)).toHaveLength(125)
    if (format === 'PDF') expect(text.startsWith('%PDF-')).toBe(true)
    await mkdir('.local-checks', { recursive: true })
    await writeFile(`.local-checks/client-report-history.${format.toLowerCase()}`, content)
    await expect(page.getByRole('button', { name: 'Export / Print', exact: true })).toHaveCount(1)
  }

  await page.route('**/visits/?**', async route => {
    const url = new URL(route.request().url())
    if (url.searchParams.get('client_id') === String(client.id) && url.searchParams.get('page') === '2') {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Later page unavailable' } }) })
    } else await route.continue()
  })
  await field(report, /^From Date$/).fill('2030-01-02')
  await expect(report.getByRole('alert')).toContainText('Unable to load data')
  await expect(report.getByRole('table')).toHaveCount(0)
  await expect(report.getByRole('button', { name: 'Export / Print', exact: true })).toBeDisabled()
  await page.unroute('**/visits/?**')
  await report.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(report.getByRole('row')).toHaveCount(125)
  await expect(report.getByText('RPT125', { exact: true })).toBeVisible()
  await expect(report.getByRole('button', { name: 'Export / Print', exact: true })).toBeEnabled()
})
