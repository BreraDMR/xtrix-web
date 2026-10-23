import { beforeEach, expect, it, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StaffStep from '../components/onboarding/StaffStep'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 8, role: 'business_owner' }) })

it('keeps the issued password visible until acknowledged after employees refresh', async () => {
  vi.mocked(api.get).mockImplementation(routes({
    '/onboarding/me': { persona: 'owner', steps: [{ key: 'staff', completed: true }] },
    '/employees/': [], '/specialist-profiles/types': { categories: {} },
  }))
  vi.mocked(api.post).mockResolvedValue({ data: { generated_password: 'Only-Shown-Once!123' } })
  const { queryClient } = renderWithProviders(<StaffStep />)
  await userEvent.click(await screen.findByRole('button', { name: 'Add master' }))
  await userEvent.type(screen.getByLabelText(/full name/i), 'Eva Master')
  await userEvent.type(screen.getByLabelText(/email/i), 'eva.master@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  await screen.findByDisplayValue('Only-Shown-Once!123')
  await act(async () => {
    queryClient.setQueryData(['employees', true], [{ id: 9, is_active: true }])
    await new Promise(resolve => setTimeout(resolve, 10))
  })
  expect(screen.getByDisplayValue('Only-Shown-Once!123')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.queryByDisplayValue('Only-Shown-Once!123')).not.toBeInTheDocument()
  expect(api.post).toHaveBeenCalledTimes(1)
})
