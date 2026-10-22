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
    vi.mocked(api.get).mockImplementation(routes({ '/clients/': [jana], '/services/': [] }))
  })

  it('can select a client beyond the first hundred records', async () => {
    const clients = Array.from({ length: 125 }, (_, index) => ({ ...jana, id: index + 1,
      full_name: `Guest ${String(index + 1).padStart(3, '0')}` }))
    vi.mocked(api.get).mockImplementation(routes({ '/clients/': clients, '/services/': [] }))
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
    const option = await screen.findByRole('option', { name: 'Guest 125' })
    await userEvent.selectOptions(option.closest('select')!, option)
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/visits/', expect.objectContaining({ client_id: 125 })))
  })

  it('books the visit for the current user and shows the 409 reason', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(409, 'This time is already booked for the specialist'))
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)

    await pickClient()
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('This time is already booked for the specialist')
    expect(api.post).toHaveBeenCalledWith('/visits/', expect.objectContaining({ client_id: 3, specialist_id: 7 }))
  })

  it('keeps the selected local time when submitting UTC', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 9 } })
    const start = new Date(2026, 6, 10, 14, 30)
    const { container } = renderWithProviders(<VisitForm initialDateStart={start} onSuccess={() => {}} onCancel={() => {}} />)
    expect(container.querySelector<HTMLInputElement>('[type="datetime-local"]')!.value).toBe('2026-07-10T14:30')
    await pickClient()
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/visits/', expect.objectContaining({ date_start: start.toISOString() })))
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
      routes({ '/clients/': [jana], '/services/': [], '/loyalty/balance/3': { points: 100, cashback: 0 } })
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

  describe('services in a chain', () => {
    const eva = { id: 9, full_name: 'Eva Svobodová' }
    const massage = { id: 5, name: 'Massage', duration_minutes: 60, price: 900, is_active: true, specialist_id: 9, specialist: eva }
    const facial = { id: 6, name: 'Facial', duration_minutes: 40, price: 500, is_active: true, specialist_id: 9, specialist: eva }
    const servicesTable = {
      '/clients/': [jana],
      '/services/': [massage, facial],
      '/services/5': { ...massage, specialists: [{ ...eva, email: 'eva@example.com' }] },
      '/services/6': { ...facial, specialists: [{ ...eva, email: 'eva@example.com' }] },
    }

    async function pickLegacyService() {
      const option = await screen.findByRole('option', { name: /Massage/ })
      await userEvent.selectOptions(option.closest('select')!, option)
    }

    it('submits ordered items instead of the legacy single-service fields', async () => {
      vi.mocked(api.get).mockImplementation(routes(servicesTable))
      vi.mocked(api.post).mockResolvedValue({ data: { id: 12 } })
      renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)

      await pickClient()
      await pickLegacyService()
      await userEvent.click(screen.getByRole('button', { name: /add service/i }))
      await userEvent.selectOptions(screen.getByLabelText('Service 2'), '6')
      await waitFor(() => expect(screen.getByLabelText('Specialist 2')).toHaveValue('9'))
      expect(screen.getByText(`${60 + 40} min`)).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/visits/', expect.objectContaining({
        client_id: 3,
        items: [
          { service_id: 5, specialist_id: 9 },
          { service_id: 6, specialist_id: 9 },
        ],
      })))
      const payload = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
      expect(payload).not.toHaveProperty('service_id')
      expect(payload).not.toHaveProperty('service_name')
      expect(payload).not.toHaveProperty('date_end')
      expect(payload).not.toHaveProperty('price')
    })

    it('refuses a chain with a row that has no service', async () => {
      vi.mocked(api.get).mockImplementation(routes(servicesTable))
      renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)

      await pickClient()
      await userEvent.click(screen.getByRole('button', { name: /add service/i }))
      await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Choose a service for every row')
      expect(api.post).not.toHaveBeenCalled()
    })

    it('keeps the chosen order when rows are moved', async () => {
      vi.mocked(api.get).mockImplementation(routes(servicesTable))
      vi.mocked(api.post).mockResolvedValue({ data: { id: 13 } })
      renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)

      await pickClient()
      await pickLegacyService()
      await userEvent.click(screen.getByRole('button', { name: /add service/i }))
      await userEvent.selectOptions(screen.getByLabelText('Service 2'), '6')
      await waitFor(() => expect(screen.getByLabelText('Specialist 2')).toHaveValue('9'))
      await userEvent.click(screen.getByRole('button', { name: 'Move up 2' }))
      await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/visits/', expect.objectContaining({
        items: [
          { service_id: 6, specialist_id: 9 },
          { service_id: 5, specialist_id: 9 },
        ],
      })))
    })

    it('loads an existing chain and updates it as items', async () => {
      vi.mocked(api.get).mockImplementation(routes({
        ...servicesTable,
        '/visits/21': {
          id: 21,
          client_id: 3,
          specialist_id: 9,
          date_start: '2030-05-06T08:00:00Z',
          date_end: '2030-05-06T09:40:00Z',
          status: 'planned',
          price: 1400,
          items: [
            { id: 101, position: 1, service_id: 5, service_name: 'Massage', specialist_id: 9, duration_minutes: 60, price: 900, date_start: '2030-05-06T08:00:00Z', date_end: '2030-05-06T09:00:00Z' },
            { id: 102, position: 2, service_id: 6, service_name: 'Facial', specialist_id: 9, duration_minutes: 40, price: 500, date_start: '2030-05-06T09:00:00Z', date_end: '2030-05-06T09:40:00Z' },
          ],
        },
      }))
      vi.mocked(api.put).mockResolvedValue({ data: { id: 21 } })
      renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)

      await waitFor(() => expect(screen.getByLabelText('Service 1')).toHaveValue('5'))
      expect(screen.getByLabelText('Service 2')).toHaveValue('6')
      await userEvent.click(screen.getByRole('button', { name: /update visit/i }))

      await waitFor(() => expect(api.put).toHaveBeenCalledWith('/visits/21', expect.objectContaining({
        items: [
          { service_id: 5, specialist_id: 9 },
          { service_id: 6, specialist_id: 9 },
        ],
      })))
    })
  })

  describe('specialist for the picked service', () => {
    const eva = { id: 9, full_name: 'Eva Svobodová' }
    const massage = { id: 5, name: 'Massage', duration_minutes: 60, price: 900, is_active: true, specialist_id: 9, specialist: eva }

    async function pickService() {
      const option = await screen.findByRole('option', { name: /Massage/ })
      await userEvent.selectOptions(option.closest('select')!, option)
    }

    it('lists the specialists of the service and picks the first one', async () => {
      vi.mocked(api.get).mockImplementation(routes({
        '/clients/': [jana],
        '/services/': [massage],
        '/services/5': { ...massage, specialist_ids: [9, 11], specialists: [{ ...eva, email: 'eva@example.com' }, { id: 11, full_name: 'Petr Novák' }] },
      }))
      renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
      await pickService()

      const first = await screen.findByRole('option', { name: 'Eva Svobodová (eva@example.com)' })
      expect(screen.getByRole('option', { name: 'Petr Novák' })).toHaveValue('11')
      expect(first.closest('select')).toHaveValue('9')
    })

    it("falls back to the service's own specialist by name", async () => {
      vi.mocked(api.get).mockImplementation(routes({
        '/clients/': [jana],
        '/services/': [massage],
        '/services/5': { ...massage, specialists: [] },
      }))
      renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
      await pickService()

      const option = await screen.findByRole('option', { name: 'Eva Svobodová' })
      expect(option.closest('select')).toHaveValue('9')
    })

    it('still names the specialist when the service details fail to load', async () => {
      vi.mocked(api.get).mockImplementation(routes({ '/clients/': [jana], '/services/': [massage] }))
      renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
      await pickService()

      const option = await screen.findByRole('option', { name: 'Eva Svobodová' })
      expect(option.closest('select')).toHaveValue('9')
    })
  })
})
