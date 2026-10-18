import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientForm from '../components/ClientForm'
import api from '../api/client'
import { useLocaleStore } from '../store/localeStore'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

describe('ClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 2, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(
      routes({ '/clients/1': { id: 1, full_name: 'John Doe', language: 'ru', created_at: '2026-10-01T10:00:00' } })
    )
  })

  it('creates a client with the language of their messages', async () => {
    useLocaleStore.setState({ locale: 'cz' })
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    const onSuccess = vi.fn()
    renderWithProviders(<ClientForm onSuccess={onSuccess} onCancel={() => {}} />)

    // a new client starts with the staff's UI language
    const language = screen.getByLabelText(/jazyk zpráv/i) as HTMLSelectElement
    expect(language.value).toBe('cz')

    await userEvent.type(screen.getByLabelText(/jméno a příjmení/i), 'John Doe')
    await userEvent.selectOptions(language, 'en')
    await userEvent.click(screen.getByRole('button', { name: /vytvořit klienta/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith('/clients/', expect.objectContaining({ full_name: 'John Doe', language: 'en' }))
  })

  it('does not collect medical details that the API cannot save', async () => {
    signIn({ id: 2, role: 'specialist' })
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    renderWithProviders(<ClientForm onSuccess={() => {}} onCancel={() => {}} />)
    expect(screen.queryByLabelText(/allergies|chronic|pregnancy|personal notes/i)).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Doe')
    await userEvent.click(screen.getByRole('button', { name: /create client/i }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/clients/', { full_name: 'Jane Doe', language: 'en' }))
  })

  it('keeps the saved language when editing', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} })
    renderWithProviders(<ClientForm clientId={1} onSuccess={() => {}} onCancel={() => {}} />)

    await waitFor(() => expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('John Doe'))
    expect((screen.getByLabelText(/language of messages/i) as HTMLSelectElement).value).toBe('ru')
    await userEvent.click(screen.getByRole('button', { name: /update client/i }))

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/clients/1', expect.objectContaining({ language: 'ru' })))
  })

  it('offers to open the client that already has this phone', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(409, 'This client is already in your list',
      { code: 'client_exists', existing_client_id: 17, matched_by: 'contact_phone' }))
    const onOpenExisting = vi.fn()
    const onSuccess = vi.fn()
    renderWithProviders(<ClientForm onSuccess={onSuccess} onCancel={() => {}} onOpenExisting={onOpenExisting} />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'John Again')
    await userEvent.type(screen.getByLabelText(/phone/i), '+420123456789')
    await userEvent.click(screen.getByRole('button', { name: /create client/i }))

    expect(await screen.findByText('A client with this phone number is already in your list.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /open the existing client/i }))
    expect(onOpenExisting).toHaveBeenCalledWith(17)
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
