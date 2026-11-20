import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
vi.mock('recharts', () => ({ PieChart: () => null, Pie: () => null, Cell: () => null,
  ResponsiveContainer: () => null, Legend: () => null, Tooltip: () => null,
  BarChart: () => null, Bar: () => null, XAxis: () => null, YAxis: () => null, CartesianGrid: () => null }))

beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'business_owner' }) })

it('guides a new owner to create a business without requesting financial reports', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': null }))
  renderWithProviders(<Dashboard />)
  expect(await screen.findByRole('heading', { name: 'Create your business' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Create business' })).toBeInTheDocument()
  expect(api.get).not.toHaveBeenCalledWith('/expenses/reports/profit')
})

it('loads the dashboard when the owner already has a business', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': { id: 1, currency: 'CZK' },
    '/expenses/reports/profit': { revenue: 0, expenses: 0, profit: 0 },
    '/analytics/visits/statistics': { total_visits: 0 }, '/analytics/clients/statistics': { total_clients: 0 } }))
  renderWithProviders(<Dashboard />)
  expect(await screen.findByText(/monthly profit/i)).toBeInTheDocument()
})


it('keeps today appointments visible when financial reports fail', async () => {
  const fallback = routes({ '/businesses/me': { id: 1, currency: 'CZK', timezone: 'Europe/Prague' },
    '/analytics/visits/statistics': { total_visits: 1, visits_by_status: { planned: 1 } },
    '/analytics/clients/statistics': { total_clients: 1 }, '/employees/': [],
    '/visits/': [{ id: 5, client_id: 1, client_name: "Today's guest", specialist_id: 7,
      date_start: new Date().toISOString(), status: 'planned', items: [] }] })
  vi.mocked(api.get).mockImplementation((url, config) => url === '/expenses/reports/profit'
    ? Promise.reject(apiError(503, 'Reports unavailable')) : fallback(url, config))
  renderWithProviders(<Dashboard />)
  expect(await screen.findByText("Today's guest")).toBeInTheDocument()
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
})

it('leaves out the money card for someone who may not see financials instead of showing an error', async () => {
  signIn({ id: 8, role: 'employee' })
  const fallback = routes({ '/businesses/me': { id: 1, currency: 'CZK', timezone: 'Europe/Prague' },
    '/analytics/visits/statistics': { total_visits: 0 }, '/analytics/clients/statistics': { total_clients: 2 },
    '/employees/': [], '/visits/': [] })
  vi.mocked(api.get).mockImplementation((url, config) => url === '/expenses/reports/profit'
    ? Promise.reject(apiError(403, 'Not allowed')) : fallback(url, config))
  renderWithProviders(<Dashboard />)
  expect(await screen.findByRole('heading', { name: 'Visit history' })).toBeInTheDocument()
  await new Promise(resolve => setTimeout(resolve, 50))
  expect(screen.queryByRole('heading', { name: 'This month' })).not.toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('puts the day first: appointments above setup prompts, the week and the month', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': { id: 1, currency: 'CZK', timezone: 'Europe/Prague' },
    '/onboarding/me': { persona: 'owner', welcome_dismissed: false, checklist_dismissed: true,
      completed_steps: 1, total_steps: 3, progress_percent: 33, next_step: 'service',
      steps: [{ key: 'business', completed: true, available: true }, { key: 'service', completed: false, available: true },
        { key: 'schedule', completed: false, available: true }] },
    '/expenses/reports/profit': { revenue: 0, expenses: 0, profit: 0 },
    '/analytics/visits/statistics': { total_visits: 0 }, '/analytics/clients/statistics': { total_clients: 0 },
    '/employees/': [], '/visits/': [] }))
  renderWithProviders(<Dashboard />)
  const agenda = await screen.findByRole('region', { name: "Today's appointments" })
  const welcome = await screen.findByRole('heading', { name: 'Welcome to Xtrix' })
  const week = screen.getByRole('heading', { name: 'This week' })
  const month = screen.getByRole('heading', { name: 'Business overview' })
  const follows = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
  expect(follows(agenda, welcome)).toBe(true)
  expect(follows(welcome, week)).toBe(true)
  expect(follows(week, month)).toBe(true)
})
