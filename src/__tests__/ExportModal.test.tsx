import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
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
})
