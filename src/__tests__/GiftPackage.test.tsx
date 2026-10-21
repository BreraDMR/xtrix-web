import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import api from '../api/client'
import GiftOffers from '../components/loyalty/GiftOffers'
import VisitForm from '../components/VisitForm'
import { GiftCheckout, GiftPurchase, GiftReturn } from '../pages/booking/GiftPurchase'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const OFFER = {
  id: 1,
  business_id: 1,
  name: 'Spa day',
  description: 'A calm afternoon',
  kind: 'money',
  price: 60,
  currency: 'EUR',
  face_value: 60,
  visits_count: null,
  validity_days: 365,
  service_ids: [],
  is_active: true,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
}

const SHOP = {
  slug: 'demo-salon',
  business_name: 'Demo Salon',
  currency: 'EUR',
  payments_available: true,
  offers: [OFFER],
}

const CERTIFICATE = {
  id: 5,
  status: 'active',
  kind: 'money',
  code: 'GIFT-ABCD-1234',
  code_last4: '1234',
  issuer_name: 'Demo Salon',
  offer_name: 'Spa day',
  currency: 'EUR',
  face_value: 60,
  visits_total: 0,
  money_balance: 60,
  visits_remaining: 0,
  service_ids: [],
  recipient_name: 'Nora Guest',
  recipient_email: null,
  buyer_name: 'Nora Guest',
  message: null,
  issued_at: '2026-10-21T10:00:00Z',
  expires_at: '2027-10-21T10:00:00Z',
}

const PENDING_ORDER = {
  public_ref: 'gift-ref',
  status: 'pending',
  amount: 60,
  currency: 'EUR',
  offer_name: 'Spa day',
  kind: 'money',
  buyer_name: 'Nora Guest',
  recipient_name: 'Nora Guest',
  checkout_url: 'http://localhost:3170/gift/checkout#ref=gift-ref&token=gift-token',
  hold_expires_at: '2026-10-21T10:30:00Z',
  paid_at: null,
  certificate: null,
}

const PAID_ORDER = {
  ...PENDING_ORDER,
  status: 'paid',
  checkout_url: null,
  paid_at: '2026-10-21T10:05:00Z',
  certificate: CERTIFICATE,
}

function renderGiftRoutes() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/gift/demo-salon']}>
      <Routes>
        <Route path="/gift/:slug" element={<GiftPurchase />} />
        <Route path="/gift/checkout" element={<GiftCheckout />} />
        <Route path="/gift/return" element={<GiftReturn />} />
      </Routes>
    </MemoryRouter>,
    { router: false },
  )
}

beforeEach(() => {
  resetStores()
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('public gift purchase', () => {
  it('buys a certificate through the sandbox checkout and shows the issued code', async () => {
    let paid = false
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/public/gifts/demo-salon') return Promise.resolve({ data: SHOP })
      if (url === '/public/gifts/orders/gift-ref') {
        return Promise.resolve({ data: paid ? PAID_ORDER : PENDING_ORDER })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)
    vi.mocked(api.post).mockImplementation(((url: string) => {
      if (url === '/public/gifts/demo-salon/orders') {
        return Promise.resolve({ data: PENDING_ORDER })
      }
      if (url === '/public/gifts/orders/gift-ref/sandbox') {
        paid = true
        return Promise.resolve({ data: PAID_ORDER })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)

    renderGiftRoutes()

    await userEvent.click(await screen.findByRole('button', { name: 'Buy' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(screen.getByLabelText('Your name'), 'Nora Guest')
    await userEvent.type(screen.getByLabelText('Your email'), 'nora@example.com')
    await userEvent.click(screen.getByLabelText(/I agree to the processing of my personal data/i))
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))

    expect(await screen.findByRole('heading', { name: 'Gift payment' })).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith(
      '/public/gifts/demo-salon/orders',
      expect.objectContaining({
        offer_id: 1,
        buyer_name: 'Nora Guest',
        processing_consent: true,
        client_request_id: expect.stringMatching(/^gift-[A-Za-z0-9_-]+/),
      }),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Confirm payment' }))

    expect(await screen.findByRole('heading', { name: 'Certificate issued' })).toBeInTheDocument()
    expect(await screen.findByText('GIFT-ABCD-1234')).toBeInTheDocument()
    expect(screen.getByText(/Balance/)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith(
      '/public/gifts/orders/gift-ref/sandbox',
      { outcome: 'paid' },
      { headers: { 'X-Gift-Token': 'gift-token' } },
    )
    expect(dialog).not.toBeInTheDocument()
  })

  it('shows a declined payment without issuing a certificate', async () => {
    let failed = false
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/public/gifts/demo-salon') return Promise.resolve({ data: SHOP })
      if (url === '/public/gifts/orders/gift-ref') {
        return Promise.resolve({
          data: failed ? { ...PENDING_ORDER, status: 'failed', checkout_url: null } : PENDING_ORDER,
        })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)
    vi.mocked(api.post).mockImplementation(((url: string) => {
      if (url === '/public/gifts/demo-salon/orders') {
        return Promise.resolve({ data: PENDING_ORDER })
      }
      if (url === '/public/gifts/orders/gift-ref/sandbox') {
        failed = true
        return Promise.resolve({ data: { ...PENDING_ORDER, status: 'failed', checkout_url: null } })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)

    renderGiftRoutes()

    await userEvent.click(await screen.findByRole('button', { name: 'Buy' }))
    await userEvent.type(screen.getByLabelText('Your name'), 'Nora Guest')
    await userEvent.type(screen.getByLabelText('Your email'), 'nora@example.com')
    await userEvent.click(screen.getByLabelText(/I agree to the processing of my personal data/i))
    await userEvent.click(screen.getByRole('button', { name: 'Continue to payment' }))
    await screen.findByRole('heading', { name: 'Gift payment' })

    await userEvent.click(screen.getByRole('button', { name: 'Decline payment' }))

    expect(await screen.findByRole('heading', { name: 'Payment failed' })).toBeInTheDocument()
    expect(screen.queryByText('GIFT-ABCD-1234')).not.toBeInTheDocument()
  })

  it('does not offer certificates when the shop is missing', async () => {
    vi.mocked(api.get).mockRejectedValue(apiError(404, 'Gift shop unavailable'))
    renderGiftRoutes()

    expect(await screen.findByText('This link is not valid. Ask the salon for a new one.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Buy' })).not.toBeInTheDocument()
  })
})

describe('gift offers in loyalty', () => {
  it('creates an offer and reverses a redemption from the ledger', async () => {
    signIn({ id: 7, role: 'business_owner' })
    const detail = {
      ...CERTIFICATE,
      order_id: 11,
      ledger: [
        {
          id: 1,
          entry_type: 'issued',
          amount_delta: 60,
          units_delta: 0,
          request_key: 'issue:11',
          visit_id: null,
          redeems_entry_id: null,
          reason: null,
          created_at: '2026-10-21T10:00:00Z',
        },
        {
          id: 2,
          entry_type: 'redeemed',
          amount_delta: -20,
          units_delta: 0,
          request_key: 'redeem-1',
          visit_id: 9,
          redeems_entry_id: null,
          reason: null,
          created_at: '2026-10-22T10:00:00Z',
        },
      ],
    }
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/businesses/me/gift-offers') return Promise.resolve({ data: [OFFER] })
      if (url === '/services/') {
        return Promise.resolve({ data: [{ id: 7, name: 'Massage', duration_minutes: 60, price: 40 }] })
      }
      if (url === '/businesses/me/public-booking') {
        return Promise.resolve({
          data: {
            slug: 'demo-salon',
            is_enabled: true,
            has_schedule: true,
            has_bookable_service: true,
            payments_available: true,
            deposit_type: 'none',
            deposit_value: 0,
            deposit_hold_minutes: 30,
          },
        })
      }
      if (url === '/businesses/me/gift-certificates?limit=100') return Promise.resolve({ data: [CERTIFICATE] })
      if (url === '/businesses/me/gift-certificates/5') return Promise.resolve({ data: detail })
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)
    vi.mocked(api.post).mockImplementation(((url: string) => {
      if (url === '/businesses/me/gift-offers') return Promise.resolve({ data: { ...OFFER, id: 2, name: 'Birthday' } })
      if (url === '/businesses/me/gift-certificates/5/reversals') {
        return Promise.resolve({ data: { certificate: CERTIFICATE, entry_id: 3, restored_amount: 20, restored_visits: 0 } })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)

    renderWithProviders(<GiftOffers canReverse />)

    const link = await screen.findByRole('link', { name: /\/gift\/demo-salon$/ })
    expect(link).toHaveAttribute('href', expect.stringContaining('/gift/demo-salon'))

    await userEvent.click(screen.getByRole('button', { name: 'Add offer' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(screen.getByLabelText('Name'), 'Birthday')
    await userEvent.type(screen.getByLabelText('Price'), '70')
    await userEvent.type(screen.getByLabelText('Face value'), '80')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/businesses/me/gift-offers',
        expect.objectContaining({
          name: 'Birthday',
          kind: 'money',
          price: 70,
          face_value: 80,
          visits_count: null,
          validity_days: 365,
        }),
      ),
    )
    await waitFor(() => expect(dialog).not.toBeInTheDocument())

    await userEvent.click(await screen.findByRole('button', { name: 'Details' }))
    expect(await screen.findByText('Redeemed')).toBeInTheDocument()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await userEvent.click(screen.getByRole('button', { name: 'Reverse redemption' }))

    expect(await screen.findByText('Redemption reversed')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith(
      '/businesses/me/gift-certificates/5/reversals',
      expect.objectContaining({
        redemption_entry_id: 2,
        request_key: expect.stringMatching(/^reverse-[A-Za-z0-9_-]+/),
      }),
    )
  })
})

const jana = {
  id: 3,
  full_name: 'Jana Nováková',
  contact_phone: '+420777000111',
  language: 'cz',
  created_at: '2026-10-01T10:00:00',
}

const LOOKUP_DETAIL = {
  ...CERTIFICATE,
  order_id: 11,
  money_balance: 50,
  ledger: [],
}

describe('gift redemption in the visit form', () => {
  it('saves the visit once and retries the same redemption key after a failure', async () => {
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/clients/') return Promise.resolve({ data: [jana] })
      if (url === '/services/') {
        return Promise.resolve({
          data: [
            {
              id: 7,
              name: 'Massage',
              duration_minutes: 60,
              price: 40,
              specialist_id: 7,
              is_active: true,
            },
          ],
        })
      }
      if (url === '/services/7') {
        return Promise.resolve({
          data: {
            id: 7,
            name: 'Massage',
            duration_minutes: 60,
            price: 40,
            specialist_id: 7,
            specialists: [{ id: 7, full_name: 'Test User' }],
          },
        })
      }
      if (url === '/businesses/me/gift-certificates/lookup') {
        return Promise.resolve({ data: LOOKUP_DETAIL })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)

    const redeemPayloads: Record<string, unknown>[] = []
    vi.mocked(api.post).mockImplementation(((url: string, body?: Record<string, unknown>) => {
      if (url === '/visits/') return Promise.resolve({ data: { id: 9 } })
      if (url === '/businesses/me/gift-certificates/redeem') {
        redeemPayloads.push(body ?? {})
        if (redeemPayloads.length === 1) {
          return Promise.reject(apiError(409, 'This certificate cannot be used here'))
        }
        return Promise.resolve({ data: { applied_amount: 20 } })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)

    const onSuccess = vi.fn()
    renderWithProviders(<VisitForm onSuccess={onSuccess} onCancel={() => {}} />)

    const clientOption = await screen.findByRole('option', { name: 'Jana Nováková' })
    await userEvent.selectOptions(clientOption.closest('select')!, clientOption)
    const serviceOption = await screen.findByRole('option', { name: /Massage/ })
    await userEvent.selectOptions(serviceOption.closest('select')!, '7')
    await waitFor(() => {
      const priceField = screen.getByText('Price').parentElement!.querySelector('input')!
      expect(priceField).toHaveValue(40)
    })

    await userEvent.type(screen.getByLabelText('Certificate code'), 'GIFT-ABCD-1234')
    await userEvent.click(screen.getByRole('button', { name: 'Find' }))
    expect(await screen.findByText(/Balance.*50/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/Amount to use/), '20')

    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

    expect(await screen.findByText('The visit was saved, but the certificate was not applied.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Apply gift certificate' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(redeemPayloads).toHaveLength(2)
    expect(redeemPayloads[0]).toMatchObject({ code: 'GIFT-ABCD-1234', visit_id: 9, amount: 20 })
    expect(redeemPayloads[1].request_key).toBe(redeemPayloads[0].request_key)
    expect(vi.mocked(api.post).mock.calls.map((call) => call[0])).not.toContain('/loyalty/use-points')
  })

  it('blocks a certificate whose service scope does not match the visit', async () => {
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/clients/') return Promise.resolve({ data: [jana] })
      if (url === '/services/') {
        return Promise.resolve({ data: [{ id: 7, name: 'Massage', duration_minutes: 60, price: 40, specialist_id: 7 }] })
      }
      if (url === '/businesses/me/gift-certificates/lookup') {
        return Promise.resolve({ data: { ...LOOKUP_DETAIL, service_ids: [99] } })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)

    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)

    const clientOption = await screen.findByRole('option', { name: 'Jana Nováková' })
    await userEvent.selectOptions(clientOption.closest('select')!, clientOption)
    const serviceOption = await screen.findByRole('option', { name: /Massage/ })
    await userEvent.selectOptions(serviceOption.closest('select')!, '7')
    await userEvent.type(screen.getByLabelText('Certificate code'), 'GIFT-ABCD-1234')
    await userEvent.click(screen.getByRole('button', { name: 'Find' }))

    expect(
      await screen.findByText('This certificate does not cover the services of this visit.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

    expect(api.post).not.toHaveBeenCalled()
  })
})
