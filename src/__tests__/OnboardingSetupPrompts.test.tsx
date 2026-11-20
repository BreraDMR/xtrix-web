import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import Checklist from '../components/onboarding/Checklist'
import ServiceStep from '../components/onboarding/ServiceStep'
import StaffStep from '../components/onboarding/StaffStep'
import api from '../api/client'
import { WorkspaceAccessContext, type WorkspaceAccess } from '../hooks/useWorkspaceAccess'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() } }))

const access = (crm_mode: WorkspaceAccess['crm_mode']) => ({
  crm_mode, can_export: crm_mode === 'full', can_use_ai: crm_mode === 'full', can_manage_billing: true,
  checkout_available: false, pilot_mode: true,
}) as WorkspaceAccess

const state = (overrides: Record<string, unknown> = {}) => ({
  persona: 'owner', welcome_dismissed: true, checklist_dismissed: false, tour_completed: true,
  completed_steps: 2, total_steps: 4, progress_percent: 50, next_step: 'service', dismissed_hints: [],
  steps: [
    { key: 'business', completed: true, available: true },
    { key: 'staff', completed: true, available: true },
    { key: 'service', completed: false, available: true },
    { key: 'schedule', completed: false, available: true },
  ],
  ...overrides,
})

function serve(onboarding: Record<string, unknown>) {
  vi.mocked(api.get).mockImplementation(routes({ '/onboarding/me': onboarding, '/employees/': [] }))
}

function render(node: ReactNode, mode: WorkspaceAccess['crm_mode'] = 'full') {
  return renderWithProviders(<WorkspaceAccessContext.Provider value={access(mode)}>{node}</WorkspaceAccessContext.Provider>)
}

beforeEach(() => { vi.clearAllMocks(); resetStores(); localStorage.clear(); signIn({ id: 8, role: 'business_owner' }) })

it('offers the inline service and team forms only while the workspace can be edited', async () => {
  serve(state())
  const { unmount } = render(<><ServiceStep /><StaffStep /></>)
  expect(await screen.findByRole('button', { name: 'Add service' })).toBeInTheDocument()
  expect(await screen.findByRole('button', { name: 'Add master' })).toBeInTheDocument()
  unmount()

  for (const mode of ['read_only', 'blocked'] as const) {
    const view = render(<><ServiceStep /><StaffStep /></>, mode)
    // give both queries a moment to settle so a late render would still be caught
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(screen.queryByRole('button', { name: 'Add service' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add master' })).not.toBeInTheDocument()
    view.unmount()
  }
})

it('does not repeat the service prompt while the welcome card already points to setup', async () => {
  serve(state({ welcome_dismissed: false }))
  render(<ServiceStep />)
  await new Promise(resolve => setTimeout(resolve, 30))
  expect(screen.queryByRole('button', { name: 'Add service' })).not.toBeInTheDocument()
})

it('tells where hidden setup steps come back and links straight there', async () => {
  serve(state())
  render(<Checklist />)
  const back = await screen.findByRole('link', { name: 'Settings' })
  expect(back).toHaveAttribute('href', '/app/settings#settings-onboarding')
})
