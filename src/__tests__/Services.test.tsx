import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Services from '../pages/Services'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

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
    expect(screen.getByText('Haircut').closest('td')).toHaveTextContent(/^Haircut$/)
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
