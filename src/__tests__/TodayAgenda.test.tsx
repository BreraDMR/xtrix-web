import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodayAgenda from '../components/dashboard/TodayAgenda'
import api from '../api/client'
import type { operations } from '../api/schema'
import type { EmployeeOut, Schema, VisitOut } from '../api/types'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { useAuthStore } from '../store/authStore'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

type VisitParams = NonNullable<operations['visits_list_visits__get']['parameters']['query']>
type VisitPage = Schema<'PaginatedResponse_VisitOut_'>
const access: WorkspaceAccess = {
  crm_mode: 'full', can_export: true, can_manage_billing: true, can_use_ai: true,
  checkout_available: false, pilot_mode: false,
}
const makeRows = (count = 125): VisitOut[] => Array.from({ length: count }, (_, index) => ({
  id: index + 1, client_id: index + 1, client_name: `Guest ${index + 1}`, late_cancel: false,
  service_id: 3, service_name: 'Consultation', specialist_id: 7,
  date_start: '2026-10-22T09:00:00Z', date_end: '2026-10-22T10:00:00Z',
  created_at: '2026-10-01T08:00:00Z', status: 'planned', items: [],
}))
const pageOf = (rows: VisitOut[], params?: VisitParams): VisitPage => {
  const page = params?.page ?? 1
  const per_page = params?.per_page ?? 20
  return { page, per_page, total: rows.length, pages: Math.ceil(rows.length / per_page),
    items: rows.slice((page - 1) * per_page, page * per_page) }
}

function serve(rows = makeRows(), employees: EmployeeOut[] = []) {
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url === '/employees/') return Promise.resolve({ data: employees })
    if (url !== '/visits/') return Promise.reject(apiError(404, `Unexpected URL ${url}`))
    return Promise.resolve({ data: pageOf(rows, config?.params as VisitParams) })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  // Only Date is fake in ordinary tests; polling/user events keep their real timers.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'))
  resetStores()
  signIn({ id: 7, full_name: 'My Name', role: 'specialist', business_id: 4, employer_id: 2 })
  useAuthStore.setState({ sessionRevision: 20 })
})
afterEach(() => { vi.useRealTimers() })

describe('TodayAgenda', () => {
  it('loads all 125 appointments, uses API names, and edits the last appointment', async () => {
    serve()
    const onEdit = vi.fn()
    const { queryClient } = renderWithProviders(<TodayAgenda timeZone="Europe/Prague" onEdit={onEdit} />)
    const last = await screen.findByText('Guest 125')
    expect(screen.getAllByRole('listitem')).toHaveLength(125)
    expect(within(last.closest('li')!).getByText('Consultation')).toBeInTheDocument()
    expect(within(last.closest('li')!).getByText('My Name')).toBeInTheDocument()
    expect(within(last.closest('li')!).getByText('Planned')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Edit: Guest 125' }))
    expect(onEdit).toHaveBeenCalledWith(125)
    const calls = vi.mocked(api.get).mock.calls.filter(([url]) => url === '/visits/')
    expect(calls.map(([, config]) => (config?.params as VisitParams).page)).toEqual([1, 2])
    for (const [, config] of calls) {
      expect(config?.params).toMatchObject({ per_page: 100, sort_by: 'date_start', sort_order: 'asc',
        date_from: '2026-10-21T22:00:00.000Z', date_to: '2026-10-22T21:59:59.999Z' })
      expect(config?.signal).toBeDefined()
    }
    expect(vi.mocked(api.get).mock.calls.some(([url]) => url === '/clients/' || url === '/employees/')).toBe(false)
    expect(queryClient.getQueryCache().getAll().find(query => query.queryKey[1] === 'today-agenda')?.queryKey)
      .toEqual(['visits', 'today-agenda', 20, 7, 4, 2, 'Europe/Prague',
        '2026-10-21T22:00:00.000Z', '2026-10-22T21:59:59.999Z'])
  })

  it('shows loading and then retry, never the first 100 rows when page two fails', async () => {
    let rejectLate: ((error: unknown) => void) | undefined
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/visits/') return Promise.reject(apiError(404, 'Unexpected URL'))
      const params = config?.params as VisitParams
      if (params.page === 2) return new Promise((_resolve, reject) => { rejectLate = reject })
      return Promise.resolve({ data: pageOf(makeRows(), params) })
    })
    renderWithProviders(<TodayAgenda timeZone="Europe/Prague" onEdit={vi.fn()} />)
    await waitFor(() => expect(rejectLate).toBeDefined())
    expect(screen.getByRole('status')).toHaveTextContent('Loading...')
    expect(screen.queryByText('Guest 1')).not.toBeInTheDocument()
    await act(async () => { rejectLate?.(apiError(500, 'Page two unavailable')) })
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    serve()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Guest 125')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(125)
  })

  it.each([
    ['2026-03-29T12:00:00Z', '2026-03-28T23:00:00.000Z', '2026-03-29T21:59:59.999Z', 23],
    ['2026-10-25T12:00:00Z', '2026-10-24T22:00:00.000Z', '2026-10-25T22:59:59.999Z', 25],
  ] as const)('requests the complete Prague DST day at %s', async (now, from, to, hours) => {
    vi.setSystemTime(new Date(now))
    serve([])
    renderWithProviders(<TodayAgenda timeZone="Europe/Prague" onEdit={vi.fn()} />)
    await screen.findByText('No appointments today')
    const params = vi.mocked(api.get).mock.calls.find(([url]) => url === '/visits/')?.[1]?.params as VisitParams
    expect(params).toMatchObject({ date_from: from, date_to: to })
    expect(Date.parse(to) - Date.parse(from) + 1).toBe(hours * 60 * 60 * 1000)
  })

  it('keeps viewing the service, specialist and status in read-only mode without an edit action', async () => {
    serve(makeRows(1))
    const onEdit = vi.fn()
    renderWithProviders(
      <WorkspaceAccessContext.Provider value={{ ...access, crm_mode: 'read_only' }}>
        <TodayAgenda timeZone="Europe/Prague" onEdit={onEdit} />
      </WorkspaceAccessContext.Provider>,
    )
    await screen.findByText('Guest 1')
    expect(screen.getByText('Consultation')).toBeInTheDocument()
    expect(screen.getByText('My Name')).toBeInTheDocument()
    expect(screen.getByText('Planned')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument()
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('uses the existing employee directory for owners, with #id for an unknown specialist', async () => {
    signIn({ id: 9, full_name: 'Owner', role: 'business_owner', business_id: 4 })
    const rows = makeRows(2)
    rows[1] = { ...rows[1], specialist_id: 999 }
    serve(rows, [{ id: 1, employee_user_id: 7, business_owner_id: 9, is_active: true,
      base_salary: 0, commission_percentage: 0, employee_user: { full_name: 'Colleague' } }])
    const { queryClient } = renderWithProviders(<TodayAgenda timeZone="Europe/Prague" onEdit={vi.fn()} />)
    await screen.findByText('Guest 2')
    expect(screen.getByText('Colleague')).toBeInTheDocument()
    expect(screen.getByText('#999')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/employees/', expect.objectContaining({ params: { is_active: true } }))
    expect(queryClient.getQueryData(['employees', true])).toHaveLength(1)
  })

  it('keeps appointments visible when employee names fail and retries only the directory', async () => {
    signIn({ id: 9, full_name: 'Owner', role: 'business_owner', business_id: 4 })
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url === '/employees/') return Promise.reject(apiError(503, 'Directory unavailable'))
      return Promise.resolve({ data: pageOf(makeRows(1), config?.params as VisitParams) })
    })
    renderWithProviders(<TodayAgenda timeZone="Europe/Prague" onEdit={vi.fn()} />)
    expect(await screen.findByText('Guest 1')).toBeInTheDocument()
    expect(await screen.findByText('Specialist names are unavailable. Appointments are still shown.')).toBeInTheDocument()
    expect(screen.getByText('#7')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    const visitsBefore = vi.mocked(api.get).mock.calls.filter(([url]) => url === '/visits/').length
    serve(makeRows(1), [{ id: 1, employee_user_id: 7, business_owner_id: 9, is_active: true,
      base_salary: 0, commission_percentage: 0, employee_user: { full_name: 'Recovered Name' } }])
    await userEvent.click(screen.getByRole('button', { name: 'Retry names' }))
    expect(await screen.findByText('Recovered Name')).toBeInTheDocument()
    expect(screen.getByText('Guest 1')).toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/visits/')).toHaveLength(visitsBefore)
  })

  it('marks what is on now, what comes next and what ended without being closed', async () => {
    // now is 12:00Z; every row is today in Prague
    const row = (id: number, name: string, start: string, end: string, status: string): VisitOut => ({
      ...makeRows(1)[0], id, client_id: id, client_name: name,
      date_start: `2026-10-22T${start}:00Z`, date_end: `2026-10-22T${end}:00Z`, status })
    serve([
      row(1, 'Cancelled early', '07:00', '08:00', 'cancelled'),
      row(2, 'Forgotten guest', '08:00', '09:00', 'planned'),
      row(3, 'Done guest', '09:00', '10:00', 'completed'),
      row(4, 'Running late', '10:00', '11:00', 'in_progress'),
      row(5, 'Chair guest', '11:30', '12:30', 'in_progress'),
      row(6, 'Next guest', '13:00', '14:00', 'planned'),
      row(7, 'Parallel next', '13:00', '13:30', 'planned'),
      row(8, 'Evening guest', '15:00', '16:00', 'planned'),
    ])
    const onEdit = vi.fn()
    renderWithProviders(<TodayAgenda timeZone="Europe/Prague" onEdit={onEdit} />)
    await screen.findByText('Evening guest')
    const item = (name: string) => within(screen.getByText(name).closest('li')!)
    expect(item('Forgotten guest').getByText('Not closed')).toBeInTheDocument()
    expect(item('Running late').getByText('Not closed')).toBeInTheDocument()
    expect(item('Chair guest').getByText('Now')).toBeInTheDocument()
    expect(item('Next guest').getByText('Next')).toBeInTheDocument()
    expect(item('Parallel next').getByText('Next')).toBeInTheDocument()
    for (const name of ['Cancelled early', 'Done guest', 'Evening guest']) {
      expect(item(name).queryByText(/^(Now|Next|Not closed)$/)).not.toBeInTheDocument()
    }
    expect(screen.getAllByText('Not closed')).toHaveLength(2)
    expect(screen.getByText('Needs attention: 2 appointments ended but are not marked completed or cancelled'))
      .toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Close the first one: Forgotten guest' }))
    expect(onEdit).toHaveBeenCalledWith(2)
  })

  it('does not offer to close anything in a read-only salon but still names the problem', async () => {
    serve(makeRows(1))
    renderWithProviders(
      <WorkspaceAccessContext.Provider value={{ ...access, crm_mode: 'read_only' }}>
        <TodayAgenda timeZone="Europe/Prague" onEdit={vi.fn()} />
      </WorkspaceAccessContext.Provider>,
    )
    expect(await screen.findByText(/Needs attention: 1 appointments/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Close the first one/ })).not.toBeInTheDocument()
  })

  it('shows the next three planned appointments after an empty day', async () => {
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/visits/') return Promise.reject(apiError(404, 'Unexpected URL'))
      const params = config?.params as VisitParams
      if (params.date_from === '2026-10-21T22:00:00.000Z') return Promise.resolve({ data: pageOf([], params) })
      const later = makeRows(3).map((visit, index) => ({ ...visit, client_name: `Later ${index + 1}`,
        date_start: `2026-10-2${4 + index}T08:00:00Z`, date_end: `2026-10-2${4 + index}T09:00:00Z` }))
      return Promise.resolve({ data: pageOf(later, params) })
    })
    const onEdit = vi.fn()
    renderWithProviders(<TodayAgenda timeZone="Europe/Prague" onEdit={onEdit} />)
    expect(await screen.findByText('No appointments today')).toBeInTheDocument()
    const upcoming = await screen.findByRole('list', { name: 'Coming up' })
    expect(within(upcoming).getAllByRole('listitem')).toHaveLength(3)
    expect(within(upcoming).getByText('Later 1').closest('li')).toHaveTextContent('Sat 24 Oct, 10:00')
    await userEvent.click(within(upcoming).getByRole('button', { name: 'Edit: Later 3' }))
    expect(onEdit).toHaveBeenCalledWith(3)
    const upcomingCall = vi.mocked(api.get).mock.calls.map(([, config]) => config?.params as VisitParams)
      .find(params => params.date_from !== '2026-10-21T22:00:00.000Z')
    expect(upcomingCall).toEqual({ page: 1, per_page: 3, status: 'planned', date_from: '2026-10-22T22:00:00.000Z',
      sort_by: 'date_start', sort_order: 'asc' })
  })

  it('switches to the next business day while the page stays open', async () => {
    vi.useRealTimers()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-22T21:59:30Z'))
    vi.mocked(api.get).mockImplementation((url, config) => {
      if (url !== '/visits/') return Promise.reject(apiError(404, 'Unexpected URL'))
      const params = config?.params as VisitParams
      const nextDay = params.date_from === '2026-10-22T22:00:00.000Z'
      const row = { ...makeRows(1)[0], client_name: nextDay ? 'New day guest' : 'Old day guest' }
      return Promise.resolve({ data: pageOf([row], params) })
    })
    const { unmount } = renderWithProviders(<TodayAgenda timeZone="Europe/Prague" onEdit={vi.fn()} />)
    await act(async () => { await vi.advanceTimersByTimeAsync(10) })
    expect(screen.getByText('Old day guest')).toBeInTheDocument()
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000) })
    // Query observers notify on a timer after React commits the new day's subscription.
    await act(async () => { await vi.advanceTimersByTimeAsync(10) })
    expect(screen.getByText('New day guest')).toBeInTheDocument()
    expect(screen.queryByText('Old day guest')).not.toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls.map(([, config]) => (config?.params as VisitParams).date_from))
      .toEqual(['2026-10-21T22:00:00.000Z', '2026-10-22T22:00:00.000Z'])
    unmount()
    const before = vi.mocked(api.get).mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(120_000) })
    expect(vi.mocked(api.get)).toHaveBeenCalledTimes(before)
  })
})
