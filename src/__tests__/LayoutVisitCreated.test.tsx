import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest'
// DES-08: after a visit is created from the header, say so and offer to open it
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  default: { get: vi.fn(), post: vi.fn() },
}))
// the fake form saves at once and hands back the saved visit, like the real one does
vi.mock('../components/VisitForm', () => ({ default: ({ visitId, onSuccess }: { visitId?: number; onSuccess: (visit?: unknown) => void }) =>
  <div><p>{visitId ? `Editing visit ${visitId}` : 'Creating a visit'}</p>
    <button onClick={() => onSuccess({ id: 40, client_id: 3, client_name: 'Jana Nováková', date_start: '2030-03-04T10:00:00Z', status: 'planned' })}>Save fixture</button></div> }))

// jsdom has no modal dialogs, the side panel only needs open/close
const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true } })
Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false } })
afterAll(() => {
  if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})
afterEach(() => { document.body.style.overflow = '' })

function renderLayout() {
  return renderWithProviders(
    <MemoryRouter initialEntries={['/app/clients']}>
      <Routes>
        <Route path="/app" element={<Layout />}>
          <Route index element={<h1>Dashboard screen</h1>} />
          <Route path="clients" element={<h1>Clients screen</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
    { router: false },
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  resetStores()
  signIn({ id: 5, role: 'business_owner' })
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': null }))
})

it('confirms a created visit with its client and time and can open it again', async () => {
  renderLayout()
  expect(await screen.findByRole('heading', { name: 'Clients screen' })).toBeInTheDocument()
  await userEvent.click(await within(screen.getByRole('banner')).findByRole('button', { name: 'New Visit' }))
  await userEvent.click(within(screen.getByRole('dialog', { name: 'New Visit' })).getByRole('button', { name: 'Save fixture' }))

  const notice = await screen.findByRole('status', { name: 'Visit created' })
  expect(notice).toHaveTextContent('Jana Nováková')
  expect(notice).toHaveTextContent('Mar 4, 2030')
  await userEvent.click(within(notice).getByRole('button', { name: 'Open visit' }))
  expect(within(screen.getByRole('dialog', { name: 'Edit visit' })).getByText('Editing visit 40')).toBeInTheDocument()
})

it('lets the created-visit notice be dismissed', async () => {
  renderLayout()
  expect(await screen.findByRole('heading', { name: 'Clients screen' })).toBeInTheDocument()
  await userEvent.click(await within(screen.getByRole('banner')).findByRole('button', { name: 'New Visit' }))
  await userEvent.click(within(screen.getByRole('dialog', { name: 'New Visit' })).getByRole('button', { name: 'Save fixture' }))
  const notice = await screen.findByRole('status', { name: 'Visit created' })
  await userEvent.click(within(notice).getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('status', { name: 'Visit created' })).not.toBeInTheDocument()
})
