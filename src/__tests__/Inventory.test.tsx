import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Inventory from '../pages/Inventory'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))

describe('Inventory deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({
      '/products/?': [{ id: 3, name: 'Shampoo', unit: 'pcs', quantity: 10, min_quantity: 1 }],
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

describe('Inventory product form errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({
      '/products/?': [{ id: 3, name: 'Shampoo', unit: 'pcs', quantity: 10, min_quantity: 1 }],
      '/businesses/me': { id: 1, currency: 'EUR' },
    }))
  })

  it('keeps the add form open and shows why the API refused it', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(400, 'This barcode is already used'))
    renderWithProviders(<Inventory />)
    await userEvent.click(await screen.findByRole('button', { name: /add product/i }))
    await userEvent.type(within(document.querySelector('form')!).getAllByRole('textbox')[0], 'Gel')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This barcode is already used')
    expect(screen.getByRole('heading', { name: /add product/i })).toBeInTheDocument()
  })

  it('shows a failed edit too', async () => {
    vi.mocked(api.put).mockRejectedValue(apiError(400, 'Quantity is locked'))
    renderWithProviders(<Inventory />)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit: Shampoo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Quantity is locked')
  })

  it('creates the product in the business from the session', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 4 } })
    renderWithProviders(<Inventory />)
    await userEvent.click(await screen.findByRole('button', { name: /add product/i }))
    await userEvent.type(within(document.querySelector('form')!).getAllByRole('textbox')[0], 'Gel')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/products/', expect.objectContaining({ name: 'Gel', business_id: 1 })))
  })

  it('asks for a business first when the session has none', async () => {
    signIn({ id: 1, role: 'business_owner', business_id: null })
    renderWithProviders(<Inventory />)
    await userEvent.click(await screen.findByRole('button', { name: /add product/i }))
    await userEvent.type(within(document.querySelector('form')!).getAllByRole('textbox')[0], 'Gel')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Create your business first')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('asks for a name under the field instead of an alert', async () => {
    renderWithProviders(<Inventory />)
    await userEvent.click(await screen.findByRole('button', { name: /add product/i }))
    fireEvent.submit(document.querySelector('form')!)
    expect(await screen.findByText("This field can't be empty")).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})


describe('Inventory workspace access and stock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({
      '/products/?': [{ id: 3, name: 'Shampoo', unit: 'pcs', quantity: 10, min_quantity: 1 }],
      '/businesses/me': { id: 1, currency: 'EUR' },
    }))
  })

  it.each(['read_only', 'blocked'] as const)('keeps %s stock searchable without mutation controls', async (crm_mode) => {
    const access: WorkspaceAccess = { crm_mode, can_export: false, can_manage_billing: true, can_use_ai: false, checkout_available: false, pilot_mode: true }
    renderWithProviders(<WorkspaceAccessContext.Provider value={access}><Inventory /></WorkspaceAccessContext.Provider>)
    await screen.findByText('Shampoo')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products...' }), 'Sham')
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining('search=Sham'), expect.anything()))
    expect(screen.queryByRole('button', { name: /Add Product|Edit:|Add Quantity|Delete/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('adds the entered decimal stock to the selected product and closes on success', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    renderWithProviders(<Inventory />)
    await userEvent.click(await screen.findByRole('button', { name: 'Add Quantity' }))
    const quantity = screen.getByRole('spinbutton', { name: 'Quantity' })
    await userEvent.type(quantity, '2.5')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/products/3/add-quantity?quantity=2.5'))
    expect(screen.queryByRole('spinbutton', { name: 'Quantity' })).not.toBeInTheDocument()
  })
})
