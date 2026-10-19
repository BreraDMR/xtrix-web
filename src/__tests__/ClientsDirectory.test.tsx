import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Clients from '../pages/Clients'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }))

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 2, role: 'specialist' })
})

describe('client directory controls', () => {
  it('searches from the first page and clears both the filter and its visible input', async () => {
    const clients = Array.from({ length: 22 }, (_, index) => ({
      id: index + 1, full_name: `Client ${String(index + 1).padStart(2, '0')}`,
      contact_phone: null, contact_email: null, gender: null,
    }))
    vi.mocked(api.get).mockImplementation(routes({ '/clients/': clients }))
    renderWithProviders(<Clients />)
    await userEvent.click(await screen.findByRole('button', { name: '2' }))
    expect(screen.getByText('Client 22')).toBeInTheDocument()
    const search = screen.getByRole('searchbox')
    await userEvent.type(search, 'Client 01')
    expect(await screen.findByText('Client 01')).toBeInTheDocument()
    expect(screen.queryByText('Client 22')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(search).toHaveValue('')
    expect(screen.getByText('Client 02')).toBeInTheDocument()
  })
})

