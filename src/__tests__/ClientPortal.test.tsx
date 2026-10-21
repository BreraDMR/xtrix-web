import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

import api from '../api/client'
import LegacyHistory from '../pages/client/LegacyHistory'
import Portal from '../pages/client/Portal'
import PortalLogin from '../pages/client/PortalLogin'
import BookingPage from '../pages/booking/BookingPage'
import { apiError, renderWithProviders, resetStores, routes } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const TOKEN = 'portal-session-token'

const session = {
  expires_at: '2026-11-20T10:00:00Z',
  client_name: 'Nora Guest',
  business_name: 'Portal Salon',
  business_slug: 'portal-salon',
  language: 'en',
}

const visits = {
  upcoming: [
    {
      id: 11,
      date_start: '2026-11-01T10:00:00Z',
      date_end: '2026-11-01T10:30:00Z',
      service_id: 7,
      service_name: 'Portal Cut',
      staff_name: 'Mia Master',
      status: 'planned',
      price: 40,
      can_manage: true,
    },
  ],
  past: [
    {
      id: 12,
      date_start: '2026-10-01T09:00:00Z',
      date_end: '2026-10-01T09:30:00Z',
      service_id: 7,
      service_name: 'Portal Cut',
      staff_name: 'Mia Master',
      status: 'completed',
      price: 35,
      can_manage: false,
    },
  ],
  booking_slug: 'portal-salon',
  booking_enabled: true,
  currency: 'EUR',
  timezone: 'Europe/Prague',
}

const loyalty = { points: 42, cashback: 4.2, level_name: 'Gold', level_benefits: 'Priority booking' }

const questionnaires = {
  items: [
    {
      id: 5,
      visit_id: 12,
      name: 'Intake',
      version: 2,
      submitted_at: '2026-10-01T10:00:00Z',
      fields: [{ key: 'mood', label: 'Mood', type: 'text' }],
      answers: { mood: 'good' },
    },
  ],
}

function LocationProbe() {
  const location = useLocation()
  return <p>{`${location.pathname}${location.hash}`}</p>
}

function mockPortalData() {
  vi.mocked(api.get).mockImplementation(
    routes({
      '/public/client-portal/session': session,
      '/public/client-portal/visits': visits,
      '/public/client-portal/loyalty': loyalty,
      '/public/client-portal/questionnaires': questionnaires,
    }),
  )
}

function renderPortal() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/client']}>
      <Routes>
        <Route path="/client" element={<Portal />} />
        <Route path="/client/portal" element={<p>login page probe</p>} />
        <Route path="/manage" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
    { router: false },
  )
}

describe('client portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    sessionStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('exchanges a magic link for a tab-scoped session', async () => {
    window.history.replaceState({}, '', '/client/portal#token=magic-link-token')
    vi.mocked(api.post).mockResolvedValue({
      data: { session_token: TOKEN, ...session },
    })

    renderWithProviders(
      <MemoryRouter initialEntries={['/client/portal']}>
        <Routes>
          <Route path="/client/portal" element={<PortalLogin />} />
          <Route path="/client" element={<p>portal page probe</p>} />
        </Routes>
      </MemoryRouter>,
      { router: false },
    )

    expect(await screen.findByText('portal page probe')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/public/client-portal/verify', {
      token: 'magic-link-token',
    })
    expect(sessionStorage.getItem('client_portal_token')).toBe(TOKEN)
    expect(window.location.hash).toBe('')
  })

  it('reports an expired link and asks for a new one without revealing the account', async () => {
    window.history.replaceState({}, '', '/client/portal#token=used-link')
    vi.mocked(api.post).mockRejectedValue(apiError(400, 'link is not valid'))
    renderWithProviders(
      <MemoryRouter initialEntries={['/client/portal']}>
        <Routes>
          <Route path="/client/portal" element={<PortalLogin />} />
        </Routes>
      </MemoryRouter>,
      { router: false },
    )

    expect(await screen.findByText(/invalid, has expired, or has already been used/i)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledTimes(1)

    vi.mocked(api.post).mockResolvedValue({ data: { message: 'sent' } })
    await userEvent.type(screen.getByLabelText('Salon code'), 'portal-salon')
    await userEvent.type(screen.getByLabelText('Email'), 'nora@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }))

    expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(api.post).toHaveBeenLastCalledWith('/public/client-portal/portal-salon/request', {
      email: 'nora@example.com',
    })
  })

  it('shows only the signed-in client data and clears it on sign out', async () => {
    sessionStorage.setItem('client_portal_token', TOKEN)
    mockPortalData()
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'signed out' } })
    const { queryClient } = renderPortal()

    expect(await screen.findByRole('heading', { name: 'Nora Guest' })).toBeInTheDocument()
    expect(screen.getByText('Portal Salon')).toBeInTheDocument()
    expect(screen.getAllByText('Portal Cut')).toHaveLength(2)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Gold')).toBeInTheDocument()
    expect(screen.getByText('Intake')).toBeInTheDocument()
    expect(screen.getByText('good')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Book again' })[0]).toHaveAttribute(
      'href',
      '/booking/portal-salon?service=7',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('login page probe')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/public/client-portal/logout', undefined, {
      headers: { 'X-Portal-Token': TOKEN },
    })
    expect(sessionStorage.getItem('client_portal_token')).toBeNull()
    expect(queryClient.getQueryData(['client-portal', 'visits', TOKEN])).toBeUndefined()
  })

  it('opens manage booking through a fresh MANAGE token instead of repeating the rules', async () => {
    sessionStorage.setItem('client_portal_token', TOKEN)
    mockPortalData()
    vi.mocked(api.post).mockResolvedValue({
      data: { token: 'manage-token-1', expires_at: '2026-11-01T09:00:00Z' },
    })
    renderPortal()

    await userEvent.click(await screen.findByRole('button', { name: 'Manage booking' }))

    expect(await screen.findByText('/manage#token=manage-token-1')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith(
      '/public/client-portal/visits/11/manage-link',
      undefined,
      { headers: { 'X-Portal-Token': TOKEN } },
    )
  })

  it('keeps legacy QR history hidden until the PIN is accepted', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(403, 'Invalid password'))
    renderWithProviders(
      <MemoryRouter initialEntries={['/client/history?qr=legacy-qr-data']}>
        <Routes>
          <Route path="/client/history" element={<LegacyHistory />} />
        </Routes>
      </MemoryRouter>,
      { router: false },
    )

    await userEvent.type(screen.getByLabelText('PIN'), '9999')
    await userEvent.click(screen.getByRole('button', { name: 'Show history' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/QR code or PIN is invalid/i)
    expect(screen.queryByText('Legacy Client')).not.toBeInTheDocument()
    expect(api.post).toHaveBeenLastCalledWith('/clients/qr-code/access', {
      qr_code_data: 'legacy-qr-data',
      password: '9999',
    })

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        client_id: 3,
        client_name: 'Legacy Client',
        visits: [
          {
            id: 21,
            date_start: '2026-09-01T12:00:00Z',
            service_name: 'Legacy Cut',
            status: 'completed',
          },
        ],
        total_visits: 1,
        total_spending: 25,
        last_visit_date: '2026-09-01T12:00:00Z',
      },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Show history' }))

    expect(await screen.findByText('Legacy Client')).toBeInTheDocument()
    expect(screen.getByText('Legacy Cut')).toBeInTheDocument()
    expect(screen.queryByText(/spending/i)).not.toBeInTheDocument()
  })

  it('preselects the service when a client books again from the portal', async () => {
    vi.mocked(api.get).mockImplementation(
      routes({
        '/public/booking/demo': {
          name: 'Demo Salon',
          business_type: 'salon',
          currency: 'EUR',
          timezone: 'Europe/Prague',
          description: null,
          address: null,
          phone: null,
          email: null,
        },
        '/public/booking/demo/services': [
          { id: 7, name: 'Repeat Cut', duration_minutes: 30, price: 20 },
          { id: 8, name: 'Other Cut', duration_minutes: 45, price: 30 },
        ],
        '/public/booking/demo/staff': [{ id: 1, full_name: 'Mia Master', position: 'Master' }],
      }),
    )
    renderWithProviders(
      <MemoryRouter initialEntries={['/booking/demo?service=7']}>
        <Routes>
          <Route path="/booking/:slug" element={<BookingPage />} />
        </Routes>
      </MemoryRouter>,
      { router: false },
    )

    expect(await screen.findByRole('heading', { name: 'Choose a master' })).toBeInTheDocument()
    expect(screen.getByText('Repeat Cut')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/public/booking/demo/staff', {
      params: { service_id: 7 },
    })
  })
})
