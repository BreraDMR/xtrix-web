import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import translations, { type TranslationKey } from '../src/i18n/translations'
import { apiUrl, newOwner, unique, type Session } from './helpers'

// BK-21 review: the guest side of the public booking link in every language/theme/width,
// plus what the guest sees when somebody else takes their time first.

const TIMEZONE = 'Europe/Prague'
const SERVICE = 'Review Trim'

interface Salon {
  owner: Session
  slug: string
  name: string
  serviceId: number
}

interface Slots {
  days: { date: string; slots: { start: string; staff_id: number }[] }[]
}

function pragueWeekday(): number {
  const short = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TIMEZONE }).format(new Date())
  return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[short] ?? 0
}

function pragueDate(offsetDays: number): string {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(date)
}

async function ok<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  expect(response.ok(), `${response.url()} -> ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()) as T
}

async function publishedSalon(request: APIRequestContext): Promise<Salon> {
  const owner = await newOwner(request, { fullName: 'Rita Review' })
  const businessId = owner.user.business_id
  if (!businessId) throw new Error('The new owner has no business')
  const name = unique('Review Salon')
  await ok(await request.put(`${apiUrl}/businesses/${businessId}`, {
    headers: owner.headers,
    data: {
      name, currency: 'EUR', timezone: TIMEZONE, booking_horizon_days: 14, booking_lead_time_minutes: 0,
      address: 'Review street 1, Praha', phone: '+420777000222',
    },
  }))
  const service = await ok<{ id: number }>(await request.post(`${apiUrl}/services/`, {
    headers: owner.headers,
    data: { name: SERVICE, duration_minutes: 45, price: 35, specialist_id: owner.user.id },
  }))
  const today = pragueWeekday()
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    // today stays closed so an evening run still has stable slots tomorrow
    if (weekday === today) continue
    await ok(await request.post(`${apiUrl}/schedules/work`, {
      headers: owner.headers,
      data: { specialist_id: owner.user.id, weekday, start_time: '09:00', end_time: '18:00' },
    }))
  }
  const settings = await ok<{ slug: string }>(await request.put(`${apiUrl}/businesses/me/public-booking`, {
    headers: owner.headers,
    data: { is_enabled: true },
  }))
  return { owner, slug: settings.slug, name, serviceId: service.id }
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
}

for (const language of ['en', 'ru', 'cz'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [1280, 375]) {
      test(`guest books through the public link ${language}/${theme}/${width}`, async ({ page, request }, info) => {
        const t = (key: TranslationKey) => translations[key][language]
        const salon = await publishedSalon(request)
        await page.setViewportSize({ width, height: 900 })
        await page.addInitScript(([lang, mode]) => {
          localStorage.setItem('app_locale', lang)
          localStorage.setItem('theme', mode)
        }, [language, theme])

        await page.goto(`/booking/${salon.slug}`)
        await expect(page.getByRole('heading', { name: salon.name })).toBeVisible()
        await expect.poll(() => page.locator('html').evaluate(el => el.classList.contains('dark'))).toBe(theme === 'dark')
        await expect(page.getByText(t('booking.noAccount'), { exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: t('booking.contacts'), exact: true })).toBeVisible()
        await expect(page.getByText('Review street 1, Praha')).toBeVisible()
        await expect(page.getByRole('heading', { name: t('booking.chooseService'), exact: true })).toBeVisible()
        const serviceButton = page.getByRole('button', { name: new RegExp(SERVICE) })
        await expect(serviceButton).toContainText('45')
        await noOverflow(page)
        await page.screenshot({ path: info.outputPath('service.png'), fullPage: true })

        await serviceButton.click()
        await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
        await page.getByRole('button', { name: t('booking.anyMaster'), exact: true }).click()
        await expect(page.getByRole('heading', { name: t('booking.chooseTime'), exact: true })).toBeVisible()
        await expect(page.getByText(`${t('booking.timezone')}: ${TIMEZONE}`)).toBeVisible()
        const slot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
        await expect(slot).toBeVisible()
        await noOverflow(page)
        await page.screenshot({ path: info.outputPath('time.png'), fullPage: true })
        await slot.click()

        await expect(page.getByRole('heading', { name: t('booking.yourDetails'), exact: true })).toBeVisible()
        const marketing = page.getByRole('checkbox', { name: t('booking.marketingConsent') })
        const processing = page.getByRole('checkbox', { name: t('booking.processingConsent') })
        await expect(marketing).not.toBeChecked()
        await expect(processing).not.toBeChecked()
        await page.locator('input[name="full_name"]').fill('Mia Matrix')
        await page.locator('input[name="email"]').fill(`${unique('mia')}@example.com`)
        // without the processing consent the form doesn't move on
        await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()
        await expect(page.getByText(t('booking.processingConsentRequired'), { exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: t('booking.summary'), exact: true })).toHaveCount(0)
        await processing.check()
        await noOverflow(page)
        await page.getByRole('button', { name: t('booking.continue'), exact: true }).click()

        await expect(page.getByRole('heading', { name: t('booking.summary'), exact: true })).toBeVisible()
        await expect(page.getByText('Mia Matrix')).toBeVisible()
        await noOverflow(page)
        await page.screenshot({ path: info.outputPath('summary.png'), fullPage: true })
        const posted = page.waitForResponse(
          (response) => response.url().endsWith('/bookings') && response.request().method() === 'POST',
        )
        await page.getByRole('button', { name: t('booking.confirm'), exact: true }).click()
        const response = await posted
        expect(response.status()).toBe(200)
        const body = await response.json() as { id: number; status: string }
        expect(body.status).toBe('planned')
        await expect(page.getByRole('heading', { name: t('booking.successTitle'), exact: true })).toBeVisible()
        await expect(page.getByText(`#${body.id}`)).toBeVisible()
        await noOverflow(page)
        await page.screenshot({ path: info.outputPath('done.png'), fullPage: true })

        // the stored claim keeps marketing off because the box was never ticked
        const visits = await ok<{ items: { id: number }[] }>(await request.get(`${apiUrl}/visits/?per_page=100`, {
          headers: salon.owner.headers,
        }))
        expect(visits.items.map((visit) => visit.id)).toEqual([body.id])
      })
    }
  }
}

test('a taken time keeps the guest details and offers another time', async ({ page, request }, info) => {
  const salon = await publishedSalon(request)
  await page.addInitScript(() => localStorage.setItem('app_locale', 'en'))
  await page.goto(`/booking/${salon.slug}`)
  await page.getByRole('button', { name: new RegExp(SERVICE) }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Any available master', exact: true }).click()
  const first = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
  await expect(first).toBeVisible()
  const takenLabel = (await first.textContent())?.trim() ?? ''
  await first.click()
  await page.locator('input[name="full_name"]').fill('Kept Guest')
  const email = `${unique('kept')}@example.com`
  await page.locator('input[name="email"]').fill(email)
  await page.getByRole('checkbox', { name: /I agree that the salon may process/ }).check()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Check your booking' })).toBeVisible()

  // somebody else books exactly that time while our guest is reading the summary
  const slots = await ok<Slots>(await request.get(`${apiUrl}/public/booking/${salon.slug}/slots`, {
    params: { service_id: salon.serviceId, date_from: pragueDate(0), date_to: pragueDate(13) },
  }))
  const taken = slots.days.find((day) => day.slots.length > 0)?.slots[0]
  if (!taken) throw new Error('No free slot to race for')
  await ok(await request.post(`${apiUrl}/public/booking/${salon.slug}/bookings`, {
    data: {
      service_id: salon.serviceId, staff_id: taken.staff_id, start: taken.start, full_name: 'Fast Rival',
      email: `${unique('rival')}@example.com`, processing_consent: true, client_request_id: unique('rival-key'),
    },
  }))

  const posted = page.waitForResponse((response) => response.url().endsWith('/bookings') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click()
  expect((await posted).status()).toBe(409)
  const alert = page.getByRole('alert')
  await expect(alert).toBeVisible()
  await expect(page.getByRole('heading', { name: 'You are booked' })).toHaveCount(0)
  await expect(page.getByText(/#\d+/)).toHaveCount(0)
  await page.screenshot({ path: info.outputPath('conflict.png'), fullPage: true })

  await alert.getByRole('button', { name: 'Choose another time', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Choose a date and time' })).toBeVisible()
  // the refreshed list no longer offers the time the rival took
  await expect.poll(async () => (await page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first().textContent())?.trim())
    .not.toBe(takenLabel)
  await page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first().click()
  await expect(page.locator('input[name="full_name"]')).toHaveValue('Kept Guest')
  await expect(page.locator('input[name="email"]')).toHaveValue(email)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  const second = page.waitForResponse((response) => response.url().endsWith('/bookings') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click()
  expect((await second).status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'You are booked' })).toBeVisible()

  const visits = await ok<{ items: { id: number }[] }>(await request.get(`${apiUrl}/visits/?per_page=100`, {
    headers: salon.owner.headers,
  }))
  expect(visits.items).toHaveLength(2)
})
