import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Visits from '../pages/Visits'
import api from '../api/client'
import type { operations } from '../api/schema'
import type { VisitOut } from '../api/types'
import { formatCurrency } from '../utils/currency'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
vi.mock('../components/VisitForm', () => ({ default: ({ visitId, onSuccess, onCancel }: {
  visitId?: number; onSuccess: () => void; onCancel: () => void
}) => <div><p>{visitId ? `Editing visit ${visitId}` : 'Creating a visit'}</p>
  <button onClick={onSuccess}>Save fixture</button><button onClick={onCancel}>Cancel fixture</button></div> }))

const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true } })
Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false } })
afterAll(() => {
  if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})
afterEach(() => { document.body.style.overflow = '' })
beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'specialist' }) })

type Query = NonNullable<operations['visits_list_visits__get']['parameters']['query']>
const rows: VisitOut[] = Array.from({ length: 45 }, (_, index) => ({
  id: index + 1, client_id: index + 1, client_name: `Guest ${String(index + 1).padStart(3, '0')}`,
  specialist_id: 7, service_name: 'Consultation', date_start: '2026-10-18T10:00:00Z',
  created_at: '2026-10-01T09:00:00Z', status: 'planned', price: index === 0 ? 0 : 20,
}))
function serve(available = rows, failDirectory = false) {
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url !== '/visits/') return routes({ '/businesses/me': { currency: 'EUR' } })(url, config)
    if (failDirectory) return Promise.reject(apiError(503, 'Directory unavailable'))
    const query = (config?.params as Query | undefined) ?? {}
    const found = available.filter(row => (!query.q || row.client_name?.includes(query.q)) && (!query.status || row.status === query.status))
    const page = query.page ?? 1
    const per_page = query.per_page ?? 20
    return Promise.resolve({ data: { page, per_page, total: found.length, pages: Math.ceil(found.length / per_page),
      items: found.slice((page - 1) * per_page, page * per_page) } })
  })
}

it('keeps the filtered second page mounted while opening, cancelling and saving an edit', async () => {
  serve()
  renderWithProviders(<Visits />)
  const search = screen.getByRole('searchbox')
  await userEvent.type(search, 'Guest')
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'planned')
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-10-01' } })
  fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-10-31' } })
  await userEvent.click(screen.getByRole('button', { name: 'Client' }))
  await userEvent.click(await screen.findByRole('button', { name: '2' }))
  const guest = await screen.findByRole('cell', { name: 'Guest 021' })
  const row = guest.closest('tr')!
  const edit = within(row).getByRole('button', { name: 'Edit' })
  await userEvent.click(edit)
  let panel = screen.getByRole('dialog', { name: 'Edit visit' })
  expect(within(panel).getByText('Editing visit 21')).toBeInTheDocument()
  expect(screen.getByRole('table')).toContainElement(row)
  expect(search).toBeInTheDocument()
  expect(search).toHaveValue('Guest')
  await act(async () => { fireEvent(panel, new Event('cancel', { cancelable: true })) })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(edit).toHaveFocus()
  expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  await userEvent.click(edit)
  panel = screen.getByRole('dialog', { name: 'Edit visit' })
  await userEvent.click(within(panel).getByRole('button', { name: 'Save fixture' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toBe(search)
  await waitFor(() => expect(api.get).toHaveBeenLastCalledWith('/visits/', expect.objectContaining({ params: expect.objectContaining({
    page: 2, per_page: 20, q: 'Guest', status: 'planned', sort_by: 'client_name', sort_order: 'asc',
  }) })))
  expect(screen.getByLabelText('From date')).toHaveValue('2026-10-01')
  expect(screen.getByLabelText('To date')).toHaveValue('2026-10-31')
})

it('keeps the list behind a new visit and restores its opener after cancelling', async () => {
  serve()
  renderWithProviders(<Visits />)
  await screen.findByRole('cell', { name: 'Guest 001' })
  const create = screen.getByRole('button', { name: 'New Visit' })
  await userEvent.click(create)
  const panel = screen.getByRole('dialog', { name: 'New Visit' })
  expect(within(panel).getByText('Creating a visit')).toBeInTheDocument()
  expect(screen.getByRole('table')).toBeInTheDocument()
  await userEvent.click(within(panel).getByRole('button', { name: 'Cancel fixture' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(create).toHaveFocus()
})

it('keeps viewing, filters and pagination in read-only mode, without mutation or export controls', async () => {
  serve()
  const access: WorkspaceAccess = { crm_mode: 'read_only', can_export: false, can_use_ai: false,
    can_manage_billing: false, checkout_available: false, pilot_mode: true }
  renderWithProviders(<WorkspaceAccessContext.Provider value={access}><Visits /></WorkspaceAccessContext.Provider>)
  await screen.findByRole('cell', { name: 'Guest 001' })
  expect(screen.queryByRole('button', { name: 'New Visit' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  expect(screen.queryByTitle('Export')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: '2' }))
  expect(await screen.findByRole('cell', { name: 'Guest 021' })).toBeInTheDocument()
  await userEvent.type(screen.getByRole('searchbox'), 'Guest 045')
  expect(await screen.findByRole('cell', { name: 'Guest 045' })).toBeInTheDocument()
})

it('leaves filters available after a refresh error and never presents stale rows or export as a successful result', async () => {
  serve()
  const { queryClient } = renderWithProviders(<Visits />)
  const search = screen.getByRole('searchbox')
  await userEvent.type(search, 'Guest 001')
  expect(await screen.findByRole('cell', { name: 'Guest 001' })).toBeInTheDocument()
  expect(screen.getByTitle('Export')).toBeEnabled()
  serve(rows, true)
  await act(async () => { await queryClient.invalidateQueries({ queryKey: ['visits'] }) })
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
  expect(search).toBeEnabled()
  expect(search).toHaveValue('Guest 001')
  expect(screen.queryByRole('cell', { name: 'Guest 001' })).not.toBeInTheDocument()
  expect(screen.queryByTitle('Export')).not.toBeInTheDocument()
  serve()
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByRole('cell', { name: 'Guest 001' })).toBeInTheDocument()
  expect(search).toHaveValue('Guest 001')
})

it('shows an actual zero price while keeping a redacted price unavailable', async () => {
  serve([rows[0], { ...rows[1], price: null }])
  renderWithProviders(<Visits />)
  const free = await screen.findByRole('cell', { name: 'Guest 001' })
  const redacted = await screen.findByRole('cell', { name: 'Guest 002' })
  expect(within(free.closest('tr')!).getByRole('cell', { name: formatCurrency(0, 'EUR') })).toBeInTheDocument()
  expect(within(redacted.closest('tr')!).getByRole('cell', { name: '-' })).toBeInTheDocument()
  expect(within(redacted.closest('tr')!).queryByText(formatCurrency(0, 'EUR'))).not.toBeInTheDocument()
})
