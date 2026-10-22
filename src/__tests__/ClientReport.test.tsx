import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import ClientPersonalReportModal from '../components/ClientPersonalReportModal'
import SidePanel from '../ui/SidePanel'
import api from '../api/client'
import type { ClientOut } from '../api/types'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

const client: ClientOut = {
  id: 5,
  full_name: 'Jane Doe',
  contact_phone: '+420777000111',
  contact_email: 'jane@example.com',
  birth_date: '1990-04-15',
  gender: 'female',
  language: 'en',
  created_at: '2026-01-01T10:00:00Z',
}

describe('Client personal report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner' })
    vi.mocked(api.get).mockImplementation(routes({
      '/clients/5': client,
      '/businesses/me': { id: 1, currency: 'EUR' },
    }))
  })

  it('shows the birth date the API sends and only the fields it has', async () => {
    renderWithProviders(<ClientPersonalReportModal isOpen onClose={() => {}} clientId={5} />)
    const table = await screen.findByRole('table')
    const headers = within(table).getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['Name', 'Phone', 'Email', 'Date of Birth', 'Gender'])
    expect(within(table).getByText(new Date(1990, 3, 15).toLocaleDateString())).toBeInTheDocument()
  })

  it('closes the real report and export one at a time inside a client panel', async () => {
    function ClientPanel() {
      const [panel, setPanel] = useState(false)
      const [report, setReport] = useState(false)
      return <><button onClick={() => setPanel(true)}>Open client</button>
        {panel && <SidePanel title="Client record" onClose={() => setPanel(false)}>
          <button onClick={() => setReport(true)}>Personal report</button>
          <ClientPersonalReportModal isOpen={report} clientId={5} onClose={() => setReport(false)} />
        </SidePanel>}
      </>
    }
    document.body.style.overflow = 'auto'
    renderWithProviders(<ClientPanel />)
    await userEvent.click(screen.getByRole('button', { name: 'Open client' }))
    await userEvent.click(screen.getByRole('button', { name: 'Personal report' }))
    await screen.findByRole('table')
    const panel = screen.getByRole('dialog', { name: 'Client record' })
    const report = screen.getByRole('dialog', { name: 'Personal Report - Jane Doe' })
    expect(within(report).getByRole('combobox', { name: 'Select Report Type' })).toHaveValue('profile')
    const exportTrigger = within(report).getByRole('button', { name: /Export.*Print/ })
    await userEvent.click(exportTrigger)
    const exporter = screen.getByRole('dialog', { name: 'Export Data' })
    fireEvent(exporter, new Event('cancel', { cancelable: true, bubbles: true }))
    expect(exporter).not.toBeInTheDocument()
    expect(report).toBeInTheDocument()
    expect(panel).toBeInTheDocument()
    expect(exportTrigger).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent(report, new Event('cancel', { cancelable: true, bubbles: true }))
    expect(report).not.toBeInTheDocument()
    expect(panel).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Personal report' })).toHaveFocus()
    await userEvent.click(within(panel).getByRole('button', { name: 'Close' }))
    expect(panel).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open client' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })
})
