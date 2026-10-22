import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Clients from '../pages/Clients'
import api from '../api/client'
import type { operations } from '../api/schema'
type ClientQuery = NonNullable<operations['list_clients_clients__get']['parameters']['query']>
import { exportData } from '../utils/export'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }))
vi.mock('../utils/export', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/export')>(), exportData: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 2, role: 'specialist' })
})

describe('client directory controls', () => {
  it('searches from the first page and clears both the filter and its visible input', async () => {
    const clients = Array.from({ length: 22 }, (_, index) => ({
      id: index + 1, full_name: `Client ${String(index + 1).padStart(2, '0')}`,
      contact_phone: null, contact_email: null, gender: null,
    }))
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/clients/') return routes({})(url, config)
      const { page = 1, per_page = 20, q = '' } = (config?.params as ClientQuery | undefined) ?? {}
      const found = clients.filter(row => row.full_name.toLowerCase().includes(String(q).toLowerCase()))
      return Promise.resolve({ data: { items: found.slice((page - 1) * per_page, page * per_page),
        total: found.length, page, per_page, pages: Math.ceil(found.length / per_page) } })
    })
    renderWithProviders(<Clients />)
    await userEvent.click(await screen.findByRole('button', { name: '2' }))
    expect(await screen.findByText('Client 22')).toBeInTheDocument()
    const search = screen.getByRole('searchbox')
    await userEvent.type(search, 'Client 01')
    expect(await screen.findByText('Client 01')).toBeInTheDocument()
    expect(screen.queryByText('Client 22')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(search).toHaveValue('')
    expect(await screen.findByText('Client 02')).toBeInTheDocument()
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/clients/', expect.objectContaining({
      params: expect.objectContaining({ page: 1 }),
    })))
  })

  it('uses server totals beyond 100 records and searches the whole allowed collection', async () => {
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/clients/') return routes({})(url, config)
      const params = (config?.params as ClientQuery | undefined) ?? {}
      const found = params.q ? [{ id: 125, full_name: 'Last client' }] :
        Array.from({ length: 20 }, (_, i) => ({ id: i + 1, full_name: `First page ${i}` }))
      return Promise.resolve({ data: { items: found, total: params.q ? 1 : 125,
        page: 1, per_page: 20, pages: params.q ? 1 : 7 } })
    })
    renderWithProviders(<Clients />)
    expect(await screen.findByText('First page 0')).toBeInTheDocument()
    expect(screen.getByText(/of 125/i)).toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox'), 'Last client')
    expect(await screen.findByText('Last client')).toBeInTheDocument()
    expect(screen.queryByText('First page 0')).not.toBeInTheDocument()
  })

  it('exports the whole allowed result rather than the visible page', async () => {
    const rows = Array.from({ length: 125 }, (_, id) => ({ id: id + 1, full_name: `Allowed client ${id + 1}` }))
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/clients/') return routes({})(url, config)
      const { page = 1, per_page = 20 } = (config?.params as ClientQuery | undefined) ?? {}
      return Promise.resolve({ data: { items: rows.slice((page - 1) * per_page, page * per_page),
        total: 125, page, per_page, pages: Math.ceil(125 / per_page) } })
    })
    renderWithProviders(<Clients />)
    await screen.findByText('Allowed client 1')
    expect(screen.queryByText('Allowed client 125')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(await screen.findByText('125 items')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Export' })[1])
    await waitFor(() => expect(exportData).toHaveBeenCalledWith(expect.objectContaining({ data: rows })))
  })
})

