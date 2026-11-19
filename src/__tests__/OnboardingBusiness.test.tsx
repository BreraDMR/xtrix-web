import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BusinessForm from '../components/BusinessForm'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 8, role: 'business_owner' }) })
it('creates the first business in the selected IANA time zone and currency', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: { id: 1 } })
  const { container } = renderWithProviders(<BusinessForm onSuccess={vi.fn()} onCancel={vi.fn()} />)
  const zone = screen.getByRole('combobox', { name: 'Business time zone' })
  await userEvent.selectOptions(zone, 'America/New_York')
  fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'First salon' } })
  fireEvent.change(container.querySelectorAll('select')[1], { target: { value: 'CZK' } })
  await userEvent.click(screen.getByRole('button', { name: 'Create Business' }))
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/businesses/', expect.objectContaining({
    name: 'First salon', currency: 'CZK', timezone: 'America/New_York',
  })))
})
it('keeps the stored IANA zone when editing a business', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/4': {
    name: 'Existing salon', business_type: 'salon', currency: 'USD', timezone: 'Pacific/Chatham',
  } }))
  vi.mocked(api.put).mockResolvedValue({ data: { id: 4 } })
  renderWithProviders(<BusinessForm businessId={4} onSuccess={vi.fn()} onCancel={vi.fn()} />)
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Business time zone' })).toHaveValue('Pacific/Chatham'))
  await userEvent.click(screen.getByRole('button', { name: 'Update Business' }))
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/businesses/4', expect.objectContaining({ timezone: 'Pacific/Chatham' })))
})
