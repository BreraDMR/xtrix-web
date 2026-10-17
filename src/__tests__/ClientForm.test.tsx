import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientForm from '../components/ClientForm'
import api from '../api/client'
import { useLocaleStore } from '../store/localeStore'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

describe('ClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 2, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(
      routes({ '/clients/1': { id: 1, full_name: 'John Doe', language: 'ru', created_at: '2026-10-01T10:00:00' } }) as any
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

    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe')
    await userEvent.selectOptions(language, 'en')
    await userEvent.click(screen.getByRole('button', { name: /create client/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(api.post).toHaveBeenCalledWith('/clients', expect.objectContaining({ full_name: 'John Doe', language: 'en' }))
  })

  it('keeps the saved language when editing', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} })
    renderWithProviders(<ClientForm clientId={1} onSuccess={() => {}} onCancel={() => {}} />)

    await waitFor(() => expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('John Doe'))
    expect((screen.getByLabelText(/language of messages/i) as HTMLSelectElement).value).toBe('ru')
    await userEvent.click(screen.getByRole('button', { name: /update client/i }))

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/clients/1', expect.objectContaining({ language: 'ru' })))
  })
})
