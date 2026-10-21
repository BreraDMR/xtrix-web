import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import Clients from '../pages/Clients'
import Visits from '../pages/Visits'
import Employees from '../pages/Employees'
import Services from '../pages/Services'
import Inventory from '../pages/Inventory'
import Finance from '../pages/Finance'
import Dashboard from '../pages/Dashboard'
import Layout from '../components/Layout'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 1, role: 'specialist' }) })
it.each([500, 401, 403, 0])('shows a retry for a failed collection (%s)', async status => {
  vi.mocked(api.get).mockRejectedValue(status ? apiError(status, 'failed') : new Error('offline'))
  renderWithProviders(<Clients />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
  const count = vi.mocked(api.get).mock.calls.length
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(vi.mocked(api.get).mock.calls.length).toBeGreaterThan(count)
})
it('reacts to network events and hides business navigation for a specialist', () => {
  renderWithProviders(<Layout />)
  fireEvent(window, new Event('offline'))
  expect(screen.getByRole('status')).toHaveTextContent('No internet connection')
  fireEvent(window, new Event('online'))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Inventory' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Finance' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Analytics' })).not.toBeInTheDocument()
})

it.each([Visits, Employees, Services, Inventory, Finance, Dashboard])('shows failure instead of empty data on %s', async Page => {
  signIn({ id: 1, role: 'business_owner', business_id: 1 })
  vi.mocked(api.get).mockRejectedValue(apiError(500, 'failed'))
  renderWithProviders(<Page />)
  // Finance also renders the deposit desk, which may report its own failure first
  expect(await screen.findByText('Unable to load data')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
})

it.each([
  ['a solo specialist', { employer_id: null }, true],
  ['a specialist on staff', { employer_id: 5, business_id: 1 }, false],
])('shows the subscription link to %s by employer_id from /users/me', (_who, extra, shown) => {
  signIn({ id: 1, role: 'specialist', ...extra })
  renderWithProviders(<Layout />)
  expect(screen.queryAllByRole('link', { name: 'Billing' }).length > 0).toBe(shown)
})
