import { beforeEach, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import ExportButton from '../components/ExportButton'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()), default: { get: vi.fn(), post: vi.fn() },
}))
const access = { crm_mode: 'full', trial_end: '2026-10-28T12:00:00Z', read_only_until: '2026-10-31T12:00:00Z', can_export: true, can_use_ai: true, can_manage_billing: true, checkout_available: false, pilot_mode: true, reason: null }
const page = vi.fn(() => <><h1>Client records</h1><button>Next week</button><input aria-label="Search clients" /><ExportButton data={[{ name: 'Jane' }]} columns={[{ key: 'name', label: 'Name' }]} filename="clients" /></>)
const billing = vi.fn(() => <h1>Billing page</h1>)
function mount(path = '/app/clients') {
  const Page = page
  const Billing = billing
  return renderWithProviders(<MemoryRouter initialEntries={[path]}><Routes><Route path="/app" element={<Layout />}><Route path="clients" element={<Page />} /><Route path="campaigns" element={<Page />} /><Route path="subscription" element={<Billing />} /></Route></Routes></MemoryRouter>, { router: false })
}
function setupAccess(mode: string) {
  vi.mocked(api.get).mockImplementation(routes({ '/subscriptions/access': { ...access, crm_mode: mode, can_export: mode === 'full', can_use_ai: mode === 'full' }, '/businesses/me': null, '/offers': { offers: [], version: 'pilot' } }))
}
beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 5, role: 'business_owner' }); setupAccess('full') })
it('keeps core workspace usable during trial and hides unavailable modules', async () => {
  mount()
  expect(await screen.findByRole('heading', { name: 'Client records' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Next week' })).toBeEnabled()
  expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Campaigns' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Questionnaires' })).not.toBeInTheDocument()
})
it('keeps viewing controls but removes exports during the three-day viewing period', async () => {
  setupAccess('read_only')
  mount()
  expect(await screen.findByRole('heading', { name: 'Client records' })).toBeInTheDocument()
  // paging, search and calendar navigation are part of viewing; the API refuses every change
  expect(screen.getByRole('button', { name: 'Next week' })).toBeEnabled()
  expect(screen.getByRole('textbox', { name: 'Search clients' })).toBeEnabled()
  expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument()
  expect(screen.getByText(/viewing is available until/i)).toBeInTheDocument()
})
it('does not mount private data after viewing ends and still exposes billing', async () => {
  setupAccess('blocked')
  mount()
  expect(await screen.findByText(/access to workspace data is paused/i)).toBeInTheDocument()
  expect(page).not.toHaveBeenCalled()
  expect(api.get).not.toHaveBeenCalledWith('/businesses/me')
  expect(screen.getByText(/online payment is not connected/i)).toBeInTheDocument()
  expect(api.post).not.toHaveBeenCalled()
})
it('allows billing even when data access is blocked', async () => {
  setupAccess('blocked')
  mount('/app/subscription')
  expect(await screen.findByRole('heading', { name: 'Billing page' })).toBeInTheDocument()
})
it('blocks a direct campaign URL in pilot mode', async () => {
  mount('/app/campaigns')
  expect(await screen.findByText('This feature is not available in the pilot yet.')).toBeInTheDocument()
  expect(page).not.toHaveBeenCalled()
})
it('fails closed if access cannot be checked', async () => {
  vi.mocked(api.get).mockRejectedValue(apiError(503, 'Unavailable'))
  mount()
  await screen.findByRole('alert')
  await waitFor(() => expect(page).not.toHaveBeenCalled())
})
