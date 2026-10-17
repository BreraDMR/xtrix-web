import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientForm from '../components/ClientForm'
import VisitForm from '../components/VisitForm'
import EmployeeForm from '../components/EmployeeForm'
import ServiceForm from '../components/ServiceForm'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const forms = [
  { name: 'client', Component: ClientForm, endpoint: '/clients/' },
  { name: 'visit', Component: VisitForm, endpoint: '/visits/' },
  { name: 'employee', Component: EmployeeForm, endpoint: '/employees/create-with-user' },
  { name: 'service', Component: ServiceForm, endpoint: '/services/' },
]

describe('Form submission locks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.mocked(api.get).mockImplementation(routes({
      '/clients/': [{ id: 3, full_name: 'Jana' }], '/services/': [],
      '/employees/': [], '/users/': [{ id: 7, full_name: 'Test User', role: 'specialist' }],
      '/specialist-profiles/types': { categories: {} },
      '/specialist-profiles/me': {}, '/loyalty/balance/3': { points: 0, cashback: 0 },
    }) as any)
  })

  it.each(forms)('$name sends once for three synchronous clicks and allows retry after failure', async ({ name, Component, endpoint }) => {
    let rejectRequest!: (reason: unknown) => void
    vi.mocked(api.post).mockImplementation(() => new Promise((_resolve, reject) => { rejectRequest = reject }))
    const onSuccess = vi.fn()
    const { container } = renderWithProviders(<Component onSuccess={onSuccess} onCancel={() => {}} />)
    if (name === 'client' || name === 'employee') {
      await userEvent.type(screen.getByLabelText(/full name/i), 'Jana')
    }
    if (name === 'employee') await userEvent.type(screen.getByLabelText(/email/i), 'jana@example.com')
    if (name === 'service') {
      await screen.findByRole('option', { name: /Test User/ })
      await userEvent.type(screen.getByPlaceholderText(/facial treatment/i), 'Massage')
    }
    if (name === 'visit') {
      const option = await screen.findByRole('option', { name: 'Jana' })
      await userEvent.selectOptions(option.closest('select')!, option)
    }
    const submit = container.querySelector<HTMLButtonElement>('button[type="submit"]')!
    act(() => { submit.click(); submit.click(); submit.click() })
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith(endpoint, expect.anything())
    await act(async () => rejectRequest(apiError(500, 'Try again')))
    await waitFor(() => expect(submit).toBeEnabled())
    vi.mocked(api.post).mockResolvedValue({ data: { id: 8, generated_password: 'NewPassword1!' } })
    await userEvent.click(submit)
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2))
    if (name !== 'employee') expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
