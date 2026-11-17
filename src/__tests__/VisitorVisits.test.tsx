import { beforeEach, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitorVisits from '../pages/visitor/VisitorVisits'
import { RequireVisitor } from '../components/visitor/VisitorUi'
import { resetStores } from '../test/render'
import { error, mockVisitorApi, renderVisitor, resetVisitor, signInVisitor } from '../test/visitor'
import type { Schema } from '../api/types'

type Visit = Schema<'VisitorHistoryVisit'>
const business = (name: string, timezone: string | null = 'Europe/Prague') => ({ name, address: 'Main 1', phone: null, email: null, timezone })
const visit = (id: number, overrides: Partial<Visit> = {}): Visit => ({
  id, business_id: 3, start: '2030-11-20T09:00:00Z', end: '2030-11-20T10:00:00Z', status: 'planned', confirmed_at: null,
  service_name: 'Haircut', staff_name: 'Eva', price: { amount: '650.00', currency: 'CZK' }, items: [], business: business('Salon Anna'), ...overrides,
})
const page = (entries: Visit[], next: Schema<'VisitorHistoryCursor'> | null = null) => ({ status: 200, data: { entries, next_cursor: next } })
const feed = (routes: Parameters<typeof mockVisitorApi>[0]) => {
  const api = mockVisitorApi(routes)
  renderVisitor({ '/visitor/visits': <RequireVisitor><VisitorVisits /></RequireVisitor> }, '/visitor/visits')
  return api
}

beforeEach(() => { resetStores(); resetVisitor(); signInVisitor() })

it('sends a visitor without a session to the visitor login and back', async () => {
  resetVisitor()
  feed({})
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/login?next=%2Fvisitor%2Fvisits'))
})

it('shows exact amounts per visit, price on request and never a total', async () => {
  feed({ 'GET /visitor/visits': page([
    visit(1, { price: { amount: '1250.50', currency: 'CZK' } }),
    visit(2, { price: { amount: '28.00', currency: 'EUR' }, business_id: 4, business: business('Studio B') }),
    visit(3, { price: null, service_name: 'Consultation' }),
  ]) })
  const list = await screen.findByRole('list')
  expect(within(list).getAllByRole('listitem')).toHaveLength(3)
  expect(list).toHaveTextContent('CZK 1,250.50')
  expect(list).toHaveTextContent('€28.00')
  expect(screen.getByText('Price on request')).toBeInTheDocument()
  expect(screen.queryByText(/total/i)).not.toBeInTheDocument()
})

it('names the salon time zone when it differs from the browser', async () => {
  feed({ 'GET /visitor/visits': page([visit(1, { business: business('Far away', 'Pacific/Kiritimati') })]) })
  expect(await screen.findByText('salon time, Pacific/Kiritimati')).toBeInTheDocument()
})

it('keeps the list when one salon sends a broken time zone', async () => {
  feed({ 'GET /visitor/visits': page([visit(1, { business: business('Broken', 'Mars/Base') }), visit(2, { service_name: 'Manicure' })]) })
  expect(await screen.findByText('Manicure')).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})

it('explains how visits get into an empty cabinet', async () => {
  feed({ 'GET /visitor/visits': page([]) })
  expect(await screen.findByRole('heading', { name: 'No visits yet' })).toBeInTheDocument()
  expect(screen.getByText('Book online')).toBeInTheDocument()
  expect(screen.getByText('Invitation from the salon')).toBeInTheDocument()
})

it('pages with the cursor and its as_of for a category', async () => {
  const cursor = { date_start: '2030-11-20T09:00:00Z', id: 1, as_of: '2030-11-13T08:00:00Z' }
  const { calls } = feed({ 'GET /visitor/visits': config => config.params.after_id ? page([visit(2, { service_name: 'Second' })]) : page([visit(1)], cursor) })
  await userEvent.click(await screen.findByRole('button', { name: 'Show more' }))
  expect(await screen.findByText('Second')).toBeInTheDocument()
  expect(calls[0].params).toMatchObject({ category: 'upcoming', limit: 25 })
  expect(calls[1].params).toMatchObject({ category: 'upcoming', after_start: cursor.date_start, after_id: 1, as_of: cursor.as_of })
})

it('keeps loaded visits when the next page fails', async () => {
  const cursor = { date_start: '2030-11-20T09:00:00Z', id: 1, as_of: '2030-11-13T08:00:00Z' }
  feed({ 'GET /visitor/visits': config => config.params.after_id ? error(500, 'Server trouble') : page([visit(1, { service_name: 'First' })], cursor) })
  await userEvent.click(await screen.findByRole('button', { name: 'Show more' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Server trouble')
  expect(screen.getByText('First')).toBeInTheDocument()
})

it('switches category and filters by salon through the API', async () => {
  const { calls } = feed({ 'GET /visitor/visits': page([visit(1), visit(2, { business_id: 4, business: business('Studio B') })]) })
  await screen.findAllByRole('listitem')
  await userEvent.click(screen.getByRole('tab', { name: 'Past' }))
  await waitFor(() => expect(calls.at(-1)?.params).toMatchObject({ category: 'past' }))
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Salon' }), 'Studio B')
  await waitFor(() => expect(calls.at(-1)?.params).toMatchObject({ category: 'past', business_id: 4 }))
})

it('offers a retry when the list fails to load', async () => {
  feed({ 'GET /visitor/visits': error(500, 'Server trouble') })
  expect(await screen.findByRole('alert')).toHaveTextContent('Server trouble')
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
})
