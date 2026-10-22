import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import CalendarPage from '../pages/CalendarPage'
import api from '../api/client'
import { renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), patch: vi.fn() } }))
vi.mock('../hooks/useMyBusiness', () => ({ useMyBusiness: () => ({ data: { timezone: 'UTC' } }) }))
vi.mock('../components/calendar/StaffColumns', () => ({ default: () => <div>day grid</div> }))

const onboarding = { dismissed_hints: [], checklist: {}, completed: false }

function serve(total: number) {
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url === '/onboarding/me') return Promise.resolve({ data: onboarding })
    if (url !== '/visits/') return Promise.resolve({ data: [] })
    const params = config?.params as { date_from?: string; per_page?: number } | undefined
    const perPage = params?.per_page ?? 20
    // the shown day is always empty; the salon as a whole has `total` visits
    if (params?.date_from) return Promise.resolve({ data: { items: [], page: 1, per_page: perPage, pages: 0, total: 0 } })
    return Promise.resolve({ data: { items: [], page: 1, per_page: perPage, pages: Math.ceil(total / perPage), total } })
  })
}

beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'business_owner' }) })

it('greets a salon without any visits with the first-visit hint', async () => {
  serve(0)
  renderWithProviders(<CalendarPage />)
  expect(await screen.findByText('No visits yet')).toBeInTheDocument()
})

it('does not claim there are no visits when only the shown day is empty', async () => {
  serve(12)
  renderWithProviders(<CalendarPage />)
  expect(await screen.findByText('day grid')).toBeInTheDocument()
  await new Promise(resolve => setTimeout(resolve, 50))
  expect(screen.queryByText('No visits yet')).not.toBeInTheDocument()
})
