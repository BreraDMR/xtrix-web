import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceForm from '../components/ServiceForm'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

describe('ServiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(
      routes({ '/employees/': [], '/users/': [{ id: 7, full_name: 'Test User', role: 'specialist' }] }) as any
    )
  })

  it('creates a service', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    const onSuccess = vi.fn()
    renderWithProviders(<ServiceForm onSuccess={onSuccess} onCancel={() => {}} />)

    await userEvent.type(screen.getByPlaceholderText(/facial treatment/i), 'Facial Treatment')
    const [duration, price] = screen.getAllByRole('spinbutton')
    await userEvent.clear(duration)
    await userEvent.type(duration, '90')
    await userEvent.clear(price)
    await userEvent.type(price, '150')
    await userEvent.click(screen.getByRole('button', { name: /create|save/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith(
      '/services',
      expect.objectContaining({ name: 'Facial Treatment', duration_minutes: 90, price: 150, specialist_id: 7 })
    )
  })
})
