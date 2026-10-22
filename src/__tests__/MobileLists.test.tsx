import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Visits from '../pages/Visits'
import Employees from '../pages/Employees'
import { useLocaleStore } from '../store/localeStore'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

const fullName = 'Jana Nováková'

describe('responsive list cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'business_owner' })
  })

  it('keeps every visit field in one labelled card and a single working edit action', async () => {
    useLocaleStore.setState({ locale: 'cz' })
    vi.mocked(api.get).mockImplementation(routes({
      '/visits/': { items: [{ id: 1, client_id: 3, client_name: fullName, specialist_id: 7, date_start: '2026-10-18T10:00:00Z', status: 'planned', price: 20 }], page: 1, per_page: 20, pages: 1, total: 1 },
      '/clients/': [{ id: 3, full_name: fullName }], '/businesses/me': { currency: 'EUR' },
      '/visits/1': { id: 1, client_id: 3, date_start: '2026-10-18T10:00:00Z', date_end: '2026-10-18T11:00:00Z', status: 'planned' },
      '/services/': [],
    }) as never)
    renderWithProviders(<Visits />)
    const row = (await screen.findByText(fullName)).closest('tr')!
    expect(row.closest('table')).toHaveClass('responsive-card-table')
    expect(Array.from(row.querySelectorAll('td')).map(cell => cell.dataset.label)).toEqual([
      'Datum', 'Klient', 'Služba', 'Stav', 'Cena', 'Akce',
    ])
    expect(within(row).getAllByRole('button')).toHaveLength(1)
    await userEvent.click(within(row).getByRole('button'))
    expect(await screen.findByRole('button', { name: /zrušit/i })).toBeInTheDocument()
    await waitFor(() => expect(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!.value).toContain('2026-10-18'))
  })

  it('keeps employee details and actions in one labelled card', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/employees/': [{ id: 2, employee_user: { full_name: fullName, email: 'jana@example.cz' }, position: 'Stylist', is_active: true, commission_percentage: 15, base_salary: 1500 }],
      '/businesses/me': { currency: 'EUR' },
    }) as never)
    renderWithProviders(<Employees />)
    const row = (await screen.findByText(fullName)).closest('tr')!
    expect(row.closest('table')).toHaveClass('responsive-card-table')
    expect(Array.from(row.querySelectorAll('td')).every(cell => Boolean(cell.dataset.label))).toBe(true)
    expect(within(row).getByText('jana@example.cz')).toBeInTheDocument()
    expect(within(row).getAllByRole('button')).toHaveLength(3)
    expect(within(row).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })
})
