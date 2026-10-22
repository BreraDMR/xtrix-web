import { afterAll, afterEach, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import SidePanel from '../ui/SidePanel'
import { renderWithProviders } from '../test/render'

const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
const show = vi.fn(function(this: HTMLDialogElement) { this.open = true })
const close = vi.fn(function(this: HTMLDialogElement) { this.open = false })
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: show })
Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: close })
afterAll(() => {
  if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

afterEach(() => { show.mockClear(); close.mockClear(); document.body.style.overflow = '' })

function Example() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Open record</button>{open && <SidePanel title="Record" onClose={() => setOpen(false)}><input aria-label="Name" /></SidePanel>}</>
}

it('restores the opener and the existing scroll policy after an Escape request', async () => {
  document.body.style.overflow = 'auto'
  renderWithProviders(<Example />)
  const trigger = screen.getByRole('button', { name: 'Open record' })
  await userEvent.click(trigger)
  expect(show).toHaveBeenCalledOnce()
  expect(document.body.style.overflow).toBe('hidden')
  await act(async () => { fireEvent(screen.getByRole('dialog', { name: 'Record' }), new Event('cancel', { cancelable: true })) })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(close).toHaveBeenCalledOnce()
  expect(document.body.style.overflow).toBe('auto')
  expect(trigger).toHaveFocus()
})

it('does not treat a click inside the panel as a backdrop dismissal', async () => {
  renderWithProviders(<Example />)
  await userEvent.click(screen.getByRole('button', { name: 'Open record' }))
  await userEvent.click(screen.getByRole('textbox', { name: 'Name' }))
  expect(screen.getByRole('dialog', { name: 'Record' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
