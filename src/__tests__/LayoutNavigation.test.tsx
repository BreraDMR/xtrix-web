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
    <MemoryRouter initialEntries={['/app/clients']}>
      <Routes>
        <Route path="/app" element={<Layout />}>
          <Route index element={<h1>Dashboard screen</h1>} />
          <Route path="clients" element={<h1>Clients screen</h1>} />
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
  expect(await screen.findByRole('heading', { name: 'Clients screen' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('link', { name: 'Xtrix' }))
  expect(await screen.findByRole('heading', { name: 'Dashboard screen' })).toBeInTheDocument()
  expect(within(screen.getByRole('navigation', { name: 'PRIMARY' })).getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page')
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
  expect(within(screen.getByRole('navigation', { name: 'PRIMARY' })).getByRole('link', { name: 'Clients' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Expand menu' }))
  expect(screen.getByRole('button', { name: 'Collapse menu' })).toHaveAttribute('aria-expanded', 'true')
})

it('keeps icon links named, titled and marked as current in compact mode', async () => {
  renderLayout()
  await userEvent.click(screen.getByRole('button', { name: 'Collapse menu' }))
  const clients = within(screen.getByRole('navigation', { name: 'PRIMARY' })).getByRole('link', { name: 'Clients' })
  expect(clients).toHaveAttribute('aria-label', 'Clients')
  expect(clients).toHaveAttribute('title', 'Clients')
  expect(clients).toHaveAttribute('aria-current', 'page')
  clients.focus()
  expect(clients).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  expect(await screen.findByRole('heading', { name: 'Clients screen' })).toBeInTheDocument()
})

it('restores the selected menu density after a remount', async () => {
  const view = renderLayout()
  await userEvent.click(screen.getByRole('button', { name: 'Collapse menu' }))
  view.unmount()
  renderLayout()
  expect(screen.getByRole('button', { name: 'Expand menu' })).toHaveAttribute('aria-expanded', 'false')
})

it('ignores an invalid saved menu density', () => {
  localStorage.setItem('xtrix.sidebar.compact', '{broken')
  renderLayout()
  expect(screen.getByRole('button', { name: 'Collapse menu' })).toHaveAttribute('aria-expanded', 'true')
})

it('can toggle when browser storage cannot be read or written', async () => {
  const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage blocked') })
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage blocked') })
  try {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Collapse menu' }))
    expect(screen.getByRole('button', { name: 'Expand menu' })).toHaveAttribute('aria-expanded', 'false')
  } finally {
    get.mockRestore()
    set.mockRestore()
  }
})


it('offers daily destinations on mobile and returns focus to More after closing the full menu', async () => {
  renderLayout()
  const quick = screen.getByRole('navigation', { name: 'Quick navigation' })
  expect(within(quick).getByRole('link', { name: 'Clients' })).toHaveAttribute('aria-current', 'page')
  expect(within(quick).getByRole('link', { name: 'Calendar' })).toHaveAttribute('href', '/app/calendar')
  const more = within(quick).getByRole('button', { name: 'More' })
  await userEvent.click(more)
  expect(screen.getByRole('dialog', { name: 'PRIMARY' })).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'PRIMARY' })).not.toBeInTheDocument()
  expect(more).toHaveFocus()
})

it('offers My Salary to staff but not to a solo specialist who has no employer', () => {
  signIn({ id: 6, role: 'specialist', employer_id: 9 })
  const { unmount } = renderLayout()
  expect(within(screen.getByRole('navigation', { name: 'PRIMARY' })).getByRole('link', { name: 'My Salary' })).toBeInTheDocument()
  unmount()
  signIn({ id: 7, role: 'specialist', employer_id: null })
  renderLayout()
  expect(within(screen.getByRole('navigation', { name: 'PRIMARY' })).queryByRole('link', { name: 'My Salary' })).not.toBeInTheDocument()
})
