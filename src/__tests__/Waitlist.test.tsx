import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import api from '../api/client'
import BookingPage from '../pages/booking/BookingPage'
import Waitlist from '../pages/Waitlist'
import WaitlistOffer from '../pages/booking/WaitlistOffer'
import { apiError, renderWithProviders, resetStores, routes } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

const today = new Date().toISOString().slice(0, 10)

const business = {
  name: 'Wait Salon',
  business_type: 'salon',
  currency: 'EUR',
  timezone: 'Europe/Prague',
  description: null,
  address: null,
  phone: null,
  email: null,
}

beforeEach(() => {
  resetStores()
  vi.clearAllMocks()
  window.sessionStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('waitlist join from public booking', () => {
  it('offers the waitlist when no times are free and states it is not a booking', async () => {
    vi.mocked(api.get).mockImplementation(
      routes({
        '/public/booking/demo': business,
        '/public/booking/demo/services': [
          { id: 7, name: 'Wait Cut', duration_minutes: 30, price: 20 },
        ],
        '/public/booking/demo/staff': [{ id: 3, full_name: 'Mia Master', position: 'Master' }],
        '/public/booking/demo/slots': {
          timezone: 'Europe/Prague',
          days: [{ date: today, slots: [] }],
        },
      }) as never,
    )
    vi.mocked(api.post).mockResolvedValue({
      data: { message: 'Thanks', created: true, manage_token: 'leave-token' },
    })

    renderWithProviders(
      <MemoryRouter initialEntries={['/booking/demo?service=7']}>
        <Routes>
          <Route path="/booking/:slug" element={<BookingPage />} />
        </Routes>
      </MemoryRouter>,
      { router: false },
    )

    await userEvent.click(await screen.findByRole('button', { name: /Mia Master/ }))
    expect(await screen.findByText('No free times in the next two weeks.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Join the waitlist' }))
    expect(screen.getByRole('heading', { name: 'Waitlist request' })).toBeInTheDocument()
    expect(screen.getAllByText('This is not a booking and does not hold a time.').length).toBeGreaterThan(0)

    await userEvent.type(screen.getByLabelText('Full Name'), 'Nora Guest')
    await userEvent.type(screen.getByLabelText('Email'), 'nora@example.com')
    await userEvent.click(
      screen.getByLabelText(/I agree that the salon may process my details to contact me/i),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/public/waitlist/demo/join',
        expect.objectContaining({
          service_id: 7,
          staff_id: 3,
          full_name: 'Nora Guest',
          email: 'nora@example.com',
          processing_consent: true,
          time_preference: 'any',
        }),
      ),
    )
    expect(await screen.findByText('Request saved')).toBeInTheDocument()
    expect(screen.getByText('This is not a booking and does not hold a time.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Leave the waitlist' }))
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/public/waitlist/leave', null, {
        headers: { 'X-Waitlist-Token': 'leave-token' },
      }),
    )
    expect(await screen.findByText('You left the waitlist')).toBeInTheDocument()
  })
})

describe('salon waitlist page', () => {
  it('lists entries with offer state and closes a request', async () => {
    let closed = false
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/services/') return Promise.resolve({ data: [{ id: 7, name: 'Wait Cut' }] })
      if (url === '/waitlist') {
        return Promise.resolve({
          data: {
            items: closed
              ? []
              : [
                  {
                    id: 5,
                    full_name: 'Nora Guest',
                    email: 'nora@example.com',
                    phone: null,
                    language: 'en',
                    service_id: 7,
                    service_name: 'Wait Cut',
                    specialist_id: 3,
                    specialist_name: 'Mia Master',
                    preferred_date_from: today,
                    preferred_date_to: today,
                    time_preference: 'morning',
                    status: 'active',
                    created_at: '2026-10-01T10:00:00Z',
                    latest_offer: {
                      id: 9,
                      start: '2026-10-25T08:00:00Z',
                      end: '2026-10-25T08:30:00Z',
                      staff_id: 3,
                      staff_name: 'Mia Master',
                      status: 'pending',
                      expires_at: '2026-10-25T10:00:00Z',
                    },
                  },
                ],
            page: 1,
            pages: 1,
            per_page: 20,
            total: closed ? 0 : 1,
          },
        })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    })
    vi.mocked(api.post).mockImplementation(() => {
      closed = true
      return Promise.resolve({ data: {} }) as never
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<Waitlist />)
    expect(await screen.findByText('Nora Guest')).toBeInTheDocument()
    expect(screen.getByText('Offer waiting')).toBeInTheDocument()
    expect(screen.getByText(/Morning/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Close request' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/waitlist/5/cancel'))
    expect(await screen.findByText('No waitlist requests match these filters.')).toBeInTheDocument()
  })
})

describe('waitlist offer page', () => {
  it('accepts an offer from the email link and shows the booking', async () => {
    window.history.replaceState(null, '', '/waitlist/offer#token=offer-token')
    vi.mocked(api.get).mockImplementation(
      routes({
        '/public/waitlist/offer': {
          business_name: 'Wait Salon',
          business_phone: null,
          business_address: null,
          service_name: 'Wait Cut',
          staff_name: 'Mia Master',
          start: '2026-10-25T08:00:00Z',
          end: '2026-10-25T08:30:00Z',
          timezone: 'Europe/Prague',
          status: 'pending',
          expires_at: '2026-10-25T10:00:00Z',
          price: 20,
          currency: 'EUR',
        },
      }) as never,
    )
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 41,
        start: '2026-10-25T08:00:00Z',
        end: '2026-10-25T08:30:00Z',
        service_name: 'Wait Cut',
        staff_id: 3,
        staff_name: 'Mia Master',
        price: 20,
        currency: 'EUR',
        status: 'planned',
        timezone: 'Europe/Prague',
        manage_token: 'manage-token',
      },
    })

    renderWithProviders(<WaitlistOffer />)
    expect(await screen.findByRole('heading', { name: 'Wait Salon' })).toBeInTheDocument()
    expect(screen.getByText(/This time is not reserved for you/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Book this time' }))
    expect(await screen.findByText('You are booked')).toBeInTheDocument()
    expect(screen.getByText('Booking number: #41')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Manage this booking' })).toHaveAttribute(
      'href',
      '/manage#token=manage-token',
    )
  })
})
