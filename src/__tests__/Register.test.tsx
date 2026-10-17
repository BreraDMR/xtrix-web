import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../pages/Register'
import Login from '../pages/Login'
import { Routes, Route } from 'react-router-dom'
import { useLocaleStore } from '../store/localeStore'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes } from '../test/render'

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

  it.each([
    ['en', 'Your account has been created. Please sign in.'],
    ['ru', 'Аккаунт создан. Войдите в систему.'],
    ['cz', 'Účet byl vytvořen. Přihlaste se prosím.'],
  ] as const)('redirects to login with a translated notice after signup succeeds but auto-login is limited (%s)', async (locale, message) => {
    vi.mocked(api.post).mockImplementation(((url: string) => url === '/users/'
      ? Promise.resolve({ data: { id: 5 } })
      : Promise.reject(apiError(429, 'Rate limit exceeded'))) as any)
    const { container } = renderWithProviders(<Routes>
      <Route path="/" element={<Register />} />
      <Route path="/login" element={<Login />} />
    </Routes>)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jana Owner')
    await userEvent.type(screen.getByLabelText(/email/i), 'jana@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!pass')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!pass')
    await userEvent.selectOptions(screen.getByLabelText(/role/i), 'business_owner')
    useLocaleStore.setState({ locale })
    await userEvent.click(container.querySelector('button[type="submit"]')!)
    expect(await screen.findByRole('status')).toHaveTextContent(message)
    expect(api.post).toHaveBeenCalledTimes(2)
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('keeps signup errors on the registration page without attempting login', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(400, 'Email already registered'))
    renderWithProviders(<Register />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jana Owner')
    await userEvent.type(screen.getByLabelText(/email/i), 'jana@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'Str0ng!pass')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Str0ng!pass')
    await userEvent.selectOptions(screen.getByLabelText(/role/i), 'business_owner')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText('Email already registered')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledTimes(1)
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
