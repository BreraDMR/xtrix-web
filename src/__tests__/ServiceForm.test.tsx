import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceForm from '../components/ServiceForm'
import api from '../api/client'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('ServiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(
      <ServiceForm
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    )

    expect(screen.getByLabelText(/service name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument()
  })

  it('submits new service', async () => {
    const onSuccess = vi.fn()
    const mockPost = vi.fn().mockResolvedValue({ data: {} })
    ;(api.post as any) = mockPost

    render(
      <ServiceForm
        onSuccess={onSuccess}
        onCancel={() => {}}
      />
    )

    const nameInput = screen.getByLabelText(/service name/i)
    await userEvent.type(nameInput, 'Facial Treatment')

    const durationInput = screen.getByLabelText(/duration/i)
    await userEvent.clear(durationInput)
    await userEvent.type(durationInput, '90')

    const priceInput = screen.getByLabelText(/price/i)
    await userEvent.clear(priceInput)
    await userEvent.type(priceInput, '150')

    const submitButton = screen.getByRole('button', { name: /create/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/services', expect.objectContaining({
        name: 'Facial Treatment',
        duration_minutes: 90,
        price: 150,
      }))
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

