import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitForm from '../components/VisitForm'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const jana = { id: 3, full_name: 'Jana Nováková', contact_phone: '+420777000111', language: 'cz', created_at: '2026-10-01T10:00:00' }

async function pickClient() {
  const option = await screen.findByRole('option', { name: 'Jana Nováková' })
  await userEvent.selectOptions(option.closest('select')!, option)
}

describe('VisitForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(routes({ '/clients/': [jana], '/services/': [] }) as any)
  })

  it('books the visit for the current user and shows the 409 reason', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.mocked(api.post).mockRejectedValue(apiError(409, 'This time is already booked for the specialist'))
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)

    await pickClient()
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

    await waitFor(() => expect(alert).toHaveBeenCalledWith('This time is already booked for the specialist'))
    expect(api.post).toHaveBeenCalledWith('/visits', expect.objectContaining({ client_id: 3, specialist_id: 7 }))
  })

  it('finds a client by name in your own list, no global search', async () => {
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
    await screen.findByRole('option', { name: 'Jana Nováková' })

    await userEvent.click(screen.getByRole('button', { name: /search client/i }))
    await userEvent.type(screen.getByPlaceholderText(/phone, email or client name/i), 'nová')

    expect(await screen.findByText('Jana Nováková')).toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls.map((c) => c[0])).not.toContain('/clients/search')
  })

  it('spends loyalty points on /loyalty/use-points with the client as a query param', async () => {
    vi.mocked(api.get).mockImplementation(
      routes({ '/clients/': [jana], '/services/': [], '/loyalty/balance/3': { points: 100, cashback: 0 } }) as any
    )
    vi.mocked(api.post).mockResolvedValue({ data: { id: 9 } })
    const onSuccess = vi.fn()
    renderWithProviders(<VisitForm onSuccess={onSuccess} onCancel={() => {}} />)

    await pickClient()
    // the form's labels aren't tied to their inputs, so go from the label text
    const pointsField = (await screen.findByText(/points to use/i)).parentElement!.querySelector('input')!
    await userEvent.type(pointsField, '10')
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith(
      '/loyalty/use-points',
      expect.objectContaining({ points_to_use: 10, visit_id: 9 }),
      { params: { client_id: 3 } }
    )
  })
})
