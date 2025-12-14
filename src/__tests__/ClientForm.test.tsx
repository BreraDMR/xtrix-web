import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientForm from '../components/ClientForm'
import api from '../api/client'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('ClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(
      <ClientForm
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    )

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('submits new client', async () => {
    const onSuccess = vi.fn()
    const mockPost = vi.fn().mockResolvedValue({ data: {} })
    ;(api.post as any) = mockPost

    render(
      <ClientForm
        onSuccess={onSuccess}
        onCancel={() => {}}
      />
    )

    const nameInput = screen.getByLabelText(/full name/i)
    await userEvent.type(nameInput, 'John Doe')

    const submitButton = screen.getByRole('button', { name: /create/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/clients', expect.objectContaining({
        full_name: 'John Doe',
      }))
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('loads and submits update for existing client', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      data: { id: 1, full_name: 'John Doe', owner_id: 1 },
    })
    const mockPut = vi.fn().mockResolvedValue({ data: {} })
    ;(api.get as any) = mockGet
    ;(api.put as any) = mockPut

    const onSuccess = vi.fn()

    render(
      <ClientForm
        clientId={1}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />
    )

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/clients/1')
    })

    const submitButton = screen.getByRole('button', { name: /update/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

