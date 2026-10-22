import { beforeEach, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Employees from '../pages/Employees'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { exportData } from '../utils/export'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../utils/export', async importOriginal => ({ ...await importOriginal<typeof import('../utils/export')>(), exportData: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../api/client', () => ({ default: { get: vi.fn(), delete: vi.fn() } }))
vi.mock('../components/EmployeeForm', () => ({ default: ({ onCancel }: { onCancel: () => void }) => <button onClick={onCancel}>Cancel employee form</button> }))
const row = (id: number, active = true) => ({ id, business_owner_id: 1, employee_user_id: id + 1000,
  position: `Therapist ${id}`, is_active: active, commission_percentage: 10, base_salary: 1200,
  hired_at: '2026-01-20T10:00:00Z', employee_user: { id: id + 1000, full_name: `Team ${String(id).padStart(3, '0')}`,
    email: `team${id}@example.com`, phone: `+42070000${String(id).padStart(4, '0')}` } })
let people: ReturnType<typeof row>[]
let failLater: boolean
function readTeam() {
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url !== '/employees/') return routes({ '/businesses/me': { currency: 'EUR' } })(url, config)
    const params = config?.params as { page?: number; per_page?: number; is_active?: boolean } | undefined
    const page = params?.page ?? 1
    if (page === 2 && failLater) return Promise.reject(apiError(503, 'Later page unavailable'))
    const found = people.filter(person => params?.is_active === undefined || person.is_active === params.is_active)
    const size = params?.per_page ?? 20
    return Promise.resolve({ data: found.slice((page - 1) * size, page * size) })
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  useAuthStore.getState().setAuth('test-token', { id: 1, full_name: 'Owner', role: 'business_owner', business_id: 2, employer_id: null })
  people = Array.from({ length: 125 }, (_, index) => row(index + 1))
  failLater = false
  readTeam()
})

it('searches the complete array-paged directory including contacts after employee 100', async () => {
  renderWithProviders(<Employees />)
  await screen.findByText('Team 001')
  await userEvent.type(screen.getByPlaceholderText('Search employees...'), 'team125@example.com')
  const employeeRow = (await screen.findByText('Team 125')).closest('tr')!
  expect(within(employeeRow).getByText('+420700000125')).toBeInTheDocument()
  expect(within(employeeRow).getByText('Therapist 125')).toBeInTheDocument()
  expect(within(employeeRow).getByText('10%')).toBeInTheDocument()
  expect(within(employeeRow).getByText(/1[\s,.]?200/)).toBeInTheDocument()
  expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/employees/').map(([, config]) => (config?.params as { page?: number } | undefined)?.page)).toEqual([1, 2])
})

it('shows no partial rows when a later page fails and retries the complete directory', async () => {
  failLater = true
  renderWithProviders(<Employees />)
  await screen.findByRole('alert')
  expect(screen.queryByText('Team 001')).not.toBeInTheDocument()
  failLater = false
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  await screen.findByText('Team 001')
  await userEvent.type(screen.getByRole('searchbox'), 'Team 125')
  expect(await screen.findByText('Team 125')).toBeInTheDocument()
})

it('offers explicit active and inactive statuses with the actual API filter semantics', async () => {
  people = [row(1), row(2, false)]
  renderWithProviders(<Employees />)
  await screen.findByText('Team 001')
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'inactive')
  await screen.findByText('Team 002')
  expect(screen.queryByText('Team 001')).not.toBeInTheDocument()
})

it.each(['read_only', 'blocked'] as const)('keeps saved team details and salary navigation without %s mutations', async crm_mode => {
  people = [row(1)]
  const access: WorkspaceAccess = { crm_mode, can_export: false, can_manage_billing: true, can_use_ai: false, checkout_available: false, pilot_mode: true }
  renderWithProviders(<WorkspaceAccessContext.Provider value={access}><Employees /></WorkspaceAccessContext.Provider>)
  await screen.findByText('Team 001')
  expect(screen.getByText('team1@example.com')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Salary' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Add Employee|Edit|Fire/ })).not.toBeInTheDocument()
  expect(api.delete).not.toHaveBeenCalled()
})

it('retains the role boundary without requesting employees for staff', () => {
  signIn({ id: 9, role: 'specialist', business_id: 2 })
  renderWithProviders(<Employees />)
  expect(screen.getByText('You do not have permission to view this page')).toBeInTheDocument()
  expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/employees/')).toHaveLength(0)
})


it('rejects duplicated employee ids across pages instead of showing a plausible partial list', async () => {
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url !== '/employees/') return routes({ '/businesses/me': { currency: 'EUR' } })(url, config)
    const page = (config?.params as { page: number }).page
    return Promise.resolve({ data: page === 1 ? people.slice(0, 100) : [people[0]] })
  })
  renderWithProviders(<Employees />)
  await screen.findByRole('alert')
  expect(screen.queryByText('Team 001')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Export/ })).not.toBeInTheDocument()
})

it('cancels between array pages when the directory unmounts', async () => {
  let finish!: (value: { data: ReturnType<typeof row>[] }) => void
  vi.mocked(api.get).mockImplementation((url, config) => url === '/employees/'
    ? new Promise(resolve => { finish = resolve })
    : routes({ '/businesses/me': { currency: 'EUR' } })(url, config))
  const view = renderWithProviders(<Employees />)
  await waitFor(() => expect(finish).toBeDefined())
  const oldSignal = vi.mocked(api.get).mock.calls.find(([url]) => url === '/employees/')![1]?.signal
  view.unmount()
  await act(async () => { finish({ data: people.slice(0, 100) }); await Promise.resolve() })
  expect(oldSignal?.aborted).toBe(true)
  expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === '/employees/')).toHaveLength(1)
})

it('does not request another page of the old directory after another account signs in', async () => {
  let finish!: (value: { data: ReturnType<typeof row>[] }) => void
  let first = true
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url !== '/employees/') return routes({ '/businesses/me': { currency: 'EUR' } })(url, config)
    if (first) { first = false; return new Promise(resolve => { finish = resolve }) }
    return new Promise(() => {})
  })
  renderWithProviders(<Employees />)
  await waitFor(() => expect(finish).toBeDefined())
  const oldSignal = vi.mocked(api.get).mock.calls.find(([url]) => url === '/employees/')![1]?.signal
  act(() => { useAuthStore.getState().setAuth('other-token', { id: 9, full_name: 'Other Owner', role: 'business_owner', business_id: 9, employer_id: null }) })
  await act(async () => { finish({ data: people.slice(0, 100) }); await Promise.resolve() })
  expect(vi.mocked(api.get).mock.calls.filter(([url, config]) => url === '/employees/' && config?.signal === oldSignal)).toHaveLength(1)
  expect(screen.queryByText('Team 001')).not.toBeInTheDocument()
})

it('clamps the page after firing the final employee on the active last page', async () => {
  people = people.slice(0, 21)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.mocked(api.delete).mockImplementation(async () => { people = people.filter(person => person.id !== 21); return { data: {} } })
  renderWithProviders(<Employees />)
  await screen.findByText('Team 001')
  await userEvent.click(screen.getByRole('button', { name: '2' }))
  await screen.findByText('Team 021')
  await userEvent.click(screen.getByRole('button', { name: 'Fire' }))
  await screen.findByText('Team 001')
  expect(screen.queryByText('Team 021')).not.toBeInTheDocument()
  expect(api.delete).toHaveBeenCalledExactlyOnceWith('/employees/21')
})

it('exports every filtered employee rather than the displayed first page', async () => {
  renderWithProviders(<Employees />)
  await screen.findByText('Team 001')
  await userEvent.click(screen.getByRole('button', { name: 'Export' }))
  const dialog = screen.getByRole('dialog')
  await userEvent.click(within(dialog).getByRole('button', { name: /^CSV/ }))
  await userEvent.click(within(dialog).getByRole('button', { name: 'Export' }))
  await waitFor(() => expect(exportData).toHaveBeenCalledTimes(1))
  const payload = vi.mocked(exportData).mock.calls[0][0]
  expect(payload.data).toHaveLength(125)
  expect(payload.data[124]).toMatchObject({ id: 125, employee_user: { full_name: 'Team 125' }, position: 'Therapist 125', base_salary: 1200, commission_percentage: 10 })
})


it('preserves the searched page on form cancellation and unmounts editing when access becomes read-only', async () => {
  people = people.slice(0, 21)
  function ChangingAccess() {
    const [crm_mode, setMode] = useState<'full' | 'read_only'>('full')
    const access: WorkspaceAccess = { crm_mode, can_export: false, can_manage_billing: true, can_use_ai: false, checkout_available: false, pilot_mode: true }
    return <WorkspaceAccessContext.Provider value={access}><button onClick={() => setMode('read_only')}>Restrict workspace</button><Employees /></WorkspaceAccessContext.Provider>
  }
  renderWithProviders(<ChangingAccess />)
  await screen.findByText('Team 001')
  await userEvent.type(screen.getByRole('searchbox'), 'Team')
  await userEvent.click(screen.getByRole('button', { name: '2' }))
  await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
  await userEvent.click(screen.getByRole('button', { name: 'Cancel employee form' }))
  expect(screen.getByText('Team 021')).toBeInTheDocument()
  expect(screen.getByRole('searchbox')).toHaveValue('Team')
  await userEvent.click(screen.getByRole('button', { name: 'Edit' }))
  await userEvent.click(screen.getByRole('button', { name: 'Restrict workspace' }))
  expect(screen.queryByRole('button', { name: 'Cancel employee form' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Add Employee|Edit|Fire/ })).not.toBeInTheDocument()
  expect(screen.getByText('Team 021')).toBeInTheDocument()
})
