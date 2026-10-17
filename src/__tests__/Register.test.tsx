import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../pages/Register'
import api from '../api/client'
import { renderWithProviders, resetStores, routes } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    vi.mocked(api.get).mockImplementation(
      routes({
        '/specialist-profiles/types': { categories: { beauty: { name: 'Beauty', types: ['massage'] } } },
        '/users/me': { id: 5, full_name: 'Jana Owner', role: 'business_owner' },
      }) as any
    )
  })

  it('offers only the roles public signup accepts', () => {
    renderWithProviders(<Register />)
    const options = Array.from((screen.getByLabelText(/role/i) as HTMLSelectElement).options).map((o) => o.value)
    expect(options).toEqual(['specialist', 'business_owner'])
  })

  it('signs up a business owner without a business_id', async () => {
    vi.mocked(api.post).mockImplementation(((url: string) =>
      Promise.resolve({ data: url === '/users/login' ? { access_token: 'token' } : { id: 5 } })) as any)
    renderWithProviders(<Register />)

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jana Owner')
    await userEvent.type(screen.getByLabelText(/email/i), 'jana@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!pass')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!pass')
    await userEvent.selectOptions(screen.getByLabelText(/role/i), 'business_owner')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/users/', expect.anything()))
    const body = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
    expect(body).toMatchObject({ full_name: 'Jana Owner', email: 'jana@example.com', role: 'business_owner' })
    expect(body).not.toHaveProperty('business_id')
    expect(body).not.toHaveProperty('specialist_type')
  })
})
