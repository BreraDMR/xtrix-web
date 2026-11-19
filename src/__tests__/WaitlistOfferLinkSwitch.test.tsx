import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import WaitlistOffer from '../pages/booking/WaitlistOffer'
import api from '../api/client'
import { renderWithProviders, resetStores } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

// WAIT-09: a second offer mail opened in the same tab only changes the #token fragment.
// The page must drop the first offer's result and act on the new token.

const offer = (token: string) => ({
  business_name: token === 'offer-A' ? 'Salon A' : 'Salon B',
  business_phone: null,
  business_address: null,
  service_name: 'Wait Cut',
  staff_name: 'Mia Master',
  start: '2030-06-01T08:00:00Z',
  end: '2030-06-01T09:00:00Z',
  timezone: 'Europe/Prague',
  status: 'pending',
  expires_at: '2030-06-01T07:00:00Z',
  price: 20,
  currency: 'EUR',
})

const booked = (token: string) => ({
  id: token === 'offer-A' ? 41 : 42,
  start: '2030-06-01T08:00:00Z',
  end: '2030-06-01T09:00:00Z',
  service_name: 'Wait Cut',
  staff_id: 3,
  staff_name: 'Mia Master',
  price: 20,
  currency: 'EUR',
  status: 'planned',
  timezone: 'Europe/Prague',
  manage_token: `manage-${token}`,
})

const tokenOf = (config: unknown) =>
  String((config as { headers?: Record<string, string> } | undefined)?.headers?.['X-Waitlist-Token'])

function mount() {
  window.history.replaceState({ idx: 0, key: 'seed' }, '', '/waitlist/offer#token=offer-A')
  return renderWithProviders(
    <BrowserRouter>
      <Routes>
        <Route path="/waitlist/offer" element={<WaitlistOffer />} />
      </Routes>
    </BrowserRouter>,
    { router: false },
  )
}

async function openLink(token: string) {
  await act(async () => {
    window.location.hash = `token=${token}`
    await new Promise((resolve) => setTimeout(resolve, 10))
  })
}

describe('waitlist offer link switch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    sessionStorage.clear()
    vi.mocked(api.get).mockImplementation((async (_url: string, config: unknown) => ({ data: offer(tokenOf(config)) })) as never)
    vi.mocked(api.post).mockImplementation((async (_url: string, _body: unknown, config: unknown) => ({ data: booked(tokenOf(config)) })) as never)
  })

  it('shows and books the new offer after a booked one in the same tab', async () => {
    mount()
    expect(await screen.findByRole('heading', { name: 'Salon A' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Book this time' }))
    expect(await screen.findByText('Booking number: #41')).toBeInTheDocument()

    await openLink('offer-B')
    expect(await screen.findByRole('heading', { name: 'Salon B' })).toBeInTheDocument()
    expect(screen.queryByText('Booking number: #41')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Book this time' }))
    expect(await screen.findByText('Booking number: #42')).toBeInTheDocument()
    const last = vi.mocked(api.post).mock.calls.at(-1)
    expect(last?.[0]).toBe('/public/waitlist/offer/accept')
    expect(tokenOf(last?.[2])).toBe('offer-B')
  })

  it('keeps the router history entry when it scrubs the token from the address', async () => {
    mount()
    expect(await screen.findByRole('heading', { name: 'Salon A' })).toBeInTheDocument()
    expect(window.location.hash).toBe('')
    expect(window.history.state).toMatchObject({ idx: 0, key: 'seed' })
  })

  it('drops the old offer for an explicitly empty token', async () => {
    mount()
    expect(await screen.findByRole('heading', { name: 'Salon A' })).toBeInTheDocument()
    await openLink('')
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Salon A' })).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Book this time' })).not.toBeInTheDocument()
    expect(sessionStorage.getItem('waitlist_offer_token')).toBeNull()
  })
})
