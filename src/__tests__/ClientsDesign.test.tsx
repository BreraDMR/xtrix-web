import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import Clients from '../pages/Clients'
import ClientWorkspace from '../components/clients/ClientWorkspace'
import api from '../api/client'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'
import type { ClientOverviewOut, ClientOverviewVisit } from '../api/types'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

const access: WorkspaceAccess = { crm_mode: 'full', can_export: true, can_use_ai: true,
  can_manage_billing: true, checkout_available: false, pilot_mode: false }
const rows = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, full_name: `Client ${i + 1}`,
  contact_phone: `+420 600 00${i}`, contact_email: null, gender: null }))

function visit(id: number, status: string, date: string): ClientOverviewVisit {
  return { id, date_start: date, date_end: null, status, service_name: `Service ${id}`, specialist_name: 'Anna', price: null, late_cancel: false }
}
function overview(recent: ClientOverviewVisit[], total = recent.length): ClientOverviewOut {
  return { client_id: 2, stats: { total_visits: total, completed_visits: recent.filter(v => v.status === 'completed').length,
    cancelled_visits: 0, no_show_visits: 0, late_cancel_visits: 0, last_visit_at: '2026-11-02T09:00:00Z', next_visit_at: null },
  next_visit: null, upcoming_visits: [], recent_visits: recent, payments: null }
}

function mockApi(recent: ClientOverviewVisit[] = [visit(10, 'completed', '2026-11-02T09:00:00Z')], total?: number) {
  vi.mocked(api.get).mockImplementation(routes({
    '/clients/': rows,
    '/clients/2': rows[1],
    '/clients/2/overview': overview(recent, total),
    '/clients/2/notes': [],
    '/clients/2/profile': { client_id: 2, tags: [], preferences: null },
  }))
}

function Location() {
  const location = useLocation()
  return <output aria-label="location">{location.pathname}{location.search}</output>
}

function renderDirectory(url = '/app/clients', value: WorkspaceAccess | undefined = access) {
  return renderWithProviders(<MemoryRouter initialEntries={[url]}>
    <WorkspaceAccessContext.Provider value={value}>
      <Routes>
        <Route path="/app/clients" element={<Clients />} />
        <Route path="/app/clients/:clientId" element={<ClientWorkspace />} />
      </Routes>
      <Location />
    </WorkspaceAccessContext.Provider>
  </MemoryRouter>, { router: false })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 1, role: 'business_owner', business_id: 1 })
  mockApi()
})

describe('client directory toolbar', () => {
  it('keeps one main action and puts import and export in an explicit menu', async () => {
    renderDirectory()
    await screen.findByText('Client 1')
    expect(screen.getByRole('button', { name: 'Add Client' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument()

    const more = screen.getByRole('button', { name: 'More actions' })
    expect(more).toHaveAttribute('aria-haspopup', 'menu')
    expect(more).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(more)
    const menu = screen.getByRole('menu', { name: 'More actions' })
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(within(menu).getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Import Clients from Excel', 'Export'])
    expect(within(menu).getByRole('menuitem', { name: 'Import Clients from Excel' })).toHaveFocus()

    await userEvent.keyboard('{ArrowDown}')
    expect(within(menu).getByRole('menuitem', { name: 'Export' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(more).toHaveFocus()

    await userEvent.click(more)
    await userEvent.click(screen.getByRole('menuitem', { name: 'Export' }))
    expect(await screen.findByRole('dialog', { name: 'Export Data' })).toBeInTheDocument()
  })

  it('in read-only mode shows no add or import, only export in the menu', async () => {
    renderDirectory('/app/clients', { ...access, crm_mode: 'read_only' })
    await screen.findByText('Client 1')
    expect(screen.queryByRole('button', { name: 'Add Client' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'More actions' }))
    expect(within(screen.getByRole('menu')).getAllByRole('menuitem').map(item => item.textContent)).toEqual(['Export'])
  })

  it('hides the menu when there is nothing to put in it', async () => {
    renderDirectory('/app/clients', { ...access, crm_mode: 'read_only', can_export: false })
    await screen.findByText('Client 1')
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument()
  })
})

describe('client directory keeps its context in the address', () => {
  it('restores sorting from the URL and writes a new sort back', async () => {
    renderDirectory('/app/clients?sort=full_name&order=desc&page=1')
    await screen.findByText('Client 1')
    expect(api.get).toHaveBeenCalledWith('/clients/', expect.objectContaining({
      params: expect.objectContaining({ sort_by: 'full_name', sort_order: 'desc' }),
    }))
    await userEvent.click(screen.getByRole('button', { name: /Phone/ }))
    await waitFor(() => expect(screen.getByRole('status', { name: 'location' })).toHaveTextContent('sort=contact_phone&order=asc'))
  })

  it('ignores a sort column the list does not offer', async () => {
    renderDirectory('/app/clients?sort=password&order=sideways')
    await screen.findByText('Client 1')
    expect(api.get).toHaveBeenCalledWith('/clients/', expect.objectContaining({
      params: expect.objectContaining({ sort_by: 'id', sort_order: 'asc' }),
    }))
  })

  it('opens the client record from the URL and drops it on close, keeping the filter', async () => {
    renderDirectory('/app/clients?q=Client&client=2')
    expect(await screen.findByRole('heading', { name: 'Client 2' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.getByRole('status', { name: 'location' })).toHaveTextContent(/^\/app\/clients\?q=Client$/))

    await userEvent.click(screen.getByRole('button', { name: 'Open: Client 2' }))
    await waitFor(() => expect(screen.getByRole('status', { name: 'location' })).toHaveTextContent('q=Client&client=2'))
  })

  it('goes back from the full page to the same filtered list with the record open', async () => {
    renderDirectory('/app/clients?q=Client&sort=full_name&order=desc&client=2')
    await userEvent.click(await screen.findByRole('link', { name: 'Open full page' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Client 2' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Back to clients' }))
    await waitFor(() => expect(screen.getByRole('status', { name: 'location' }))
      .toHaveTextContent('/app/clients?q=Client&sort=full_name&order=desc&client=2'))
  })
})

describe('client record history', () => {
  it('shows each visit status with a shape, not only a word, and the last visit date', async () => {
    mockApi([visit(10, 'completed', '2026-11-02T09:00:00Z'), visit(11, 'cancelled', '2026-10-20T09:00:00Z')])
    renderDirectory('/app/clients/2')
    const history = await screen.findByRole('region', { name: 'Visit history' })
    const items = within(history).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('✓')
    expect(items[0]).toHaveTextContent('Completed')
    expect(items[1]).toHaveTextContent('✕')
    expect(within(items[0]).getByText('Completed').closest('[data-status]')).toHaveAttribute('data-status', 'completed')
    expect(screen.getByText('Last visit')).toBeInTheDocument()
  })

  it('says when the history is cut to the latest visits', async () => {
    const recent = Array.from({ length: 20 }, (_, i) => visit(100 + i, 'completed', `2026-10-${String(i + 1).padStart(2, '0')}T09:00:00Z`))
    mockApi(recent, 34)
    renderDirectory('/app/clients/2')
    const history = await screen.findByRole('region', { name: 'Visit history' })
    expect(within(history).getByText('Showing the latest 20 past visits')).toBeInTheDocument()
  })

  it('does not claim a cut when the whole history fits', async () => {
    renderDirectory('/app/clients/2')
    const history = await screen.findByRole('region', { name: 'Visit history' })
    expect(within(history).queryByText(/Showing the latest/)).not.toBeInTheDocument()
  })
})
