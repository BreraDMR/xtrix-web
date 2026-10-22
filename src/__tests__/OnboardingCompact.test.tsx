import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Checklist from '../components/onboarding/Checklist'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), patch: vi.fn() } }))
beforeEach(() => {
  vi.clearAllMocks(); resetStores(); signIn({ id: 8, role: 'business_owner' })
  vi.mocked(api.get).mockImplementation(routes({ '/onboarding/me': {
    persona: 'owner', welcome_dismissed: true, checklist_dismissed: false,
    completed_steps: 1, total_steps: 3, progress_percent: 33, next_step: 'service',
    steps: [
      { key: 'business', completed: true, available: true },
      { key: 'service', completed: false, available: true },
      { key: 'schedule', completed: false, available: true },
    ],
  } }))
})

it('shows the next action first and lets the user expand and collapse every setup step', async () => {
  renderWithProviders(<Checklist />)
  expect(await screen.findByRole('link', { name: 'Add service' })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Set schedule' })).not.toBeInTheDocument()
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
  const expand = screen.getByRole('button', { name: 'Show all steps' })
  expect(expand).toHaveAttribute('aria-expanded', 'false')
  await userEvent.click(expand)
  expect(screen.getByRole('link', { name: 'Set schedule' })).toBeInTheDocument()
  const collapse = screen.getByRole('button', { name: 'Collapse steps' })
  expect(collapse).toHaveAttribute('aria-expanded', 'true')
  await userEvent.click(collapse)
  expect(screen.queryByRole('link', { name: 'Set schedule' })).not.toBeInTheDocument()
  expect(api.patch).not.toHaveBeenCalled()
})
