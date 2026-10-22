import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ExportModal from '../components/ExportModal'
import { exportData } from '../utils/export'
import { renderWithProviders, resetStores } from '../test/render'

vi.mock('../utils/export', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/export')>()),
  exportData: vi.fn(),
}))

describe('ExportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('keeps the modal open with an inline error when the export fails', async () => {
    vi.mocked(exportData).mockRejectedValue(new Error('disk full'))
    const onClose = vi.fn()
    renderWithProviders(
      <ExportModal isOpen onClose={onClose} data={[{ name: 'Gel' }]} columns={[{ key: 'name', label: 'Name' }]} filename="products" />
    )
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Error during export. Please try again.')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('loads the complete selection before generating the file', async () => {
    const rows = Array.from({ length: 125 }, (_, id) => ({ id }))
    const loadData = vi.fn(async () => rows)
    renderWithProviders(<ExportModal isOpen onClose={vi.fn()} data={rows.slice(0, 20)}
      loadData={loadData} totalItems={125} columns={[{ key: 'id', label: 'ID' }]} filename="clients" />)
    expect(screen.getByText('125 items')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(loadData).toHaveBeenCalledOnce()
    expect(exportData).toHaveBeenCalledWith(expect.objectContaining({ data: rows }))
  })

  it('does not generate a partial file when a later page fails', async () => {
    renderWithProviders(<ExportModal isOpen onClose={vi.fn()} data={[{ id: 1 }]}
      loadData={async () => { throw new Error('Page 2 failed') }} totalItems={125}
      columns={[{ key: 'id', label: 'ID' }]} filename="clients" />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(exportData).not.toHaveBeenCalled()
  })

  it('cannot dismiss a running export through Escape, backdrop, Close or Cancel', async () => {
    let complete: (() => void) | undefined
    vi.mocked(exportData).mockImplementation(() => new Promise<void>(resolve => { complete = resolve }))
    const onClose = vi.fn()
    renderWithProviders(<ExportModal isOpen onClose={onClose} data={[{ id: 1 }]}
      columns={[{ key: 'id', label: 'ID' }]} filename="clients" reportTypes={['Visits', 'Finance']} />)
    expect(screen.getByRole('combobox', { name: 'Report Type' })).toHaveValue('Visits')
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    const dialog = screen.getByRole('dialog', { name: 'Export Data' })
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(fireEvent(dialog, new Event('cancel', { cancelable: true, bubbles: true }))).toBe(false)
    fireEvent.click(dialog, { clientX: -1, clientY: -1 })
    expect(onClose).not.toHaveBeenCalled()
    expect(dialog).toBeInTheDocument()
    expect(complete).toBeDefined()
    await act(async () => { complete?.() })
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
  })
})
