import { expect, test, type Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { apiPost, field, newOwner, openAs, stabilizeTrialDate, waitForFormData } from './helpers'

async function checkMobileControls(page: Page, mode: string) {
  await page.evaluate(() => document.fonts.ready)
  const region = page.getByRole('region', { name: 'Visits', exact: true })
  // The viewport changes before React commits the matchMedia-driven columns.
  await expect(region.getByRole('columnheader')).toHaveCount(4)
  const card = region.locator('..')
  const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth, scrollX: window.scrollX }))
  const cardBounds = await card.boundingBox()
  expect(cardBounds).not.toBeNull()
  const controls = {
    create: page.getByRole('button', { name: 'New Visit', exact: true }),
    export: page.getByRole('button', { name: 'Export', exact: true }),
    search: page.getByRole('searchbox'),
    status: page.getByRole('combobox', { name: 'Status', exact: true }),
    from: page.getByLabel('From date', { exact: true }),
    to: page.getByLabel('To date', { exact: true }),
    clear: page.getByRole('button', { name: 'Clear filters', exact: true }),
    perPage: page.getByRole('combobox', { name: 'Per page:', exact: true }),
  }
  const measured: Record<string, unknown> = { viewport, card: cardBounds,
    tableRegion: await region.evaluate(element => ({ clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth, scrollLeft: element.scrollLeft })) }
  expect(viewport.scrollWidth - viewport.width).toBeLessThanOrEqual(1)
  // the phone table folds service and status into other cells instead of scrolling sideways
  const tableRegion = measured.tableRegion as { clientWidth: number; scrollWidth: number }
  expect(tableRegion.scrollWidth - tableRegion.clientWidth).toBeLessThanOrEqual(1)
  expect(viewport.scrollX).toBe(0)
  for (const [name, control] of Object.entries(controls)) {
    await expect(control).toBeVisible()
    const bounds = await control.boundingBox()
    expect(bounds, `${mode}: ${name} has bounds`).not.toBeNull()
    const box = bounds!
    measured[name] = { ...box, right: box.x + box.width,
      internal: await control.evaluate(element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })) }
    expect(box.x, `${mode}: ${name} starts inside viewport`).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width, `${mode}: ${name} ends inside viewport`).toBeLessThanOrEqual(viewport.width)
    if (name !== 'create' && name !== 'export') {
      expect(box.x, `${mode}: ${name} starts inside card`).toBeGreaterThanOrEqual(cardBounds!.x)
      expect(box.x + box.width, `${mode}: ${name} ends inside card`).toBeLessThanOrEqual(cardBounds!.x + cardBounds!.width)
    }
  }
  console.log(`${mode} visit control bounds: ${JSON.stringify(measured)}`)
  await writeFile(`.local-checks/visits-layout-${mode}-375.json`, JSON.stringify(measured, null, 2))
  await page.screenshot({ path: `.local-checks/visits-layout-${mode}-375.png`, animations: 'disabled' })
  // Both date controls remain usable, including the right-hand input in the two-column filter row.
  await controls.from.fill('2030-01-01')
  await controls.to.fill('2030-01-31')
  await expect(controls.from).toHaveValue('2030-01-01')
  await expect(controls.to).toHaveValue('2030-01-31')
  await controls.create.click()
  const panel = page.getByRole('dialog', { name: 'New Visit', exact: true })
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(controls.create).toBeFocused()
}

for (const mode of ['fresh', 'resize'] as const) {
  test(`visit controls stay inside the mobile viewport after ${mode === 'fresh' ? 'a fresh load' : 'saving and resizing from desktop'}`, async ({ page, request }) => {
    const owner = await newOwner(request)
    const client = await apiPost<{ id: number }>(request, owner, '/clients/', { full_name: 'Directory Guest' })
    for (let index = 1; index <= 25; index++) {
      const start = new Date(Date.UTC(2030, 0, index, 10))
      await apiPost(request, owner, '/visits/', {
        client_id: client.id, specialist_id: owner.user.id,
        service_name: `Panel Treatment ${String(index).padStart(2, '0')}`, price: index === 22 ? 0 : 45,
        date_start: start.toISOString(), date_end: new Date(start.getTime() + 1_800_000).toISOString(),
      })
    }
    await stabilizeTrialDate(page)
    await page.setViewportSize({ width: mode === 'fresh' ? 375 : 1280, height: 900 })
    await openAs(page, owner, '/app/visits')
    const search = page.getByRole('searchbox')
    await search.fill('Panel Treatment')
    await page.getByRole('button', { name: mode === 'fresh' ? 'Next' : '2', exact: true }).click()
    const row = page.getByRole('row').filter({ hasText: 'Panel Treatment 22' })
    await expect(row).toContainText('0.00 €')
    if (mode === 'resize') {
      const edit = row.getByRole('button', { name: 'Edit', exact: true })
      await edit.click()
      const editor = page.getByRole('dialog', { name: 'Edit visit', exact: true })
      await expect(field(editor, /^Service Name/)).toHaveValue('Panel Treatment 22')
      await expect(field(editor, /^Price/)).toHaveValue('0')
      await waitForFormData(page)
      await field(editor, /^Note/).fill('A real update from the side panel')
      await editor.getByRole('button', { name: 'Update Visit', exact: true }).click()
      await expect(editor).toBeHidden()
      await expect(search).toHaveValue('Panel Treatment')
      await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute('aria-current', 'page')
      await expect(row).toContainText('0.00 €')
      await expect(edit).toBeFocused()
      await page.screenshot({ path: '.local-checks/visits-layout-resize-1280.png', animations: 'disabled' })
      await page.setViewportSize({ width: 375, height: 900 })
    }
    await page.evaluate(() => window.scrollTo(0, 0))
    await checkMobileControls(page, mode)
  })
}
