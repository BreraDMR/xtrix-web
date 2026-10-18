import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Services from '../pages/Services'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

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
      '/services/': { items: [service(1, 'Hot stones', 'Basalt stones, 50 °C'), service(2, 'Haircut', null)], total: 2 },
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
