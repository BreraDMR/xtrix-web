import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceForm from '../components/ServiceForm'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

describe('ServiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(
      routes({ '/employees/': [], '/users/': [{ id: 7, full_name: 'Test User', role: 'specialist' }] })
    )
  })

  it.each(['business_owner', 'specialist'])('includes the current %s without staff and selects them by default', async (role) => {
    signIn({ id: 7, role })
    vi.mocked(api.get).mockImplementation(routes({ '/employees/': [], '/users/': [] }))
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    renderWithProviders(<ServiceForm onSuccess={() => {}} onCancel={() => {}} />)
    const select = await screen.findByRole('combobox')
    expect(select).toHaveValue('7')
    expect(screen.getByRole('option', { name: /Test User/ })).toHaveValue('7')
    await userEvent.type(screen.getByPlaceholderText(/facial treatment/i), 'Massage')
    await userEvent.click(screen.getByRole('button', { name: /create service/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/services/', expect.objectContaining({ specialist_id: 7 })))
  })

  it('can assign a service to a specialist after the first hundred', async () => {
    signIn({ id: 7, role: 'business_owner' })
    const users = Array.from({ length: 125 }, (_, i) => ({ id: i + 100,
      full_name: `Specialist ${i + 1}`, email: `staff${i + 1}@example.cz`, role: 'specialist' }))
    vi.mocked(api.get).mockImplementation(routes({ '/employees/': [], '/users/': users }))
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    renderWithProviders(<ServiceForm onSuccess={() => {}} onCancel={() => {}} />)
    const option = await screen.findByRole('option', { name: 'Specialist 125 (staff125@example.cz)' })
    await userEvent.selectOptions(option.closest('select')!, option)
    await userEvent.type(screen.getByPlaceholderText(/facial treatment/i), 'Massage')
    await userEvent.click(screen.getByRole('button', { name: /create service/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/services/', expect.objectContaining({ specialist_id: 224 })))
  })

  it('shows a retry instead of a truncated specialist list', async () => {
    signIn({ id: 7, role: 'business_owner' })
    const users = Array.from({ length: 125 }, (_, i) => ({ id: i + 100,
      full_name: `Specialist ${i + 1}`, role: 'specialist' }))
    const read = routes({ '/employees/': [], '/users/': users })
    vi.mocked(api.get).mockImplementation((url, config) => {
      if ((config?.params as { page?: number } | undefined)?.page === 2) return Promise.reject(apiError(500, 'Later staff unavailable'))
      return read(url, config)
    })
    renderWithProviders(<ServiceForm onSuccess={() => {}} onCancel={() => {}} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
    expect(screen.queryByRole('option', { name: /Specialist 1 / })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Test User/ })).toBeInTheDocument()
    vi.mocked(api.get).mockImplementation(read)
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('option', { name: 'Specialist 125 ()' })).toBeInTheDocument()
  })

  it('keeps the current user available when staff loading fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Offline'))
    renderWithProviders(<ServiceForm onSuccess={() => {}} onCancel={() => {}} />)
    expect(await screen.findByRole('option', { name: /Test User/ })).toHaveValue('7')
  })

  it('does not list the current user twice', async () => {
    renderWithProviders(<ServiceForm onSuccess={() => {}} onCancel={() => {}} />)
    await screen.findByRole('option', { name: /Test User/ })
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('creates a service', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    const onSuccess = vi.fn()
    renderWithProviders(<ServiceForm onSuccess={onSuccess} onCancel={() => {}} />)

    await userEvent.type(screen.getByPlaceholderText(/facial treatment/i), 'Facial Treatment')
    const [duration, price] = screen.getAllByRole('spinbutton')
    await userEvent.clear(duration)
    await userEvent.type(duration, '90')
    await userEvent.clear(price)
    await userEvent.type(price, '150')
    await userEvent.click(screen.getByRole('button', { name: /create|save/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith(
      '/services/',
      expect.objectContaining({ name: 'Facial Treatment', duration_minutes: 90, price: 150, specialist_id: 7 })
    )
  })

  describe('description', () => {
    const stones = {
      id: 4, name: 'Hot stones', duration_minutes: 60, price: 900, is_active: true, specialist_id: 7,
      specialist: { id: 7, full_name: 'Test User' }, specialist_ids: [7], specialists: [{ id: 7, full_name: 'Test User' }],
      description: 'Basalt stones, 50 °C',
    }

    beforeEach(() => {
      vi.mocked(api.get).mockImplementation(routes({ '/employees/': [], '/users/': [], '/services/4': stones }))
      vi.mocked(api.put).mockResolvedValue({ data: {} })
    })

    it('sends the description of a new service', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: {} })
      renderWithProviders(<ServiceForm onSuccess={() => {}} onCancel={() => {}} />)
      await userEvent.type(screen.getByPlaceholderText(/facial treatment/i), 'Massage')
      await userEvent.type(screen.getByRole('textbox', { name: 'Description' }), 'Whole body, 60 min')
      await userEvent.click(screen.getByRole('button', { name: /create service/i }))
      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/services/', expect.objectContaining({ description: 'Whole body, 60 min' })))
    })

    it('loads the saved description and sends the edited one', async () => {
      const onSuccess = vi.fn()
      renderWithProviders(<ServiceForm serviceId={4} onSuccess={onSuccess} onCancel={() => {}} />)
      const field = await screen.findByDisplayValue('Basalt stones, 50 °C')
      await userEvent.clear(field)
      await userEvent.type(field, 'River stones')
      await userEvent.click(screen.getByRole('button', { name: /update service|save/i }))
      await waitFor(() => expect(onSuccess).toHaveBeenCalled())
      expect(api.put).toHaveBeenCalledWith('/services/4', expect.objectContaining({ description: 'River stones' }))
    })

    it('clears the description with null and sends only the fields the API takes', async () => {
      renderWithProviders(<ServiceForm serviceId={4} onSuccess={() => {}} onCancel={() => {}} />)
      await userEvent.clear(await screen.findByDisplayValue('Basalt stones, 50 °C'))
      await userEvent.click(screen.getByRole('button', { name: /update service|save/i }))
      await waitFor(() => expect(api.put).toHaveBeenCalled())
      const body = vi.mocked(api.put).mock.calls[0][1] as Record<string, unknown>
      expect(body.description).toBeNull()
      expect(Object.keys(body).sort()).toEqual(['buffer_after_minutes', 'buffer_before_minutes', 'description', 'duration_minutes', 'is_active', 'name', 'price', 'specialist_id', 'specialist_ids'])
    })
  })
})
