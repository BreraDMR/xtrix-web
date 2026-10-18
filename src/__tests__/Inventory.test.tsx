import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Inventory from '../pages/Inventory'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), delete: vi.fn() } }))

describe('Inventory deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({
      '/products/?': { items: [{ id: 3, name: 'Shampoo', unit: 'pcs', quantity: 10, min_quantity: 1 }] },
      '/businesses/me': { id: 1, currency: 'EUR' },
    }))
    vi.mocked(api.delete).mockResolvedValue({ data: {} })
  })

  it.each([false, true])('deletes only when confirmation is %s', async (confirmed) => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(confirmed)
    renderWithProviders(<Inventory />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(confirm).toHaveBeenCalledWith('Are you sure you want to delete this product?')
    if (confirmed) {
      await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/products/3'))
    } else {
      expect(api.delete).not.toHaveBeenCalled()
    }
  })
})
