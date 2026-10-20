import { beforeEach, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  default: { get: vi.fn(), post: vi.fn() },
}))

function renderLayout() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/clients']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<h1>Dashboard screen</h1>} />
          <Route path="/clients" element={<h1>Clients screen</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
    { router: false },
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  resetStores()
  signIn({ id: 5, role: 'business_owner' })
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': null }))
})

it('opens the dashboard from the X logo on the clients screen', async () => {
  renderLayout()
  expect(screen.getByRole('heading', { name: 'Clients screen' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('link', { name: 'Xtrix' }))
  expect(screen.getByRole('heading', { name: 'Dashboard screen' })).toBeInTheDocument()
  expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
})

it('toggles desktop navigation without opening the mobile menu or changing role links', async () => {
  signIn({ id: 5, role: 'employee', employer_id: 9 })
  renderLayout()
  const toggle = screen.getByRole('button', { name: 'Collapse menu' })
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await userEvent.click(toggle)
  expect(screen.getByRole('button', { name: 'Expand menu' })).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('dialog', { name: 'PRIMARY' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Finance' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Clients' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Expand menu' }))
  expect(screen.getByRole('button', { name: 'Collapse menu' })).toHaveAttribute('aria-expanded', 'true')
})
