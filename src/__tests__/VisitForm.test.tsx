import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitForm from '../components/VisitForm'
import api from '../api/client'

vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('VisitForm', () => {
  beforeEach(() => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/clients') {
        return Promise.resolve({ data: [{ id: 1, full_name: 'Test Client' }] })
      }
      if (url === '/services') {
        return Promise.resolve({ data: [{ id: 1, name: 'Facial', duration_minutes: 60 }] })
      }
      return Promise.resolve({ data: {} })
    })
  })

  it('renders form fields', async () => {
    render(
      <VisitForm
        onSuccess={() => {}}
        onCancel={() => {}}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/client/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    })
  })

  it('submits new visit', async () => {
    const onSuccess = vi.fn()
    const mockPost = vi.fn().mockResolvedValue({ data: {} })
    ;(api.post as any) = mockPost

    render(
      <VisitForm
        onSuccess={onSuccess}
        onCancel={() => {}}
      />
    )

    await waitFor(() => {
      const clientSelect = screen.getByLabelText(/client/i)
      expect(clientSelect).toBeInTheDocument()
    })

    const clientSelect = screen.getByLabelText(/client/i)
    await userEvent.selectOptions(clientSelect, '1')

    const submitButton = screen.getByRole('button', { name: /create/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled()
      expect(onSuccess).toHaveBeenCalled()
    })
  })
})

