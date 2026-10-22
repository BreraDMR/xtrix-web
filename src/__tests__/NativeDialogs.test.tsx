import { afterEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState } from 'react'
import Modal from '../ui/Modal'
import SidePanel from '../ui/SidePanel'
import { renderWithProviders } from '../test/render'

afterEach(() => { document.body.style.overflow = ''; vi.restoreAllMocks() })

function Nested({ busy = false }: { busy?: boolean }) {
  const [panel, setPanel] = useState(false)
  const [report, setReport] = useState(false)
  const [exporting, setExporting] = useState(false)
  return <><button onClick={() => setPanel(true)}>Open client</button>
    {panel && <SidePanel title="Client" onClose={() => setPanel(false)}>
      <button onClick={() => setReport(true)}>Open report</button>
      {report && <Modal title="Report" onClose={() => setReport(false)}>
        <button onClick={() => setExporting(true)}>Open export</button>
        {exporting && <Modal title="Export" busy={busy} onClose={() => setExporting(false)}>Export choices</Modal>}
      </Modal>}
    </SidePanel>}
  </>
}

async function openStack() {
  await userEvent.click(screen.getByRole('button', { name: 'Open client' }))
  await userEvent.click(screen.getByRole('button', { name: 'Open report' }))
  await userEvent.click(screen.getByRole('button', { name: 'Open export' }))
}

function cancel(title: string) {
  return fireEvent(screen.getByRole('dialog', { name: title }), new Event('cancel', { cancelable: true, bubbles: true }))
}

it('cancels only the top dialog and restores each opener while keeping the shared scroll lock', async () => {
  document.body.style.overflow = 'auto'
  renderWithProviders(<Nested />)
  await openStack()
  expect(cancel('Client')).toBe(false)
  expect(screen.getByRole('dialog', { name: 'Client' })).toBeInTheDocument()
  expect(cancel('Export')).toBe(false)
  expect(screen.queryByRole('dialog', { name: 'Export' })).not.toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Report' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Open export' })).toHaveFocus()
  expect(document.body.style.overflow).toBe('hidden')
  cancel('Report')
  expect(screen.queryByRole('dialog', { name: 'Report' })).not.toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Client' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Open report' })).toHaveFocus()
  expect(document.body.style.overflow).toBe('hidden')
  cancel('Client')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Open client' })).toHaveFocus()
  expect(document.body.style.overflow).toBe('auto')
})

it('restores the original body policy and outside opener when the whole stack unmounts together', () => {
  document.body.style.overflow = 'scroll'
  const opener = document.createElement('button')
  document.body.append(opener)
  opener.focus()
  const show = vi.spyOn(HTMLDialogElement.prototype, 'showModal')
  const { unmount } = renderWithProviders(<SidePanel title="Client" onClose={vi.fn()}>
    <Modal title="Report" onClose={vi.fn()}><Modal title="Export" onClose={vi.fn()}>Data</Modal></Modal>
  </SidePanel>)
  const opened = show.mock.instances.map(element => (element as HTMLDialogElement).getAttribute('aria-labelledby'))
  expect(opened.slice(-3)).toEqual(['Client', 'Report', 'Export'].map(title => screen.getByRole('dialog', { name: title }).getAttribute('aria-labelledby')))
  expect(document.body.style.overflow).toBe('hidden')
  unmount()
  expect(document.body.style.overflow).toBe('scroll')
  expect(opener).toHaveFocus()
  opener.remove()
})

it('keeps a busy child open for cancel, backdrop and Close without dismissing its parent', async () => {
  renderWithProviders(<Nested busy />)
  await openStack()
  const child = screen.getByRole('dialog', { name: 'Export' })
  expect(within(child).getByRole('button', { name: 'Close' })).toBeDisabled()
  expect(cancel('Export')).toBe(false)
  fireEvent.click(child, { clientX: -1, clientY: -1 })
  expect(child).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Report' })).toBeInTheDocument()
  expect(document.body.style.overflow).toBe('hidden')
})

it('dismisses only the child on an outside backdrop click, including when dialogs are DOM-nested', async () => {
  renderWithProviders(<Nested />)
  await openStack()
  fireEvent.click(screen.getByRole('dialog', { name: 'Export' }), { clientX: -1, clientY: -1 })
  expect(screen.queryByRole('dialog', { name: 'Export' })).not.toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Report' })).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Client' })).toBeInTheDocument()
})

it('releases every lock after the StrictMode mount and cleanup cycle', () => {
  document.body.style.overflow = 'auto'
  const { unmount } = renderWithProviders(<StrictMode><Modal title="Export" onClose={vi.fn()}>Data</Modal></StrictMode>)
  expect(document.body.style.overflow).toBe('hidden')
  unmount()
  expect(document.body.style.overflow).toBe('auto')
})
