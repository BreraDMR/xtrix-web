import { afterAll, beforeEach, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitorVisit from '../pages/visitor/VisitorVisit'
import { resetStores } from '../test/render'
import { error, mockVisitorApi, renderVisitor, resetVisitor, signInVisitor, type Reply } from '../test/visitor'
import type { Schema } from '../api/types'
import { browserTimeZone } from '../components/visitor/format'

const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true } })
afterAll(() => { if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow) })

const visit: Schema<'VisitorHistoryVisit'> = {
  id: 812, business_id: 3, start: '2030-11-20T09:00:00Z', end: '2030-11-20T10:30:00Z', status: 'planned', confirmed_at: null,
  service_name: 'Haircut', staff_name: 'Eva', price: { amount: '1050.00', currency: 'CZK' },
  items: [
    { id: 1, position: 0, service_name: 'Haircut', staff_name: 'Eva', start: '2030-11-20T09:00:00Z', end: '2030-11-20T10:00:00Z', duration_minutes: 60, price: { amount: '650.00', currency: 'CZK' } },
    { id: 2, position: 1, service_name: 'Styling', staff_name: 'Eva', start: '2030-11-20T10:00:00Z', end: '2030-11-20T10:30:00Z', duration_minutes: 30, price: null },
  ],
  business: { name: 'Salon Anna', address: 'Main 1, Prague', phone: '+420 600 000 000', email: 'hi@anna.cz', timezone: 'Europe/Prague' },
}
const allowed = { allowed: true, reason: null }
const actions = (overrides: Partial<Schema<'VisitorBookingActions'>> = {}): Reply => ({ status: 200, data: {
  confirm: allowed, cancel: allowed, reschedule: allowed, ...overrides } })

const open = (routes: Parameters<typeof mockVisitorApi>[0]) => {
  const api = mockVisitorApi({ 'GET /visitor/visits/812': { status: 200, data: visit }, ...routes })
  renderVisitor({ '/visitor/visits/:visitId': <VisitorVisit /> }, '/visitor/visits/812')
  return api
}

beforeEach(() => { resetStores(); resetVisitor(); signInVisitor() })

it('shows the salon, its contacts, services with their own prices and the visit price', async () => {
  open({ 'GET /visitor/visits/812/actions': actions() })
  expect(await screen.findByRole('heading', { level: 1, name: 'Salon Anna' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '+420 600 000 000' })).toHaveAttribute('href', 'tel:+420 600 000 000')
  expect(screen.getByRole('link', { name: 'hi@anna.cz' })).toHaveAttribute('href', 'mailto:hi@anna.cz')
  const services = screen.getByRole('region', { name: 'Services' })
  expect(within(services).getByText('CZK 650.00')).toBeInTheDocument()
  expect(within(services).getByText('Price on request')).toBeInTheDocument()
  expect(screen.getByText('CZK 1,050.00')).toBeInTheDocument()
})

it('shows only allowed buttons and explains the others', async () => {
  open({ 'GET /visitor/visits/812/actions': actions({ cancel: { allowed: false, reason: 'booking_cancel_too_late' }, reschedule: { allowed: false, reason: 'booking_reschedule_too_late' } }) })
  expect(await screen.findByRole('button', { name: 'Confirm the visit' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Cancel the visit' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Change the time' })).not.toBeInTheDocument()
  expect(screen.getByText("It's too late to change this visit online. Please contact the salon.")).toBeInTheDocument()
})

it('keeps the visit visible when the allowed actions fail to load', async () => {
  open({ 'GET /visitor/visits/812/actions': error(500, 'Oops') })
  expect(await screen.findByText("We couldn't check what can be changed right now. The visit details above are still current.")).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'Salon Anna' })).toBeInTheDocument()
})

it('retries once quietly when the server asks to', async () => {
  let attempts = 0
  const { calls } = open({
    'GET /visitor/visits/812/actions': actions(),
    'POST /visitor/visits/812/confirm': () => (++attempts === 1 ? error(409, 'Try again', { code: 'visitor_action_retry' }) : { status: 204 }),
  })
  await userEvent.click(await screen.findByRole('button', { name: 'Confirm the visit' }))
  expect(await screen.findByText('The visit is confirmed.')).toBeInTheDocument()
  expect(calls.filter(call => call.url?.endsWith('/confirm'))).toHaveLength(2)
})

it('sends the new time in the salon zone and says when it is taken', async () => {
  const { calls } = open({
    'GET /visitor/visits/812/actions': actions(),
    'POST /visitor/visits/812/reschedule': error(409, 'Slot is taken', { code: 'booking_reschedule_unavailable' }),
  })
  await userEvent.click(await screen.findByRole('button', { name: 'Change the time' }))
  const dialog = screen.getByRole('dialog', { name: 'New time' })
  await userEvent.clear(within(dialog).getByLabelText('Time'))
  await userEvent.type(within(dialog).getByLabelText('Time'), '14:30')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Move the visit' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('That time is already taken.')
  // 14:30 in Prague on 20 November is 13:30 UTC
  expect(JSON.parse(String(calls.find(call => call.url?.endsWith('/reschedule'))?.data))).toEqual({ start: '2030-11-20T13:30:00.000Z' })
})

it('shows a payment in progress as a reason to contact the salon', async () => {
  open({
    'GET /visitor/visits/812/actions': actions(),
    'POST /visitor/visits/812/cancel': error(409, 'A payment is in progress, please contact the salon.', { code: 'booking_cancel_unavailable' }),
  })
  await userEvent.click(await screen.findByRole('button', { name: 'Cancel the visit' }))
  await userEvent.click(within(screen.getByRole('dialog', { name: 'Cancel the visit?' })).getByRole('button', { name: 'Cancel the visit' }))
  expect(await screen.findByRole('status')).toHaveTextContent('A payment is in progress, please contact the salon.')
})

it('reloads what is allowed after another booking conflict', async () => {
  let checks = 0
  open({
    'GET /visitor/visits/812/actions': () => (++checks === 1 ? actions() : actions({ confirm: { allowed: false, reason: 'booking_confirm_started' } })),
    'POST /visitor/visits/812/confirm': error(409, 'The visit has already started.', { code: 'booking_confirm_started' }),
  })
  await userEvent.click(await screen.findByRole('button', { name: 'Confirm the visit' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('The visit has already started.')
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirm the visit' })).not.toBeInTheDocument())
})

it('says when the visit is gone', async () => {
  mockVisitorApi({ 'GET /visitor/visits/812': error(404, 'Not found') })
  renderVisitor({ '/visitor/visits/:visitId': <VisitorVisit /> }, '/visitor/visits/812')
  expect(await screen.findByText(/This visit is no longer available/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'All visits' })).toHaveAttribute('href', '/visitor/visits')
})

it('names the salon zone even when it matches the browser', async () => {
  open({
    'GET /visitor/visits/812': { status: 200, data: { ...visit, business: { ...visit.business, timezone: browserTimeZone() } } },
    'GET /visitor/visits/812/actions': actions(),
  })
  expect(await screen.findByText(`salon time, ${browserTimeZone()}`)).toBeInTheDocument()
})

it.each([null, 'Mars/Base'])('labels the actual fallback zone for %s in the visit details', async timezone => {
  open({
    'GET /visitor/visits/812': { status: 200, data: { ...visit, business: { ...visit.business, timezone } } },
    'GET /visitor/visits/812/actions': actions(),
  })
  expect(await screen.findByText(`your time zone is ${browserTimeZone()}`)).toBeInTheDocument()
  expect(screen.queryByText(/salon time,/)).not.toBeInTheDocument()
})

it('keeps all public details when salon changes are unavailable, without rendering private fields', async () => {
  const denied = { allowed: false, reason: 'visitor_actions_unavailable' }
  open({
    'GET /visitor/visits/812': { status: 200, data: { ...visit, confirmed_at: '2030-11-19T09:00:00Z',
      note: 'PRIVATE CRM NOTE', client_email: 'private@example.com', subscription_status: 'PRIVATE BILLING',
      items: [...visit.items].reverse() } },
    'GET /visitor/visits/812/actions': actions({ confirm: denied, cancel: denied, reschedule: denied }),
  })
  expect(await screen.findByText("This salon doesn't take changes online. Please contact them directly.")).toBeInTheDocument()
  expect(screen.getByText('Main 1, Prague')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('10:00–11:30')
  expect(screen.getByText(/Confirmed/)).toBeInTheDocument()
  const items = within(screen.getByRole('region', { name: 'Services' })).getAllByRole('listitem')
  expect(items[0]).toHaveTextContent('Haircut')
  expect(items[1]).toHaveTextContent('Styling')
  expect(screen.getByText('CZK 1,050.00')).toBeInTheDocument()
  expect(screen.queryByText(/PRIVATE|private@example.com/)).not.toBeInTheDocument()
  for (const name of ['Confirm the visit', 'Cancel the visit', 'Change the time']) {
    expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
  }
})

it.each([
  ['booking_confirm_completed', 'The visit is already over.'],
  ['booking_cancel_in_progress', 'The visit has already started.'],
  ['booking_reschedule_started', 'The visit has already started.'],
  ['booking_cancel_already', 'The visit is cancelled.'],
  ['booking_confirm_cancelled', 'The visit is cancelled.'],
  ['new_unknown_reason', "Online changes aren't possible for this visit. Please contact the salon."],
])('explains %s using a public hint', async (reason, text) => {
  const denied = { allowed: false, reason }
  open({ 'GET /visitor/visits/812/actions': actions({ confirm: denied, cancel: denied, reschedule: denied }) })
  expect(await screen.findByText(text)).toBeInTheDocument()
})
