import { afterAll, beforeEach, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductTour from '../components/onboarding/ProductTour'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), patch: vi.fn() } }))
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
const state = {
  persona: 'solo', welcome_dismissed: true, tour_completed: false, tour_dismissed: false,
  checklist_dismissed: false, dismissed_hints: [], steps: [], next_step: 'service',
  completed_steps: 0, total_steps: 3, progress_percent: 0, onboarding_version: 1, tour_version: 1,
}
beforeEach(() => {
  vi.clearAllMocks(); resetStores(); signIn({ id: 8, role: 'specialist' })
  vi.mocked(api.get).mockImplementation(routes({ '/onboarding/me': state }))
})

it('uses a real modal, locks background scrolling and restores the opener after cancellation', async () => {
  document.body.style.overflow = 'auto'
  const trigger = document.createElement('button')
  document.body.append(trigger); trigger.focus()
  try {
    vi.mocked(api.patch).mockResolvedValue({ data: { ...state, tour_dismissed: true } })
    renderWithProviders(<ProductTour />)
    const dialog = await screen.findByRole('dialog')
    expect(show).toHaveBeenCalledOnce()
    expect(dialog.tagName).toBe('DIALOG')
    expect(document.body.style.overflow).toBe('hidden')
    await act(async () => { fireEvent(dialog, new Event('cancel', { cancelable: true })) })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(api.patch).toHaveBeenCalledWith('/onboarding/me', { tour_dismissed: true })
    expect(document.body.style.overflow).toBe('auto')
    expect(trigger).toHaveFocus()
  } finally { trigger.remove(); document.body.style.overflow = '' }
})

it('keeps a failed dismissal open and lets the user retry with Escape', async () => {
  vi.mocked(api.patch).mockRejectedValueOnce(apiError(503, 'Try again'))
    .mockResolvedValueOnce({ data: { ...state, tour_dismissed: true } })
  renderWithProviders(<ProductTour />)
  const dialog = await screen.findByRole('dialog')
  await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Try again')
  expect(dialog).toBeVisible()
  await act(async () => { fireEvent(dialog, new Event('cancel', { cancelable: true })) })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(api.patch).toHaveBeenCalledTimes(2)
})

it('moves with arrow keys and only completes at the final step', async () => {
  vi.mocked(api.patch).mockResolvedValue({ data: { ...state, tour_completed: true } })
  renderWithProviders(<ProductTour />)
  const dialog = await screen.findByRole('dialog')
  fireEvent.keyDown(dialog, { key: 'ArrowRight' })
  expect(screen.getByRole('heading', { name: 'Clients keeps cards and visit history.' })).toBeVisible()
  fireEvent.keyDown(dialog, { key: 'ArrowLeft' })
  expect(screen.getByRole('heading', { name: 'Dashboard shows revenue, visits and clients at a glance.' })).toBeVisible()
  expect(api.patch).not.toHaveBeenCalled()
  for (let i = 0; i < 4; i++) fireEvent.keyDown(dialog, { key: 'ArrowRight' })
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(api.patch).toHaveBeenCalledWith('/onboarding/me', { tour_completed: true })
})
