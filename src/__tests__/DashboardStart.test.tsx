import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
vi.mock('recharts', () => ({ PieChart: () => null, Pie: () => null, Cell: () => null,
  ResponsiveContainer: () => null, Legend: () => null, Tooltip: () => null }))

beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'business_owner' }) })

it('guides a new owner to create a business without requesting financial reports', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': null }))
  renderWithProviders(<Dashboard />)
  expect(await screen.findByRole('link', { name: 'Create Business' })).toHaveAttribute('href', '/business')
  expect(api.get).not.toHaveBeenCalledWith('/expenses/reports/profit')
})

it('loads the dashboard when the owner already has a business', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': { id: 1, currency: 'CZK' },
    '/expenses/reports/profit': { revenue: 0, expenses: 0, profit: 0 },
    '/analytics/visits/statistics': { total_visits: 0 }, '/analytics/clients/statistics': { total_clients: 0 } }))
  renderWithProviders(<Dashboard />)
  expect(await screen.findByText(/monthly profit/i)).toBeInTheDocument()
})
