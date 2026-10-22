import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportClientsModal from '../components/ImportClientsModal'
import * as XLSX from 'xlsx'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

function sheet(rows: string[][]) {
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), 'Clients')
  const bytes = XLSX.write(book, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  const file = new File([bytes], 'clients.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  // jsdom's File has no arrayBuffer()
  Object.defineProperty(file, 'arrayBuffer', { value: async () => bytes })
  return file
}

describe('ImportClientsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 2, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({ '/clients/': [] }))
  })

  it('lists rows the API already has and offers to open that client', async () => {
    vi.mocked(api.post).mockImplementation(((_url: string, body: { full_name: string }) => body.full_name === 'Old Friend'
      ? Promise.reject(apiError(409, 'This client is already in your list', { code: 'client_exists', existing_client_id: 42, matched_by: 'contact_phone' }))
      : Promise.resolve({ data: { id: 7 } })) as typeof api.post)
    const onOpenClient = vi.fn()
    const { container } = renderWithProviders(<ImportClientsModal isOpen onClose={() => {}} onOpenClient={onOpenClient} />)
    await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement,
      sheet([['Name', 'Phone'], ['New Person', '+420111222333'], ['Old Friend', '+420123456789']]))
    await userEvent.click(await screen.findByRole('button', { name: /import \(2\)/i }))

    expect(await screen.findByText(/already in your list/i)).toBeInTheDocument()
    expect(screen.queryByText(/this client is already in your list/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^open$/i }))
    expect(onOpenClient).toHaveBeenCalledWith(42)
  })

  it('imports both valid rows after an invalid first row without submitting that row', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 7 } })
    const confirmImport = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      const { container } = renderWithProviders(<ImportClientsModal isOpen onClose={() => {}} />)
      await act(async () => {
        await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement,
          sheet([['Name', 'Email'], ['Invalid Person', 'bad-email'], ['Second Person', 'second@example.cz'], ['Third Person', 'third@example.cz']]))
      })
      const importButton = await screen.findByRole('button', { name: /import \(2\)/i })
      await act(async () => { await userEvent.click(importButton) })

      await waitFor(() => expect(api.post).toHaveBeenCalledTimes(2))
      expect(confirmImport).toHaveBeenCalledOnce()
      expect(vi.mocked(api.post).mock.calls.map(([, body]) => body)).toEqual([
        { full_name: 'Second Person', contact_phone: undefined, contact_email: 'second@example.cz' },
        { full_name: 'Third Person', contact_phone: undefined, contact_email: 'third@example.cz' },
      ])
    } finally {
      confirmImport.mockRestore()
    }
  })

  it('checks normalized contacts beyond the first hundred before showing the first preview', async () => {
    const clients = Array.from({ length: 125 }, (_, i) => ({ id: i + 1,
      full_name: `Guest ${i + 1}`, contact_email: `GUEST${i + 1}@EXAMPLE.CZ`, contact_phone: i === 124 ? '+420 123 456 789' : undefined }))
    vi.mocked(api.get).mockImplementation(routes({ '/clients/': clients }))
    vi.mocked(api.post).mockResolvedValue({ data: { id: 999 } })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      const { container } = renderWithProviders(<ImportClientsModal isOpen onClose={() => {}} />)
      await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement,
        sheet([['Name', 'Phone', 'Email'], ['Duplicate email', '', 'guest125@example.cz'],
          ['Duplicate phone', '+420123456789', ''], ['New Person', '', 'new@example.cz']]))
      await userEvent.click(await screen.findByRole('button', { name: /import \(1\)/i }))
      await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1))
      expect(api.post).toHaveBeenCalledWith('/clients/', { full_name: 'New Person', contact_phone: undefined, contact_email: 'new@example.cz' })
    } finally { confirm.mockRestore() }
  })

  it('detects duplicate contacts inside the sheet and imports only their first row', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 999 } })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      const { container } = renderWithProviders(<ImportClientsModal isOpen onClose={() => {}} />)
      await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement,
        sheet([['Name', 'Phone', 'Email'], ['First Person', '+420123456789', 'first@example.cz'],
          ['Repeated phone', '+420 123 456 789', ''], ['Repeated email', '', 'FIRST@example.cz']]))
      await userEvent.click(await screen.findByRole('button', { name: /import \(1\)/i }))
      await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1))
      expect(api.post).toHaveBeenCalledWith('/clients/', { full_name: 'First Person', contact_phone: '+420123456789', contact_email: 'first@example.cz' })
    } finally { confirm.mockRestore() }
  })

  it('keeps a valid later contact when its earlier row is invalid', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 999 } })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      const { container } = renderWithProviders(<ImportClientsModal isOpen onClose={() => {}} />)
      await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement,
        sheet([['Name', 'Phone', 'Email'], ['Bad row', '+420123456789', 'bad-email'],
          ['Good row', '+420123456789', 'good@example.cz']]))
      await userEvent.click(await screen.findByRole('button', { name: /import \(1\)/i }))
      await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1))
      expect(api.post).toHaveBeenCalledWith('/clients/', { full_name: 'Good row', contact_phone: '+420123456789', contact_email: 'good@example.cz' })
    } finally { confirm.mockRestore() }
  })

  it('does not offer import when a later directory page cannot be checked', async () => {
    const clients = Array.from({ length: 125 }, (_, i) => ({ id: i + 1, full_name: `Guest ${i + 1}` }))
    const read = routes({ '/clients/': clients })
    vi.mocked(api.get).mockImplementation((url, config) => {
      if ((config?.params as { page?: number } | undefined)?.page === 2) return Promise.reject(apiError(500, 'Unavailable'))
      return read(url, config)
    })
    const { container } = renderWithProviders(<ImportClientsModal isOpen onClose={() => {}} />)
    await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement,
      sheet([['Name', 'Email'], ['New Person', 'new@example.cz']]))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
    expect(screen.queryByRole('button', { name: /import \(/i })).not.toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('says so inline when the sheet has no name column and lets them pick another file', async () => {
    const { container } = renderWithProviders(<ImportClientsModal isOpen onClose={() => {}} />)
    await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement,
      sheet([['Phone', 'Email'], ['+420111222333', 'a@b.cz']]))
    expect(await screen.findByRole('alert')).toHaveTextContent('Name column not found')
    expect(container.querySelector('input[type="file"]')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})
