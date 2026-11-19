import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Schedule from '../pages/Schedule'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'business_owner' }) })

it('does not edit hours in a fallback UTC zone when the business failed to load, and retries', async () => {
  let failed = true
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url === '/businesses/me' && failed) return Promise.reject(apiError(503, 'Unavailable'))
    return routes({ '/businesses/me': { id: 1, timezone: 'Europe/Prague' }, '/employees/': [], '/schedules/work': [] })(url, config)
  })
  renderWithProviders(<Schedule />)
  const retry = await screen.findByRole('button', { name: 'Retry' })
  expect(screen.queryByRole('heading', { name: 'Monday' })).not.toBeInTheDocument()
  expect(screen.queryByText('UTC')).not.toBeInTheDocument()
  failed = false
  await userEvent.click(retry)
  expect(await screen.findByRole('heading', { name: 'Monday' })).toBeVisible()
  expect(screen.getByText('Europe/Prague')).toBeVisible()
})
