import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PrivateRoute from '../components/PrivateRoute'
import Layout from '../components/Layout'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { resetStores } from '../test/render'

// the real signOut, only the http calls are faked
vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  default: { get: vi.fn(), post: vi.fn() },
}))

function Where() {
  const location = useLocation()
  return <p>{`at ${location.pathname}${location.search}`}</p>
}

beforeEach(() => {
  vi.resetAllMocks()
  resetStores()
})

it('the logout button goes to a plain login page, with no way back to the last page', async () => {
  useAuthStore.getState().setAuth('saved', { id: 7, full_name: 'Jane', role: 'business_owner' })
  vi.mocked(api.get).mockResolvedValue({ data: {} })
  // same router flags as the app: route changes are transitions, the store update is not
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={['/clients']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Where />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="clients" element={<Where />} />
        </Route>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>)
  expect(await screen.findByText('at /clients')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Logout' }))
  expect(await screen.findByText(/^at \/login/)).toHaveTextContent(/^at \/login$/)
})
