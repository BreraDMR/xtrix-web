import { beforeEach, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrivateRoute from '../components/PrivateRoute'
import Login from '../pages/Login'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { resetStores, apiError } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
function Page() { const location = useLocation(); return <p>Protected {location.pathname}{location.search}{location.hash}</p> }
function mount(path: string) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[path]}><Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<PrivateRoute><Page /></PrivateRoute>} />
    </Routes></MemoryRouter>
  </QueryClientProvider>)
}
beforeEach(() => { vi.resetAllMocks(); resetStores() })

it('restores the missing user before rendering a private page', async () => {
  useAuthStore.setState({ token: 'saved', user: null })
  vi.mocked(api.get).mockResolvedValue({ data: { id: 7, full_name: 'Jane', role: 'specialist' } })
  mount('/clients?search=Jane#list')
  expect(await screen.findByText('Protected /clients?search=Jane#list')).toBeInTheDocument()
  expect(api.get).toHaveBeenCalledWith('/users/me')
  expect(useAuthStore.getState().user?.id).toBe(7)
})

it('keeps the private page blocked and offers retry if user loading fails', async () => {
  useAuthStore.setState({ token: 'saved', user: null })
  vi.mocked(api.get).mockRejectedValue(apiError(500, 'Unavailable'))
  mount('/finance')
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByText(/Protected/)).not.toBeInTheDocument()
  vi.mocked(api.get).mockResolvedValue({ data: { id: 7, full_name: 'Jane', role: 'specialist' } })
  await userEvent.click(screen.getByRole('button', { name: /retry/i }))
  expect(await screen.findByText('Protected /finance')).toBeInTheDocument()
})

it('returns to the original private URL after signing in', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { access_token: 'access', refresh_token: 'refresh' } })
  vi.mocked(api.get).mockResolvedValue({ data: { id: 7, full_name: 'Jane', role: 'specialist' } })
  mount('/app/clients?search=Jane#list')
  await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(await screen.findByText('Protected /app/clients?search=Jane#list')).toBeInTheDocument()
  expect(localStorage.getItem('auth_refresh_token')).toBe('refresh')
})

it('does not invent an admin user when the profile request fails after login', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { access_token: 'access', refresh_token: 'refresh' } })
  vi.mocked(api.get).mockRejectedValue(apiError(500, 'Unavailable'))
  mount('/login')
  await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  await waitFor(() => expect(screen.getByText('Unavailable')).toBeInTheDocument())
  expect(useAuthStore.getState().user).toBeNull()
  expect(localStorage.getItem('auth_refresh_token')).toBeNull()
})

it('sends the user to login with a way back when the session ends', async () => {
  useAuthStore.getState().setAuth('saved', { id: 7, full_name: 'Jane', role: 'specialist' })
  mount('/app/employees/1/salary')
  expect(await screen.findByText('Protected /app/employees/1/salary')).toBeInTheDocument()
  act(() => useAuthStore.getState().logout())
  expect(await screen.findByRole('button', { name: /sign in/i })).toBeInTheDocument()
  vi.mocked(api.post).mockResolvedValue({ data: { access_token: 'access', refresh_token: 'refresh' } })
  vi.mocked(api.get).mockResolvedValue({ data: { id: 7, full_name: 'Jane', role: 'specialist' } })
  await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(await screen.findByText('Protected /app/employees/1/salary')).toBeInTheDocument()
})

it('ignores a return address that leads off the site', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { access_token: 'access', refresh_token: 'refresh' } })
  vi.mocked(api.get).mockResolvedValue({ data: { id: 7, full_name: 'Jane', role: 'specialist' } })
  mount('/login?returnTo=%2F%2Fevil.example%2Fx')
  await userEvent.type(screen.getByLabelText(/email/i), 'jane@example.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
  expect(await screen.findByText('Protected /app')).toBeInTheDocument()
})
