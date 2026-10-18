import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import api from '../api/client'
import CheckoutReturn from '../components/CheckoutReturn'
import { apiError, renderWithProviders, resetStores } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

function show(search = '?success=true&session_id=cs_test') {
  return renderWithProviders(<MemoryRouter initialEntries={[`/subscription${search}`]}>
    <CheckoutReturn />
  </MemoryRouter>, { router: false })
}

beforeEach(() => { vi.clearAllMocks(); resetStores() })

describe('checkout return', () => {
  it('does not treat the success URL as proof of payment', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { status: 'unpaid' } })
    show()
    expect(await screen.findByText('Payment has not been completed.')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('waits for the webhook and then refreshes the subscription', async () => {
    vi.mocked(api.get).mockImplementation(async (url) => ({ data: url.includes('/checkout/session/')
      ? { status: 'paid', subscription_id: 'sub_1' }
      : { external_id: 'sub_1', status: 'active', is_trial: false } }))
    const { queryClient } = show()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    expect(await screen.findByText('Your paid subscription is active.')).toBeInTheDocument()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['subscription'] })
  })

  it('does not mistake an existing trial for a paid subscription', async () => {
    vi.mocked(api.get).mockImplementation(async (url) => ({ data: url.includes('/checkout/session/')
      ? { status: 'paid', subscription_id: 'sub_1' }
      : { status: 'active', is_trial: true } }))
    show()
    expect(await screen.findByText('Payment received. Waiting for subscription activation…')).toBeInTheDocument()
    expect(screen.queryByText('Your paid subscription is active.')).not.toBeInTheDocument()
  })

  it('allows retry after a verification error', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(apiError(503, 'unavailable'))
    show()
    expect(await screen.findByText('Could not verify the payment. Please try again.')).toBeInTheDocument()
    vi.mocked(api.get).mockResolvedValue({ data: { status: 'unpaid' } })
    await userEvent.click(screen.getByRole('button', { name: 'Check again' }))
    expect(await screen.findByText('Payment has not been completed.')).toBeInTheDocument()
  })

  it('shows cancellation without requesting payment verification', () => {
    show('?canceled=true')
    expect(screen.getByText('Checkout was cancelled. You can choose a plan again.')).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('does nothing on a plain subscription page', () => {
    const { container } = show('')
    expect(container).toBeEmptyDOMElement()
    expect(api.get).not.toHaveBeenCalled()
  })
})
