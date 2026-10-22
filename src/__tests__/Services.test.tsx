import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Services from '../pages/Services'
import api from '../api/client'
import type { ReactNode } from 'react'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../ui/SidePanel', () => ({ default: ({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) => <div role="dialog" aria-label={title}><button onClick={onClose}>Close service</button>{children}</div> }))

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const service = (id: number, name: string, description: string | null) => ({
  id, name, description, duration_minutes: 60, price: 900, is_active: true, specialist_id: 7,
})

describe('Services list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
  })

  it('shows the description under the service name', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/services/': [service(1, 'Hot stones', 'Basalt stones, 50 °C'), service(2, 'Haircut', null)],
    }))
    renderWithProviders(<Services />)
    const row = (await screen.findByText('Hot stones')).closest('tr')!
    expect(within(row).getByText('Basalt stones, 50 °C')).toBeInTheDocument()
    expect(screen.getByText('Haircut').closest('td')?.querySelector('p')).toBeNull()
  })

  it('finds a service by words from its description', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/services/': [service(1, 'Hot stones', 'Basalt stones, 50 °C'), service(2, 'Haircut', null)],
    }))
    renderWithProviders(<Services />)
    await screen.findByText('Hot stones')
    await userEvent.type(screen.getByPlaceholderText(/search/i), 'basalt')
    expect(await screen.findByText('Hot stones')).toBeInTheDocument()
    await vi.waitFor(() => expect(screen.queryByText('Haircut')).not.toBeInTheDocument())
  })
})

it('searches the full directory and resets pagination and visible search on clearing', async () => {
  const rows = Array.from({ length: 125 }, (_, i) => service(i + 1, `Treatment ${String(i + 1).padStart(3, '0')}`, null))
  vi.mocked(api.get).mockImplementation(routes({ '/services/': rows }))
  renderWithProviders(<Services />)
  await screen.findByText('Treatment 001')
  await userEvent.click(screen.getByRole('button', { name: '2' }))
  await userEvent.type(screen.getByPlaceholderText(/search/i), 'Treatment 125')
  expect(await screen.findByText('Treatment 125')).toBeInTheDocument()
  expect(screen.getAllByRole('row')).toHaveLength(2)
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(screen.getByPlaceholderText(/search/i)).toHaveValue('')
  expect(await screen.findByText('Treatment 001')).toBeInTheDocument()
})

it('offers a retry instead of a partial directory when the next page fails', async () => {
  const rows = Array.from({ length: 125 }, (_, i) => service(i + 1, `Treatment ${i + 1}`, null))
  const read = routes({ '/services/': rows })
  vi.mocked(api.get).mockImplementation((url, config) => {
    if ((config?.params as { page?: number } | undefined)?.page === 2) return Promise.reject(apiError(500, 'Second page unavailable'))
    return read(url, config)
  })
  renderWithProviders(<Services />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
  expect(screen.queryByText('Treatment 1')).not.toBeInTheDocument()
  vi.mocked(api.get).mockImplementation(read)
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('Treatment 1')).toBeInTheDocument()
})


it('keeps search controls available after a directory failure and retries with the typed filter', async () => {
  vi.mocked(api.get).mockRejectedValue(apiError(503, 'Unavailable'))
  renderWithProviders(<Services />)
  await screen.findByRole('alert')
  const search = screen.getByRole('searchbox', { name: 'Search by service name...' })
  await userEvent.type(search, 'Stones')
  vi.mocked(api.get).mockImplementation(routes({ '/services/': [service(1, 'Stones', null), service(2, 'Cut', null)] }))
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('Stones')).toBeInTheDocument()
  expect(screen.queryByText('Cut')).not.toBeInTheDocument()
  expect(search).toHaveValue('Stones')
})

it('opens an editor beside the list and preserves the searched page after cancelling', async () => {
  const rows = Array.from({ length: 25 }, (_, i) => service(i + 1, `Treatment ${String(i + 1).padStart(3, '0')}`, null))
  vi.mocked(api.get).mockImplementation(routes({ '/services/': rows, '/employees/': [], '/users/': [], '/services/22': rows[21] }))
  renderWithProviders(<Services />)
  await screen.findByText('Treatment 001')
  await userEvent.type(screen.getByRole('searchbox'), 'Treatment')
  await userEvent.click(screen.getByRole('button', { name: '2' }))
  await userEvent.click(screen.getByRole('button', { name: 'Edit: Treatment 022' }))
  const editor = screen.getByRole('dialog', { name: 'Edit service' })
  expect(await within(editor).findByDisplayValue('Treatment 022')).toBeInTheDocument()
  await userEvent.click(within(editor).getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toHaveValue('Treatment')
  expect(screen.getByText('Treatment 022')).toBeInTheDocument()
  expect(screen.queryByText('Treatment 001')).not.toBeInTheDocument()
})

it('keeps read-only services searchable without create or edit controls', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/services/': [service(1, 'Massage', null)] }))
  const access: WorkspaceAccess = { crm_mode: 'read_only', can_export: false, can_manage_billing: true, can_use_ai: false, checkout_available: false, pilot_mode: true }
  renderWithProviders(<WorkspaceAccessContext.Provider value={access}><Services /></WorkspaceAccessContext.Provider>)
  await screen.findByText('Massage')
  expect(screen.getByRole('searchbox')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Add Service' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Edit:/ })).not.toBeInTheDocument()
})


it('returns to the last valid page when editing removes the final filtered row', async () => {
  const rows = Array.from({ length: 21 }, (_, i) => service(i + 1, `Treatment ${String(i + 1).padStart(3, '0')}`, null))
  vi.mocked(api.get).mockImplementation((url, config) => routes({ '/services/': rows.filter(row => row.is_active),
    '/services/21': rows[20], '/employees/': [], '/users/': [] })(url, config))
  vi.mocked(api.put).mockImplementation(async () => { rows[20].is_active = false; return { data: rows[20] } })
  renderWithProviders(<Services />)
  await screen.findByText('Treatment 001')
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'active')
  await userEvent.click(screen.getByRole('button', { name: '2' }))
  await userEvent.click(screen.getByRole('button', { name: 'Edit: Treatment 021' }))
  const editor = screen.getByRole('dialog', { name: 'Edit service' })
  await within(editor).findByDisplayValue('Treatment 021')
  await userEvent.click(within(editor).getByRole('checkbox', { name: 'Active' }))
  await userEvent.click(within(editor).getByRole('button', { name: 'Update Service' }))
  expect(await screen.findByText('Treatment 001')).toBeInTheDocument()
  expect(screen.queryByText('Treatment 021')).not.toBeInTheDocument()
  expect(screen.getByText('Showing 1–20 of 20 results')).toBeInTheDocument()
})
