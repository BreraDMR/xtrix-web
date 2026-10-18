import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Loyalty from '../pages/Loyalty'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))

async function openProgramForm() {
  renderWithProviders(<Loyalty />)
  await userEvent.click(await screen.findByRole('button', { name: 'Create Program' }))
  fireEvent.submit(document.querySelector('form')!)
}

describe('loyalty program form errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
  })

  it('asks for a business first instead of an english alert', async () => {
    signIn({ id: 1, role: 'business_owner', business_id: null })
    vi.mocked(api.get).mockImplementation(routes({}))
    await openProgramForm()
    expect(await screen.findByRole('alert')).toHaveTextContent('Create your business first')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows what the API said when saving fails', async () => {
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({}))
    vi.mocked(api.post).mockRejectedValue(apiError(400, 'Program already exists'))
    await openProgramForm()
    expect(await screen.findByRole('alert')).toHaveTextContent('Program already exists')
    expect(api.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ business_id: 1 }))
    expect(vi.mocked(api.get).mock.calls.map((c) => c[0])).not.toContain('/businesses/me')
  })
})
