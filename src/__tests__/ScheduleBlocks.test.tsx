import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DateExceptions from '../components/schedules/DateExceptions'
import api from '../api/client'
import { renderWithProviders, resetStores, routes } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  vi.mocked(api.get).mockImplementation(routes({ '/schedules/exceptions': [], '/schedules/blocks': [] }))
  vi.mocked(api.post).mockResolvedValue({ data: { id: 1 } })
})

it.each([
  ['02:30', '04:00'],
  ['01:30', '02:30'],
])('rejects a nonexistent Prague wall time %s–%s before sending a block', async (start, end) => {
  renderWithProviders(<DateExceptions specialistId={7} timeZone="Europe/Prague" />)
  const card = (await screen.findByRole('heading', { name: 'Breaks and personal blocks' })).parentElement!
  fireEvent.change(within(card).getByLabelText('Date'), { target: { value: '2030-03-31' } })
  fireEvent.change(within(card).getByLabelText('Start'), { target: { value: start } })
  fireEvent.change(within(card).getByLabelText('End'), { target: { value: end } })
  await userEvent.click(within(card).getByRole('button', { name: 'Add block' }))
  expect(within(card).getByRole('alert')).toHaveTextContent('does not exist')
  expect(api.post).not.toHaveBeenCalled()
})

it('stores a block across the spring transition with its real elapsed duration', async () => {
  renderWithProviders(<DateExceptions specialistId={7} timeZone="Europe/Prague" />)
  const card = (await screen.findByRole('heading', { name: 'Breaks and personal blocks' })).parentElement!
  fireEvent.change(within(card).getByLabelText('Date'), { target: { value: '2030-03-31' } })
  fireEvent.change(within(card).getByLabelText('Start'), { target: { value: '01:30' } })
  fireEvent.change(within(card).getByLabelText('End'), { target: { value: '04:00' } })
  await userEvent.click(within(card).getByRole('button', { name: 'Add block' }))
  expect(api.post).toHaveBeenCalledWith('/schedules/blocks', {
    specialist_id: 7, start: '2030-03-31T00:30:00.000Z', end: '2030-03-31T02:00:00.000Z', reason: null,
  })
})
