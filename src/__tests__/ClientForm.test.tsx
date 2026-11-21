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

  it('saves several phones and an email with the chosen primary', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} })
    renderWithProviders(<ClientForm onSuccess={() => {}} onCancel={() => {}} />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jana')
    await userEvent.type(screen.getByLabelText('Phone 1'), '+420777000111')
    await userEvent.click(screen.getByRole('button', { name: '+ Another number' }))
    await userEvent.type(screen.getByLabelText('Phone 2'), '+420777000222')
    await userEvent.type(screen.getAllByLabelText(/^label/i)[1], 'work')
    await userEvent.click(screen.getAllByRole('radio', { name: 'Primary' })[1])
    await userEvent.type(screen.getByLabelText('Email 1'), 'jana@example.com')
    await userEvent.click(screen.getByRole('button', { name: /create client/i }))

    await waitFor(() => expect(api.post).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith('/clients/', expect.objectContaining({
      contacts: [
        { kind: 'phone', value: '+420777000111', label: null, is_primary: false, notify: true },
        { kind: 'phone', value: '+420777000222', label: 'work', is_primary: true, notify: true },
        { kind: 'email', value: 'jana@example.com', label: null, is_primary: true, notify: true },
      ],
    }))
    expect(vi.mocked(api.post).mock.calls[0][1]).not.toHaveProperty('contact_phone')
  })

  it('stops at five numbers and catches a number typed twice', async () => {
    renderWithProviders(<ClientForm onSuccess={() => {}} onCancel={() => {}} />)
    const add = screen.getByRole('button', { name: '+ Another number' })
    for (let i = 0; i < 4; i++) await userEvent.click(add)
    expect(screen.getByLabelText('Phone 5')).toBeInTheDocument()
    expect(add).toBeDisabled()
    expect(screen.getByText('Up to 5 numbers per client')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/full name/i), 'Jana')
    await userEvent.type(screen.getByLabelText('Phone 1'), '+420777000111')
    await userEvent.type(screen.getByLabelText('Phone 2'), '+420 777 000 111')
    await userEvent.click(screen.getByRole('button', { name: /create client/i }))
    expect(await screen.findByText('This contact is already in the list')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('loads every contact of the card for editing and sends the whole list back', async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/clients/1': {
      id: 1, full_name: 'John Doe', language: 'ru', created_at: '2026-10-01T10:00:00',
      contact_phone: '+420777000111', contact_email: null,
      contacts: [
        { id: 1, kind: 'phone', value: '+420777000111', label: null, is_primary: true, notify: true, created_at: '2026-10-01T10:00:00' },
        { id: 2, kind: 'phone', value: '+420777000222', label: 'mum', is_primary: false, notify: false, created_at: '2026-10-01T10:00:00' },
      ],
    } }))
    vi.mocked(api.put).mockResolvedValue({ data: {} })
    renderWithProviders(<ClientForm clientId={1} onSuccess={() => {}} onCancel={() => {}} />)

    await waitFor(() => expect((screen.getByLabelText('Phone 2') as HTMLInputElement).value).toBe('+420777000222'))
    await userEvent.click(screen.getByRole('button', { name: 'Remove: Phone 1' }))
    await userEvent.click(screen.getByRole('button', { name: /update client/i }))

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/clients/1', expect.objectContaining({
      contacts: [{ kind: 'phone', value: '+420777000222', label: 'mum', is_primary: true, notify: false }],
    })))
  })

  it('can create a family member who shares the phone', async () => {
    vi.mocked(api.post)
      .mockRejectedValueOnce(apiError(409, 'This client is already in your list',
        { code: 'client_exists', existing_client_id: 17, matched_by: 'contact_phone' }))
      .mockResolvedValueOnce({ data: {} })
    const onSuccess = vi.fn()
    renderWithProviders(<ClientForm onSuccess={onSuccess} onCancel={() => {}} onOpenExisting={() => {}} />)
    await userEvent.type(screen.getByLabelText(/full name/i), 'Kid')
    await userEvent.type(screen.getByLabelText('Phone 1'), '+420123456789')
    await userEvent.click(screen.getByRole('button', { name: /create client/i }))
    await userEvent.click(await screen.findByRole('button', { name: /create anyway/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(api.post).toHaveBeenLastCalledWith('/clients/', expect.objectContaining({ allow_shared_contact: true }))
  })
})
