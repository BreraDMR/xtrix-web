import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Finance from '../pages/Finance'
import api from '../api/client'
import { renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

describe('finance dates', () => {
  beforeEach(() => {
    resetStores()
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(url => Promise.resolve({ data: url.startsWith('/expenses/?')
      ? { items: [], page: 1, per_page: 100, total: 0, pages: 0 } : [] }))
  })

  it('requests the whole local calendar month, including the last millisecond', async () => {
    renderWithProviders(<Finance />)
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/expenses/reports/profit', {
      params: { date_from: first.toISOString(), date_to: last.toISOString() },
    }))
    expect(screen.getByDisplayValue(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)).toBeInTheDocument()
  })
})
