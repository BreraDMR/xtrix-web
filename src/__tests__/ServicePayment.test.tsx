import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import api from '../api/client'
import BookingPage from '../pages/booking/BookingPage'
import PaymentReturn, { SandboxCheckout } from '../pages/booking/PaymentReturn'
import ServicePayments from '../components/payments/ServicePayments'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const START = '2026-11-02T09:00:00Z'
const CHECKOUT_URL = 'http://localhost:3170/payment/sandbox#ref=pay-ref&token=pay-token'

const business = {
  name: 'Deposit Salon',
  business_type: 'salon',
  currency: 'EUR',
  timezone: 'Europe/Prague',
  description: null,
  address: null,
  phone: null,
  email: null,
  deposit_type: 'fixed',
  deposit_value: 12,
  deposit_hold_minutes: 30,
}

const payment = {
  public_ref: 'pay-ref',
  status: 'pending',
  amount: 12,
  remaining_amount: 28,
  refunded_amount: 0,
  currency: 'EUR',
  checkout_url: CHECKOUT_URL,
  hold_expires_at: '2026-11-02T09:30:00Z',
  paid_at: null,
}

const paymentStatus = {
  ...payment,
  visit_status: 'awaiting_payment',
  visit_start: START,
  visit_end: '2026-11-02T09:30:00Z',
  service_name: 'Deposit Cut',
  timezone: 'Europe/Prague',
}

const booking = {
  id: 77,
  start: START,
  end: '2026-11-02T09:30:00Z',
  service_name: 'Deposit Cut',
  staff_id: 3,
  staff_name: 'Mia Master',
  price: 40,
  currency: 'EUR',
  status: 'awaiting_payment',
  timezone: 'Europe/Prague',
  manage_token: 'manage-token',
  payment,
}

async function bookThroughSummary() {
  vi.mocked(api.get).mockImplementation(
    routes({
      '/public/booking/demo': business,
      '/public/booking/demo/services': [
        { id: 7, name: 'Deposit Cut', duration_minutes: 30, price: 40 },
      ],
      '/public/booking/demo/staff': [{ id: 3, full_name: 'Mia Master', position: 'Master' }],
      '/public/booking/demo/slots': {
        timezone: 'Europe/Prague',
        days: [{ date: '2026-11-02', slots: [{ start: START, staff_id: 3 }] }],
      },
    }) as never,
  )

  renderWithProviders(
    <MemoryRouter initialEntries={['/booking/demo?service=7']}>
      <Routes>
        <Route path="/booking/:slug" element={<BookingPage />} />
      </Routes>
    </MemoryRouter>,
    { router: false },
  )

  await userEvent.click(await screen.findByRole('button', { name: /Mia Master/ }))
  await userEvent.click(await screen.findByRole('button', { name: /\d{2}:\d{2}/ }))

  await userEvent.type(screen.getByLabelText(/Name/), 'Nora Guest')
  await userEvent.type(screen.getByLabelText('Email'), 'nora@example.com')
  await userEvent.click(
    screen.getByLabelText(/I agree that the salon may process my details to create and manage this booking/i),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(await screen.findByRole('heading', { name: 'Check your booking' })).toBeInTheDocument()
}

beforeEach(() => {
  resetStores()
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/')
})

describe('public booking deposit', () => {
  it('shows deposit terms, then holds the slot with a checkout link', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: booking })
    await bookThroughSummary()

    expect(screen.getByText('12.00 €')).toBeInTheDocument()
    expect(screen.getByText(/Remaining at the salon: 28.00 €/)).toBeInTheDocument()
    expect(screen.getByText('The slot is held for 30 minutes.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

    expect(await screen.findByRole('heading', { name: 'Slot held — pay the deposit' })).toBeInTheDocument()
    expect(screen.queryByText('You are booked')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pay deposit' })).toHaveAttribute('href', CHECKOUT_URL)
    expect(api.post).toHaveBeenCalledWith(
      '/public/booking/demo/bookings',
      expect.objectContaining({ service_id: 7, staff_id: 3, start: START }),
    )
  })

  it('does not confirm a booking when the payment provider is unavailable', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(502, 'Payments are temporarily unavailable. Try again later.'))
    await bookThroughSummary()

    await userEvent.click(screen.getByRole('button', { name: 'Confirm booking' }))

    expect(await screen.findByText('Payments are temporarily unavailable. Try again later.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Slot held — pay the deposit' })).not.toBeInTheDocument()
    expect(screen.queryByText('You are booked')).not.toBeInTheDocument()
  })
})

describe('payment return', () => {
  it('trusts only the server status and lets the guest check again', async () => {
    window.history.replaceState(null, '', '/payment/return#ref=pay-ref&token=pay-token')
    vi.mocked(api.get).mockResolvedValueOnce({ data: paymentStatus })

    renderWithProviders(<PaymentReturn />)

    expect(await screen.findByRole('heading', { name: 'Waiting for confirmation' })).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/public/booking/payments/pay-ref', {
      headers: { 'X-Payment-Token': 'pay-token' },
    })

    vi.mocked(api.get).mockResolvedValue({
      data: { ...paymentStatus, status: 'paid', visit_status: 'planned', checkout_url: null },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }))

    expect(await screen.findByRole('heading', { name: 'Payment received' })).toBeInTheDocument()
    expect(screen.getByText('Paid')).toBeInTheDocument()
  })

  it('reports a failed payment instead of a success URL', async () => {
    window.history.replaceState(null, '', '/payment/return#ref=pay-ref&token=pay-token')
    vi.mocked(api.get).mockResolvedValue({
      data: { ...paymentStatus, status: 'failed', visit_status: 'cancelled', checkout_url: null },
    })

    renderWithProviders(<PaymentReturn />)

    expect(await screen.findByRole('heading', { name: 'Payment was not completed' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Payment received' })).not.toBeInTheDocument()
  })

  it('rejects a link without a reference or token', () => {
    renderWithProviders(<PaymentReturn />)
    expect(screen.getByRole('heading', { name: 'Payment link is not valid' })).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('sandbox checkout', () => {
  it('sends a signed sandbox outcome and returns to the status page', async () => {
    window.history.replaceState(null, '', '/payment/sandbox#ref=pay-ref&token=pay-token')
    vi.mocked(api.get).mockResolvedValue({ data: paymentStatus })
    vi.mocked(api.post).mockResolvedValue({ data: { ...paymentStatus, status: 'paid' } })

    renderWithProviders(
      <MemoryRouter initialEntries={['/payment/sandbox#ref=pay-ref&token=pay-token']}>
        <Routes>
          <Route path="/payment/sandbox" element={<SandboxCheckout />} />
          <Route path="/payment/return" element={<h1>Return page</h1>} />
        </Routes>
      </MemoryRouter>,
      { router: false },
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Pay 12.00 €' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/public/booking/payments/pay-ref/sandbox',
        { outcome: 'paid' },
        { headers: { 'X-Payment-Token': 'pay-token' } },
      ),
    )
    expect(await screen.findByRole('heading', { name: 'Return page' })).toBeInTheDocument()
  })

  it('can simulate a failed payment without a success redirect', async () => {
    window.history.replaceState(null, '', '/payment/sandbox#ref=pay-ref&token=pay-token')
    vi.mocked(api.get).mockResolvedValue({ data: paymentStatus })
    vi.mocked(api.post).mockResolvedValue({ data: { ...paymentStatus, status: 'failed' } })

    renderWithProviders(
      <MemoryRouter initialEntries={['/payment/sandbox#ref=pay-ref&token=pay-token']}>
        <Routes>
          <Route path="/payment/sandbox" element={<SandboxCheckout />} />
          <Route path="/payment/return" element={<h1>Return page</h1>} />
        </Routes>
      </MemoryRouter>,
      { router: false },
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Simulate a failed payment' }))
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/public/booking/payments/pay-ref/sandbox',
        { outcome: 'failed' },
        { headers: { 'X-Payment-Token': 'pay-token' } },
      ),
    )
  })
})

describe('salon deposits', () => {
  const paidAttempt = {
    id: 9,
    visit_id: 77,
    status: 'paid',
    provider: 'sandbox',
    client_name: 'Nora Guest',
    service_name: 'Deposit Cut',
    visit_start: START,
    visit_status: 'planned',
    currency: 'EUR',
    amount: 12,
    remaining_amount: 28,
    refunded_amount: 0,
    refundable_amount: 12,
    hold_expires_at: '2026-11-02T09:30:00Z',
    paid_at: '2026-11-02T08:10:00Z',
    created_at: '2026-11-02T08:00:00Z',
    refunds: [],
  }

  it('shows deposits apart from subscription and records an idempotent refund', async () => {
    signIn({ id: 1, role: 'business_owner', business_id: 5 })
    let calls = 0
    vi.mocked(api.get).mockImplementation((async () => {
      calls += 1
      return {
        data: calls === 1
          ? [paidAttempt]
          : [{ ...paidAttempt, status: 'partially_refunded', refunded_amount: 5, refundable_amount: 7 }],
      }
    }) as never)
    vi.mocked(api.post).mockResolvedValue({
      data: { id: 3, amount: 5, currency: 'EUR', reason: 'Guest cancelled', status: 'succeeded', created_at: START },
    })

    renderWithProviders(<ServicePayments />)

    expect(await screen.findByText('Nora Guest')).toBeInTheDocument()
    expect(screen.getByText('Guest deposits')).toBeInTheDocument()
    expect(screen.getByText('Refundable')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Refund' }))
    const dialog = screen.getByRole('dialog', { name: 'Refund deposit' })
    await userEvent.type(within(dialog).getByLabelText('Amount'), '5')
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Guest cancelled')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refund' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/businesses/me/service-payments/9/refunds',
        expect.objectContaining({ refund_key: expect.stringMatching(/^rf-/), amount: 5, reason: 'Guest cancelled' }),
      ),
    )
    expect(await screen.findByText('Refund recorded.')).toBeInTheDocument()
  })

  it('stays hidden for a user without financial rights', async () => {
    signIn({ id: 2, role: 'employee', business_id: 5 })
    vi.mocked(api.get).mockRejectedValue(apiError(403, 'Not allowed'))

    const { container } = renderWithProviders(<ServicePayments />)

    await waitFor(() => expect(api.get).toHaveBeenCalled())
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
