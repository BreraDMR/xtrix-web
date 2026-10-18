import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImportClientsModal from '../components/ImportClientsModal'
import * as XLSX from 'xlsx'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

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
    vi.mocked(api.get).mockResolvedValue({ data: { items: [] } })
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
})
