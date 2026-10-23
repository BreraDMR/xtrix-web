import { beforeEach, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Welcome from '../components/onboarding/Welcome'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), patch: vi.fn() } }))

const state = (businessDone: boolean, nextStep: string | null) => ({
  persona: 'owner', welcome_dismissed: false, checklist_dismissed: false,
  completed_steps: businessDone ? 1 : 0, total_steps: 3, progress_percent: businessDone ? 33 : 0, next_step: nextStep,
  steps: [
    { key: 'business', completed: businessDone, available: true },
    { key: 'service', completed: nextStep === null, available: true },
    { key: 'schedule', completed: nextStep === null, available: true },
  ],
})

beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 8, role: 'business_owner' }) })

it('asks a new owner to create the business', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/onboarding/me': state(false, 'business') }))
  renderWithProviders(<Welcome />)
  expect(await screen.findByText(/Create your business, add the first service/)).toBeInTheDocument()
})

it('does not ask an owner who already has a business to create one', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/onboarding/me': state(true, 'service') }))
  renderWithProviders(<Welcome />)
  expect(await screen.findByText(/Your business is set up/)).toBeInTheDocument()
  expect(screen.queryByText(/Create your business/)).not.toBeInTheDocument()
})

it('stays out of the way once every setup step is done', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/onboarding/me': { ...state(true, null), completed_steps: 3, progress_percent: 100 } }))
  const { container } = renderWithProviders(<Welcome />)
  await waitFor(() => expect(api.get).toHaveBeenCalled())
  await new Promise(resolve => setTimeout(resolve, 50))
  expect(container).toBeEmptyDOMElement()
})
