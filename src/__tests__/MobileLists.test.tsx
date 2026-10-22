import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Visits from '../pages/Visits'
import Employees from '../pages/Employees'
import { useLocaleStore } from '../store/localeStore'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

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

const fullName = 'Jana Nováková'

describe('responsive list cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'business_owner' })
  })

  it('keeps localized visit fields together with one working edit action', async () => {
    useLocaleStore.setState({ locale: 'cz' })
    vi.mocked(api.get).mockImplementation(routes({
      '/visits/': { items: [{ id: 1, client_id: 3, client_name: fullName, specialist_id: 7, date_start: '2026-10-18T10:00:00Z', service_name: 'Konzultace', status: 'planned', price: 20 }], page: 1, per_page: 20, pages: 1, total: 1 },
      '/clients/': [{ id: 3, full_name: fullName }], '/businesses/me': { currency: 'EUR' },
      '/visits/1': { id: 1, client_id: 3, date_start: '2026-10-18T10:00:00Z', date_end: '2026-10-18T11:00:00Z', status: 'planned' },
      '/services/': [],
    }) as never)
    renderWithProviders(<Visits />)
    const row = (await screen.findByText(fullName)).closest('tr')!
    expect(screen.getAllByRole('columnheader').map(header => header.textContent)).toEqual([
      'Datum', 'Klient', 'Služba', 'Stav', 'Cena', 'Akce',
    ])
    expect(within(row).getAllByRole('cell')).toHaveLength(6)
    expect(within(row).getByRole('cell', { name: fullName })).toBeInTheDocument()
    expect(within(row).getByRole('cell', { name: 'Konzultace' })).toBeInTheDocument()
    expect(within(row).getByRole('cell', { name: 'Plánováno' })).toBeInTheDocument()
    expect(within(row).getAllByRole('button')).toHaveLength(1)
    await userEvent.click(within(row).getByRole('button'))
    const panel = await screen.findByRole('dialog', { name: 'Upravit návštěvu' })
    expect(within(panel).getByRole('button', { name: /zrušit/i })).toBeInTheDocument()
    expect(screen.getByRole('table')).toContainElement(row)
    await waitFor(() => expect(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')!.value).toContain('2026-10-18'))
  })

  it('keeps complete employee details and actions in a focusable scroll region', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/employees/': [{ id: 2, employee_user: { full_name: fullName, email: 'jana@example.cz' }, position: 'Stylist', is_active: true, commission_percentage: 15, base_salary: 1500 }],
      '/businesses/me': { currency: 'EUR' },
    }) as never)
    renderWithProviders(<Employees />)
    const row = (await screen.findByText(fullName)).closest('tr')!
    const region = screen.getByRole('region', { name: 'Employees' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toContainElement(row)
    expect(within(row).getAllByRole('cell')).toHaveLength(7)
    expect(screen.getAllByRole('columnheader').map(header => header.textContent)).toEqual([
      'Employee', 'Position', 'Commission', 'Base Salary', 'Status', 'Hired At', 'Actions',
    ])
    expect(within(row).getByText('Stylist')).toBeInTheDocument()
    expect(within(row).getByText('15%')).toBeInTheDocument()
    expect(within(row).getByText('jana@example.cz')).toBeInTheDocument()
    expect(within(row).getAllByRole('button')).toHaveLength(3)
    expect(within(row).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })
})
