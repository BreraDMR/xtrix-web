import { useState } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientNotes from '../components/clients/ClientNotes'
import ClientTags from '../components/clients/ClientTags'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import type { ClientNoteOut, ClientProfileOut } from '../api/types'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
const savedNote: ClientNoteOut = { id: 7, client_id: 5, business_id: 1, author_id: 1,
  author_name: 'Team Member', body: 'Saved team note', created_at: '2026-10-22T10:00:00Z', updated_at: '2026-10-22T10:00:00Z' }
const savedProfile: ClientProfileOut = { client_id: 5, tags: ['VIP'], preferences: 'Saved preferences' }
const access: WorkspaceAccess = { crm_mode: 'full', can_export: true, can_use_ai: true,
  can_manage_billing: true, checkout_available: false, pilot_mode: false }
function Harness({ value }: { value?: WorkspaceAccess | null }) {
  const [context, setContext] = useState(value)
  return <>
    <button onClick={() => setContext({ ...access, crm_mode: 'read_only' })}>View only</button>
    <button onClick={() => setContext(access)}>Full access</button>
    <WorkspaceAccessContext.Provider value={context}>
      <section aria-label="Notes"><ClientNotes clientId={5} /></section>
      <section aria-label="Tags"><ClientTags clientId={5} /></section>
    </WorkspaceAccessContext.Provider>
  </>
}
const notes = () => within(screen.getByRole('region', { name: 'Notes' }))
const tags = () => within(screen.getByRole('region', { name: 'Tags' }))
beforeEach(() => {
  vi.clearAllMocks(); resetStores(); signIn({ id: 3, role: 'employee', business_id: 1 })
  vi.mocked(api.get).mockImplementation(url => {
    if (url === '/clients/5/notes') return Promise.resolve({ data: [savedNote] })
    if (url === '/clients/5/profile') return Promise.resolve({ data: savedProfile })
    return Promise.reject(apiError(404, 'Unexpected URL'))
  })
})

it.each(['read_only', 'blocked'] as const)('shows saved data with no mutation controls in %s mode', async crm_mode => {
  renderWithProviders(<Harness value={{ ...access, crm_mode }} />)
  expect(await notes().findByText('Saved team note')).toBeInTheDocument()
  expect(await tags().findByText('VIP')).toBeInTheDocument()
  expect(tags().getByText('Saved preferences')).toBeInTheDocument()
  expect(notes().queryByRole('textbox')).not.toBeInTheDocument()
  expect(tags().queryByRole('textbox')).not.toBeInTheDocument()
  for (const name of ['Add note', 'Edit', 'Delete', 'Save', 'Cancel']) expect(notes().queryByRole('button', { name })).not.toBeInTheDocument()
  expect(tags().queryByRole('button')).not.toBeInTheDocument()
  expect(api.post).not.toHaveBeenCalled(); expect(api.put).not.toHaveBeenCalled(); expect(api.delete).not.toHaveBeenCalled()
})


it.each([
  ['full', access], ['null legacy', null], ['undefined legacy', undefined],
] as const)('keeps existing editing controls for %s access, including limited staff', async (_name, value) => {
  renderWithProviders(<Harness value={value} />)
  await notes().findByText('Saved team note')
  await tags().findByText('VIP')
  expect(notes().getByRole('textbox', { name: 'A note only your team can see' })).toBeInTheDocument()
  expect(notes().getByRole('button', { name: 'Edit' })).toBeEnabled()
  expect(notes().getByRole('button', { name: 'Delete' })).toBeEnabled()
  expect(tags().getByRole('textbox', { name: 'Add a tag' })).toBeInTheDocument()
  expect(tags().getByRole('textbox', { name: 'Preferences' })).toHaveValue('Saved preferences')
})

it('rolls back a forbidden optimistic create and restores the limited-staff draft after viewing mode', async () => {
  let rejectSave: ((error: unknown) => void) | undefined
  vi.mocked(api.post).mockImplementation(() => new Promise((_resolve, reject) => { rejectSave = reject }))
  const { queryClient } = renderWithProviders(<Harness value={access} />)
  await notes().findByText('Saved team note')
  const draft = notes().getByRole('textbox', { name: 'A note only your team can see' })
  await userEvent.type(draft, 'Unsaved optimistic note')
  await userEvent.click(notes().getByRole('button', { name: 'Add note' }))
  await waitFor(() => expect(rejectSave).toBeDefined())
  expect(api.post).toHaveBeenCalledWith('/clients/5/notes', { body: 'Unsaved optimistic note' })
  expect(notes().getByText('Unsaved optimistic note')).toBeInTheDocument()
  expect(draft).toHaveValue('')
  await userEvent.click(screen.getByRole('button', { name: 'View only' }))
  expect(notes().getByText('Saved team note')).toBeInTheDocument()
  expect(notes().queryByText('Unsaved optimistic note')).not.toBeInTheDocument()
  expect(notes().queryByRole('textbox')).not.toBeInTheDocument()
  await act(async () => { rejectSave?.(apiError(403, 'Forbidden')) })
  await userEvent.click(screen.getByRole('button', { name: 'Full access' }))
  expect(notes().getByRole('textbox', { name: 'A note only your team can see' })).toHaveValue('Unsaved optimistic note')
  expect(notes().getByRole('alert')).toHaveTextContent('You do not have permission to change this client')
  expect(queryClient.getQueryData(['client-notes', 5])).toEqual([savedNote])
})

it('shows the saved body during a pending edit in viewing mode and preserves a forbidden edit draft', async () => {
  let rejectSave: ((error: unknown) => void) | undefined
  vi.mocked(api.put).mockImplementation(() => new Promise((_resolve, reject) => { rejectSave = reject }))
  const { queryClient } = renderWithProviders(<Harness value={access} />)
  await notes().findByText('Saved team note')
  await userEvent.click(notes().getByRole('button', { name: 'Edit' }))
  const editor = notes().getByRole('textbox', { name: 'Edit' })
  await userEvent.clear(editor)
  await userEvent.type(editor, 'Unconfirmed edit')
  await userEvent.click(notes().getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(rejectSave).toBeDefined())
  expect(api.put).toHaveBeenCalledWith('/clients/5/notes/7', { body: 'Unconfirmed edit' })
  await userEvent.click(screen.getByRole('button', { name: 'View only' }))
  expect(notes().getByText('Saved team note')).toBeInTheDocument()
  expect(notes().queryByText('Unconfirmed edit')).not.toBeInTheDocument()
  expect(notes().queryByRole('textbox')).not.toBeInTheDocument()
  await act(async () => { rejectSave?.(apiError(403, 'Forbidden')) })
  await userEvent.click(screen.getByRole('button', { name: 'Full access' }))
  expect(notes().getByRole('textbox', { name: 'Edit' })).toHaveValue('Unconfirmed edit')
  expect(notes().getByRole('alert')).toHaveTextContent('You do not have permission to change this client')
  expect(queryClient.getQueryData(['client-notes', 5])).toEqual([savedNote])
})

it('shows saved tags and preferences while viewing, then restores the dirty draft and its API 403', async () => {
  vi.mocked(api.put).mockRejectedValue(apiError(403, 'Forbidden'))
  renderWithProviders(<Harness value={access} />)
  await tags().findByText('VIP')
  await userEvent.type(tags().getByRole('textbox', { name: 'Add a tag' }), '  Morning  {Enter}')
  const preferences = tags().getByRole('textbox', { name: 'Preferences' })
  await userEvent.clear(preferences)
  await userEvent.type(preferences, 'Unsaved preferences')
  await userEvent.click(screen.getByRole('button', { name: 'View only' }))
  expect(tags().getByText('VIP')).toBeInTheDocument()
  expect(tags().getByText('Saved preferences')).toBeInTheDocument()
  expect(tags().queryByText('Morning')).not.toBeInTheDocument()
  expect(tags().queryByRole('textbox')).not.toBeInTheDocument()
  expect(tags().queryByRole('button')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Full access' }))
  expect(tags().getByText('Morning')).toBeInTheDocument()
  expect(tags().getByRole('textbox', { name: 'Preferences' })).toHaveValue('Unsaved preferences')
  await userEvent.click(tags().getByRole('button', { name: 'Save tags and preferences' }))
  expect(await tags().findByRole('alert')).toHaveTextContent('You do not have permission to change this client')
  expect(api.put).toHaveBeenCalledWith('/clients/5/profile', { tags: ['VIP', 'Morning'], preferences: 'Unsaved preferences' })
  expect(tags().getByText('Morning')).toBeInTheDocument()
  expect(tags().getByRole('button', { name: 'Save tags and preferences' })).toBeEnabled()
})

it('keeps delete confirmation and refreshes saved notes after a successful deletion', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  try {
    vi.mocked(api.delete).mockImplementation(() => {
      vi.mocked(api.get).mockResolvedValue({ data: [] })
      return Promise.resolve({ data: {} })
    })
    renderWithProviders(<Harness value={access} />)
    await notes().findByText('Saved team note')
    await userEvent.click(notes().getByRole('button', { name: 'Delete' }))
    expect(api.delete).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    await userEvent.click(notes().getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(notes().queryByText('Saved team note')).not.toBeInTheDocument())
    expect(api.delete).toHaveBeenCalledWith('/clients/5/notes/7')
    expect(confirm).toHaveBeenCalledTimes(2)
  } finally { confirm.mockRestore() }
})
