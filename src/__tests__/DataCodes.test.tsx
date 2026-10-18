import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Finance from '../pages/Finance'
import Inventory from '../pages/Inventory'
import api from '../api/client'
import { useLocaleStore } from '../store/localeStore'
import { renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))

const rent = { id: 1, name: 'Rent', code: 'rent', type: 'fixed', color: '#f00', is_system: true }
const coffee = { id: 9, name: 'Кофе для гостей', code: null, type: 'variable', color: null, is_system: false }

function answer(url: string) {
  if (url === '/expenses/categories') return Promise.resolve({ data: [rent, coffee] })
  if (url.startsWith('/expenses/?')) return Promise.resolve({ data: { items: [
    { id: 5, amount: 1200, currency: 'EUR', expense_date: '2026-10-05T10:00:00Z', payment_method: 'card', category: rent, description: null, source: null },
    { id: 6, amount: 800, currency: 'EUR', expense_date: '2026-10-06T10:00:00Z', payment_method: 'cash', category: { id: 2, name: 'Salaries', code: 'salaries' }, description: 'October', source: 'salary_payment', employee_id: 4 },
  ] } })
  if (url === '/expenses/reports/profit') return Promise.resolve({ data: { expenses_by_category: [
    { category_id: 1, category_name: 'Rent', category_code: 'rent', color: '#f00', total: 1200 },
  ] } })
  if (url.startsWith('/products/')) return Promise.resolve({ data: { items: [
    { id: 3, name: 'Shampoo', unit: 'pcs', quantity: 10, min_quantity: 1 },
    { id: 4, name: 'Oil', unit: 'бутылка', quantity: 2, min_quantity: 1 },
  ] } })
  if (url === '/businesses/me') return Promise.resolve({ data: { id: 1, currency: 'EUR' } })
  return Promise.resolve({ data: [] })
}

describe('codes from the API are translated on screen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    useLocaleStore.setState({ locale: 'ru' })
    vi.mocked(api.get).mockImplementation(answer as typeof api.get)
  })

  it('finance: system categories by code, salary payouts by source', async () => {
    renderWithProviders(<Finance />)
    const table = (await screen.findByText('October', { exact: false })).closest('table')!
    expect(within(table).getByText('Аренда')).toBeInTheDocument()
    expect(within(table).getByText('Зарплаты')).toBeInTheDocument()
    expect(within(table).getByText('Выплата зарплаты: October')).toBeInTheDocument()
    expect(screen.queryByText('Rent')).not.toBeInTheDocument()
    // category filter
    expect(screen.getByRole('option', { name: 'Аренда' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Кофе для гостей' })).toBeInTheDocument()
  })

  it('inventory: unit codes are translated, free text stays, the form picks a unit from a list', async () => {
    renderWithProviders(<Inventory />)
    expect(await screen.findByText('10 шт')).toBeInTheDocument()
    expect(screen.getByText('2 бутылка')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: /редактировать|edit/i })[0])
    const unit = screen.getByLabelText(/единица/i) as HTMLSelectElement
    expect(unit.value).toBe('pcs')
    expect(within(unit).getByRole('option', { name: 'мл' })).toHaveValue('ml')
  })
})
