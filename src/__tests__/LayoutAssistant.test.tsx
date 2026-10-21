import { beforeEach, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  default: { get: vi.fn(), post: vi.fn() },
}))

const status = {
  enabled: true, voice_enabled: false, assistant: { name: 'Sasha', gender: 'female', is_default: true },
  limit: 100, used: 0, resets_at: '2026-11-01T00:00:00Z',
}

function renderLayout() {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<h1>Home</h1>} />
      </Route>
    </Routes>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  resetStores()
  vi.mocked(api.get).mockImplementation(routes({ '/assistant/status': status, '/businesses/me': null }))
})

it('has the assistant button in the header, and the panel opens over any screen', async () => {
  signIn({ id: 5, role: 'specialist' })
  renderLayout()
  const header = screen.getByRole('banner')
  await userEvent.click(await within(header).findByRole('button', { name: 'Open the assistant: Sasha' }))
  expect(await screen.findByRole('dialog', { name: 'Sasha' })).toBeInTheDocument()
  expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()
})

it('has no assistant button for a role the API keeps out', () => {
  signIn({ id: 5, role: 'client' })
  renderLayout()
  expect(screen.queryByRole('button', { name: /open the assistant/i })).not.toBeInTheDocument()
})
