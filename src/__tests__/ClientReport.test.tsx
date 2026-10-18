import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import ClientPersonalReportModal from '../components/ClientPersonalReportModal'
import api from '../api/client'
import type { ClientOut } from '../api/types'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

const client: ClientOut = {
  id: 5,
  full_name: 'Jane Doe',
  contact_phone: '+420777000111',
  contact_email: 'jane@example.com',
  birth_date: '1990-04-15',
  gender: 'female',
  language: 'en',
  created_at: '2026-01-01T10:00:00Z',
}

describe('Client personal report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner' })
    vi.mocked(api.get).mockImplementation(routes({
      '/clients/5': client,
      '/businesses/me': { id: 1, currency: 'EUR' },
    }))
  })

  it('shows the birth date the API sends and only the fields it has', async () => {
    renderWithProviders(<ClientPersonalReportModal isOpen onClose={() => {}} clientId={5} />)
    const table = await screen.findByRole('table')
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['Name', 'Phone', 'Email', 'Date of Birth', 'Gender'])
    expect(within(table).getByText(new Date(1990, 3, 15).toLocaleDateString())).toBeInTheDocument()
  })
})
