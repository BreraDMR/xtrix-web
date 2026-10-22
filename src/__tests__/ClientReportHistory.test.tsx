import { beforeEach, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientPersonalReportModal from '../components/ClientPersonalReportModal'
import api from '../api/client'
import type { ClientOut, Schema, VisitOut } from '../api/types'
import { apiError, renderWithProviders, resetStores } from '../test/render'
import { useAuthStore } from '../store/authStore'
import { WorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import { exportData } from '../utils/export'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
vi.mock('../utils/export', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/export')>(), exportData: vi.fn().mockResolvedValue(undefined),
}))

const client: ClientOut = { id: 5, full_name: 'History Client', language: 'en', created_at: '2026-01-01T10:00:00Z' }
const rows: VisitOut[] = Array.from({ length: 125 }, (_, index) => ({
  id: index + 1, client_id: 5, specialist_id: 1, date_start: '2026-06-15T10:00:00Z',
  created_at: '2026-06-01T08:00:00Z', service_name: `Service ${index + 1}`,
  status: index === 124 ? 'planned' : 'completed', price: 10, payment_method: 'cash',
}))
function serveHistory(failLate = false, visits = rows) {
  vi.mocked(api.get).mockImplementation((url) => {
    if (url === '/clients/5') return Promise.resolve({ data: client })
    if (url === '/businesses/me') return Promise.resolve({ data: { id: 1, currency: 'EUR' } })
    if (url.startsWith('/visits/?')) {
      const params = new URL(url, 'http://test.local').searchParams
      const page = Number(params.get('page') || 1), per_page = Number(params.get('per_page') || 20)
      if (failLate && page === 2) return Promise.reject(apiError(500, 'Late page failed'))
      const filtered = visits.filter(visit => (!params.get('date_from') || Date.parse(visit.date_start) >= Date.parse(params.get('date_from')!))
        && (!params.get('date_to') || Date.parse(visit.date_start) <= Date.parse(params.get('date_to')!)))
      const data: Schema<'PaginatedResponse_VisitOut_'> = { page, per_page, total: filtered.length,
        pages: Math.ceil(filtered.length / per_page), items: filtered.slice((page - 1) * per_page, page * per_page) }
      return Promise.resolve({ data })
    }
    return Promise.reject(apiError(404, `No mock for ${url}`))
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  useAuthStore.getState().setAuth('test-token', {
    id: 1, full_name: 'Owner', role: 'business_owner', business_id: 1, employer_id: null,
  })
  localStorage.setItem('client-report-preferences-5', JSON.stringify({ reportType: 'visits', dateFrom: '2026-01-01', dateTo: '2026-12-31' }))
})
it('exports every page of this client history to CSV and PDF, including visit 125', async () => {
  serveHistory()
  renderWithProviders(<ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />)
  const table = await screen.findByRole('table')
  await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(126))
  expect(within(table).getByText('Service 125')).toBeInTheDocument()
  for (const format of ['CSV', 'PDF']) {
    await userEvent.click(screen.getByRole('button', { name: /Export.*Print/ }))
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${format}`) }))
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    await waitFor(() => expect(exportData).toHaveBeenCalledTimes(format === 'CSV' ? 1 : 2))
    const payload = vi.mocked(exportData).mock.calls.at(-1)?.[0]
    expect(payload?.format).toBe(format.toLowerCase())
    expect(payload?.data).toHaveLength(125)
    expect(payload?.data.at(-1)).toMatchObject({ Service: 'Service 125', Status: 'Planned' })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument())
  }
  const requests = vi.mocked(api.get).mock.calls.filter(([url]) => url.startsWith('/visits/?'))
  expect(requests.map(([url]) => new URL(url, 'http://test.local').searchParams.get('page'))).toEqual(['1', '2'])
  for (const [url, config] of requests) {
    expect(new URL(url, 'http://test.local').searchParams.get('client_id')).toBe('5')
    expect(config?.signal).toBeDefined()
  }
  expect(JSON.parse(localStorage.getItem('client-report-preferences-5')!)).toEqual({
    reportType: 'visits', dateFrom: '2026-01-01', dateTo: '2026-12-31',
  })
})


it('fails closed on a late page and retries the complete history before allowing export', async () => {
  serveHistory(true)
  renderWithProviders(<ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Export.*Print/ })).toBeDisabled()
  expect(exportData).not.toHaveBeenCalled()
  serveHistory()
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('Service 125')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Export.*Print/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Export' }))
  await waitFor(() => expect(exportData).toHaveBeenCalledOnce())
  expect(vi.mocked(exportData).mock.calls[0][0].data).toHaveLength(125)
  const pages = vi.mocked(api.get).mock.calls.filter(([url]) => url.startsWith('/visits/?'))
    .map(([url]) => new URL(url, 'http://test.local').searchParams.get('page'))
  expect(pages).toEqual(['1', '2', '1', '2'])
})

it('uses the complete history in the finance view and reloads the selected period', async () => {
  serveHistory()
  renderWithProviders(<ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />)
  await screen.findByText('Service 125')
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Select Report Type' }), 'finance')
  expect(screen.getByLabelText('To Date')).toHaveValue('2026-12-31')
  let table = screen.getByRole('table')
  expect(within(table).getAllByRole('row')).toHaveLength(2)
  const values = within(within(table).getAllByRole('row')[1]).getAllByRole('cell').map(cell => cell.textContent)
  expect(values[1]).toBe('125')
  expect(values[2]).toBe('124')
  await userEvent.click(screen.getByRole('button', { name: /Export.*Print/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Export' }))
  await waitFor(() => expect(exportData).toHaveBeenCalledOnce())
  expect(vi.mocked(exportData).mock.calls[0][0].data[0]).toMatchObject({ 'Total Visits': 125, Completed: 124 })
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument())
  fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2026-07-01' } })
  await waitFor(() => {
    table = screen.getByRole('table')
    expect(within(within(table).getAllByRole('row')[1]).getAllByRole('cell')[1]).toHaveTextContent('0')
  })
  const requests = vi.mocked(api.get).mock.calls.filter(([url]) => url.startsWith('/visits/?'))
  expect(requests.every(([url]) => new URL(url, 'http://test.local').searchParams.get('client_id') === '5')).toBe(true)
})

it('preserves redacted prices and the workspace export permission', async () => {
  serveHistory(false, [{ ...rows[0], price: null, payment_method: null }])
  const { unmount } = renderWithProviders(<ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />)
  await screen.findByText('Service 1')
  await userEvent.click(screen.getByRole('button', { name: /Export.*Print/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Export' }))
  await waitFor(() => expect(exportData).toHaveBeenCalledOnce())
  expect(vi.mocked(exportData).mock.calls[0][0].data[0]).toMatchObject({ Price: '-', 'Payment Method': '-' })
  unmount()
  renderWithProviders(<WorkspaceAccessContext.Provider value={{ crm_mode: 'read_only', can_export: false,
    can_use_ai: false, can_manage_billing: true, checkout_available: false, pilot_mode: true }}>
    <ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />
  </WorkspaceAccessContext.Provider>)
  await screen.findByText('Service 1')
  expect(screen.getByRole('button', { name: /Export.*Print/ })).toBeDisabled()
  expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument()
  expect(exportData).toHaveBeenCalledOnce()
})

it('keeps an explicit zero visit price distinct from a redacted price in preview and export', async () => {
  serveHistory(false, [{ ...rows[0], price: 0 }, { ...rows[1], price: null }])
  renderWithProviders(<ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />)
  const table = await screen.findByRole('table')
  const visitRows = within(table).getAllByRole('row').slice(1)
  expect(within(visitRows[0]).getAllByRole('cell')[3]).toHaveTextContent('0.00 €')
  expect(within(visitRows[1]).getAllByRole('cell')[3]).toHaveTextContent('-')
  await userEvent.click(screen.getByRole('button', { name: /Export.*Print/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Export' }))
  await waitFor(() => expect(exportData).toHaveBeenCalledOnce())
  expect(vi.mocked(exportData).mock.calls[0][0].data).toMatchObject([{ Price: '0.00 €' }, { Price: '-' }])
})

it.each([
  { name: 'known zero revenue', visits: [{ ...rows[0], price: 0 }], revenue: '0.00 €' },
  { name: 'mixed known and redacted completed prices', visits: [{ ...rows[0], price: 10 }, { ...rows[1], price: null }], revenue: '-' },
  { name: 'redacted planned prices outside revenue', visits: [{ ...rows[0], price: 10 }, { ...rows[1], price: null, status: 'planned' as const }], revenue: '10.00 €' },
  { name: 'no completed visits', visits: [{ ...rows[0], price: null, status: 'planned' as const }], revenue: '0.00 €' },
])('preserves $name in finance preview and export', async ({ visits, revenue }) => {
  serveHistory(false, visits)
  localStorage.setItem('client-report-preferences-5', JSON.stringify({ reportType: 'finance', dateFrom: '2026-01-01', dateTo: '2026-12-31' }))
  renderWithProviders(<ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />)
  const table = await screen.findByRole('table')
  expect(within(within(table).getAllByRole('row')[1]).getAllByRole('cell')[3]).toHaveTextContent(revenue)
  await userEvent.click(screen.getByRole('button', { name: /Export.*Print/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Export' }))
  await waitFor(() => expect(exportData).toHaveBeenCalledOnce())
  expect(vi.mocked(exportData).mock.calls[0][0].data[0]).toMatchObject({ 'Total Revenue': revenue })
})

it('never requests a later old-session page with the next account credentials', async () => {
  let completeFirst: ((value: { data: Schema<'PaginatedResponse_VisitOut_'> }) => void) | undefined
  let initialSignal: AbortSignal | undefined
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url === '/businesses/me') return Promise.resolve({ data: { id: 1, currency: 'EUR' } })
    if (url === '/clients/5') return Promise.resolve({ data: client })
    if (url.startsWith('/visits/?')) {
      if (useAuthStore.getState().user?.id !== 1) return Promise.reject(apiError(403, 'Other account'))
      initialSignal = config?.signal as AbortSignal
      return new Promise(resolve => { completeFirst = resolve })
    }
    return Promise.reject(apiError(404, 'Missing'))
  })
  renderWithProviders(<ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />)
  await waitFor(() => expect(completeFirst).toBeDefined())
  await act(async () => {
    // Another tab completed a login, but its storage event has not run yet.
    localStorage.setItem('auth_token', 'other-token')
    localStorage.setItem('auth_user', JSON.stringify({ id: 2, full_name: 'Other Owner',
      role: 'business_owner', business_id: 2, employer_id: null }))
    completeFirst?.({ data: { page: 1, per_page: 100, total: 125, pages: 2, items: rows.slice(0, 100) } })
  })
  await screen.findByRole('alert')
  expect(useAuthStore.getState().user?.id).toBe(2)
  expect(initialSignal?.aborted).toBe(true)
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Export.*Print/ })).toBeDisabled()
  expect(vi.mocked(api.get).mock.calls.filter(([url]) => url.startsWith('/visits/?'))
    .some(([url]) => new URL(url, 'http://test.local').searchParams.get('page') === '2')).toBe(false)
  expect(exportData).not.toHaveBeenCalled()
})


it('allows a token refresh of the same account between pages', async () => {
  serveHistory()
  const read = vi.mocked(api.get).getMockImplementation()!
  vi.mocked(api.get).mockImplementation(async (url, config) => {
    const result = await read(url, config)
    if (url.startsWith('/visits/?') && new URL(url, 'http://test.local').searchParams.get('page') === '1') {
      useAuthStore.getState().setToken('refreshed-token')
    }
    return result
  })
  const revision = useAuthStore.getState().sessionRevision
  renderWithProviders(<ClientPersonalReportModal isOpen clientId={5} onClose={vi.fn()} />)
  expect(await screen.findByText('Service 125')).toBeInTheDocument()
  expect(useAuthStore.getState().token).toBe('refreshed-token')
  expect(useAuthStore.getState().sessionRevision).toBe(revision)
  expect(screen.getByRole('button', { name: /Export.*Print/ })).toBeEnabled()
})
