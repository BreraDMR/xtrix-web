import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import api from '../api/client'
import BookingPage from '../pages/booking/BookingPage'
import { renderWithProviders, resetStores, routes } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const START = '2026-11-02T09:00:00Z'

const business = {
  name: 'Group Salon', business_type: 'salon', currency: 'EUR', timezone: 'Europe/Prague',
  description: null, address: null, phone: null, email: null,
  deposit_type: 'none', deposit_value: 0, deposit_hold_minutes: 30,
}

const services = [
  { id: 1, name: 'Ladies cut', category: 'Hair', duration_minutes: 45, price: 30 },
  { id: 2, name: 'Gel polish', category: 'Nails', duration_minutes: 60, price: 25 },
  { id: 3, name: 'Consultation', category: null, duration_minutes: 15, price: 0 },
  { id: 4, name: 'Kids cut', category: 'Hair', duration_minutes: 30, price: 15 },
]

function renderPage(entry = '/booking/demo', table: Record<string, unknown> = {}) {
  vi.mocked(api.get).mockImplementation(
    routes({
      '/public/booking/demo': business,
      '/public/booking/demo/services': services,
      '/public/booking/demo/staff': [
        { id: 3, full_name: 'Mia Master', position: null },
        { id: 5, full_name: 'Ola Master', position: null },
      ],
      '/public/booking/demo/slots': {
        timezone: 'Europe/Prague',
        days: [{ date: '2026-11-02', slots: [{ start: START, staff_id: 5 }] }],
      },
      ...table,
    }) as never,
  )
  renderWithProviders(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/booking/:slug" element={<BookingPage />} />
      </Routes>
    </MemoryRouter>,
    { router: false },
  )
}

beforeEach(() => {
  resetStores()
  vi.clearAllMocks()
})

describe('booking services by category', () => {
  it('shows closed category blocks in salon order with Other last', async () => {
    renderPage()
    const hair = await screen.findByRole('button', { name: /Hair/ })
    const blocks = screen.getAllByRole('button', { expanded: false }).filter((block) => block.getAttribute('aria-controls')?.startsWith('booking-category-'))
    expect(blocks.map((block) => block.textContent)).toEqual(['Hair2', 'Nails1', 'Other1'])
    expect(screen.queryByRole('button', { name: /Ladies cut/ })).not.toBeInTheDocument()
    await userEvent.click(hair)
    expect(hair).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /Ladies cut/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Kids cut/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gel polish/ })).not.toBeInTheDocument()
  })

  it('keeps picks from several categories, also after closing a block', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Hair/ }))
    await userEvent.click(screen.getByRole('button', { name: /Ladies cut/ }))
    await userEvent.click(screen.getByRole('button', { name: /Hair/ }))
    await userEvent.click(screen.getByRole('button', { name: /Nails/ }))
    await userEvent.click(screen.getByRole('button', { name: /Gel polish/ }))
    expect(screen.getByRole('button', { name: /Hair/ })).toHaveTextContent('1 selected')
    const list = screen.getByText('Selected services').closest('div')!.parentElement!
    expect(within(list).getByText('Ladies cut')).toBeInTheDocument()
    expect(within(list).getByText('Gel polish')).toBeInTheDocument()
  })

  it('keeps the plain list when the salon uses no categories', async () => {
    renderPage('/booking/demo', {
      '/public/booking/demo/services': services.map((service) => ({ ...service, category: null })),
    })
    expect(await screen.findByRole('button', { name: /Ladies cut/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Other/ })).not.toBeInTheDocument()
  })
})

describe('any master', () => {
  it('lets the server pick the master for one service', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {
      id: 9, start: START, end: '2026-11-02T09:45:00Z', service_name: 'Ladies cut', staff_id: 5,
      staff_name: 'Ola Master', price: 30, currency: 'EUR', status: 'planned', timezone: 'Europe/Prague',
      items: [], payment: null, manage_token: null,
    } })
    renderPage('/booking/demo?service=1')
    await userEvent.click(await screen.findByRole('button', { name: 'Any available master' }))
    await userEvent.click(await screen.findByRole('button', { name: /\d{2}:\d{2}/ }))
    await userEvent.type(screen.getByLabelText(/Name/), 'Nora Guest')
    await userEvent.type(screen.getByLabelText('Email'), 'nora@example.com')
    await userEvent.click(
      screen.getByLabelText(/I agree that the salon may process my details to create and manage this booking/i),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    // no name promised before the booking lands
    expect(await screen.findByText('Any available master')).toBeInTheDocument()
    expect(screen.queryByText('Ola Master')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))
    const body = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
    expect(body).not.toHaveProperty('staff_id')
    expect(body.service_id).toBe(1)
    expect(await screen.findByText('Ola Master')).toBeInTheDocument()
  })

  it('still sends the chosen master by name', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {
      id: 9, start: START, end: '2026-11-02T09:45:00Z', service_name: 'Ladies cut', staff_id: 5,
      staff_name: 'Ola Master', price: 30, currency: 'EUR', status: 'planned', timezone: 'Europe/Prague',
      items: [], payment: null, manage_token: null,
    } })
    renderPage('/booking/demo?service=1')
    await userEvent.click(await screen.findByRole('button', { name: /Ola Master/ }))
    await userEvent.click(await screen.findByRole('button', { name: /\d{2}:\d{2}/ }))
    await userEvent.type(screen.getByLabelText(/Name/), 'Nora Guest')
    await userEvent.type(screen.getByLabelText('Email'), 'nora@example.com')
    await userEvent.click(
      screen.getByLabelText(/I agree that the salon may process my details to create and manage this booking/i),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm booking' }))
    const body = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
    expect(body.staff_id).toBe(5)
  })
})
