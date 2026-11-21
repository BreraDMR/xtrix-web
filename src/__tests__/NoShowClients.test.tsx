import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import api from '../api/client'
import Clients from '../pages/Clients'
import ClientWorkspace from '../components/clients/ClientWorkspace'
import NoShowRules from '../components/schedules/NoShowRules'
import AttendanceStats from '../components/AttendanceStats'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { useLocaleStore } from '../store/localeStore'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'
import type { BusinessOut, ClientOverviewOut } from '../api/types'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

const access: WorkspaceAccess = { crm_mode: 'full', can_export: true, can_use_ai: true,
  can_manage_billing: true, checkout_available: false, pilot_mode: false }
beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 1, role: 'business_owner', business_id: 1 })
  vi.mocked(api.put).mockResolvedValue({ data: {} })
})

const clientRows = [
  { id: 1, full_name: 'Often Missing', contact_phone: null, contact_email: null, gender: null, created_at: '2026-01-01T00:00:00Z',
    attendance: { no_show_count: 3, late_cancel_count: 1, online_booking_blocked: true, rule_reached: true, warning: null } },
  { id: 2, full_name: 'Always There', contact_phone: null, contact_email: null, gender: null, created_at: '2026-01-01T00:00:00Z',
    attendance: { no_show_count: 0, late_cancel_count: 0, online_booking_blocked: false, rule_reached: false, warning: null } },
]
const overview: ClientOverviewOut = {
  client_id: 1,
  stats: { total_visits: 5, completed_visits: 1, cancelled_visits: 1, no_show_visits: 3, late_cancel_visits: 1,
    last_visit_at: null, next_visit_at: null },
  next_visit: null, upcoming_visits: [], recent_visits: [], payments: null,
  attendance: { no_show_count: 3, late_cancel_count: 1, online_booking_blocked: true, rule_reached: true,
    warning: 'This client has missed visits without notice.' },
}

function renderClients(url = '/app/clients') {
  vi.mocked(api.get).mockImplementation(routes({
    '/clients/': clientRows,
    '/clients/1': clientRows[0],
    '/clients/1/overview': overview,
    '/clients/1/notes': [],
    '/clients/1/profile': { client_id: 1, tags: ['no-show'], preferences: null, online_booking_blocked: true },
  }))
  return renderWithProviders(<MemoryRouter initialEntries={[url]}>
    <WorkspaceAccessContext.Provider value={access}>
      <Routes>
        <Route path="/app/clients" element={<Clients />} />
        <Route path="/app/clients/:clientId" element={<ClientWorkspace />} />
      </Routes>
    </WorkspaceAccessContext.Provider>
  </MemoryRouter>, { router: false })
}

describe('no-shows on clients', () => {
  it('filters the list by attendance and badges repeat no-shows', async () => {
    renderClients()
    await screen.findByText('Often Missing')
    expect(screen.getByText('No-shows: 3')).toBeInTheDocument()
    expect(screen.queryByText('No-shows: 0')).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Attendance' }), 'no_show')
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/clients/', expect.objectContaining({
      params: expect.objectContaining({ attendance: 'no_show' }),
    })))
  })

  it('shows counters on the card and lets staff open online booking again', async () => {
    renderClients('/app/clients/1')
    const section = await screen.findByRole('region', { name: 'Attendance' })
    expect(within(section).getByText('3')).toBeInTheDocument()
    expect(within(section).getByText('Online booking is blocked for this client')).toBeInTheDocument()
    expect(within(section).getByText("The salon's no-show limit is reached")).toBeInTheDocument()
    await userEvent.click(within(section).getByRole('button', { name: 'Allow online booking' }))
    expect(api.put).toHaveBeenCalledWith('/clients/1/profile', { online_booking_blocked: false })
  })

  it('speaks Czech and Russian too', async () => {
    useLocaleStore.setState({ locale: 'cz' })
    renderClients('/app/clients/1')
    expect(await screen.findByRole('button', { name: 'Povolit online rezervaci' })).toBeInTheDocument()
  })
})

const business = { id: 9, name: 'Salon', business_type: 'salon', currency: 'EUR', timezone: 'UTC',
  booking_horizon_days: 30, booking_lead_time_minutes: 0, late_cancel_window_hours: 24, noshow_rule_enabled: false,
  noshow_rule_threshold: 3, noshow_rule_period_months: 6, noshow_rule_tag: 'no-show', noshow_rule_block_online: false,
  created_at: '2026-01-01T00:00:00Z' } as BusinessOut

describe('no-show rule settings', () => {
  it('is off by default and saves the whole rule once turned on', async () => {
    renderWithProviders(<NoShowRules business={business} canEdit />)
    expect(screen.queryByLabelText('Tag for the client')).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Repeated no-shows'), 'on')
    const threshold = screen.getByLabelText('No-shows')
    await userEvent.clear(threshold)
    await userEvent.type(threshold, '2')
    await userEvent.selectOptions(screen.getByLabelText('Online booking'), 'yes')
    expect(screen.getByText(/After 2 no-shows within 6 months/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(api.put).toHaveBeenCalledWith('/businesses/9', {
      late_cancel_window_hours: 24, noshow_rule_enabled: true, noshow_rule_threshold: 2,
      noshow_rule_period_months: 6, noshow_rule_tag: 'no-show', noshow_rule_block_online: true,
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Saved')
  })

  it('refuses numbers out of range without calling the API', async () => {
    renderWithProviders(<NoShowRules business={business} canEdit />)
    const hours = screen.getByLabelText(/Late cancellation, hours before/)
    await userEvent.clear(hours)
    await userEvent.type(hours, '500')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('hours 0-336')
    expect(api.put).not.toHaveBeenCalled()
  })

  it('is read-only for staff', () => {
    renderWithProviders(<NoShowRules business={business} canEdit={false} />)
    expect(screen.getByLabelText('Repeated no-shows')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
  })
})

describe('no-show analytics block', () => {
  it('shows the count, the rate and the specialists', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { total_visits: 10, visits_by_status: {}, monthly_visits: [],
      attendance: { no_show: 2, late_cancel: 1, due_visits: 8, no_show_rate: 0.25,
        by_specialist: [{ specialist_id: 7, specialist_name: 'Eva', no_show: 2, late_cancel: 1, due_visits: 8, no_show_rate: 0.25 }] } } })
    renderWithProviders(<AttendanceStats dateFrom="2026-01-01" dateTo="2026-01-31" />)
    const block = await screen.findByRole('region', { name: 'No-shows' })
    expect(await within(block).findAllByText('25.0 %')).toHaveLength(2)
    expect(within(block).getByText('Eva')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/analytics/visits/statistics', expect.objectContaining({
      params: expect.objectContaining({ date_from: expect.any(String), date_to: expect.any(String) }),
    }))
  })
})
