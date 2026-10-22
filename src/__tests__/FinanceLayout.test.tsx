import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Finance from '../pages/Finance'
import api from '../api/client'
import { exportData } from '../utils/export'
import { renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), delete: vi.fn() } }))
vi.mock('../components/payments/ServicePayments', () => ({ default: () => <section>Deposit desk</section> }))
vi.mock('../utils/export', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/export')>(), exportData: vi.fn().mockResolvedValue(undefined),
}))

const rent = { id: 1, name: 'Rent', code: 'rent', color: '#be9a72' }
const salary = { id: 2, name: 'Salaries', code: 'salaries', color: '#63866c' }
const rows = [
  { id: 8, amount: 30, currency: 'EUR', expense_date: '2030-02-10T12:00:00Z', category: rent, payment_method: 'cash', description: 'Monthly lease' },
  { id: 9, amount: 20, currency: 'EUR', expense_date: '2030-02-11T12:00:00Z', category: salary, payment_method: 'card', description: 'Staff payout', source: 'salary_payment' },
]

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  signIn({ id: 1, role: 'business_owner', business_id: 1 })
  vi.mocked(api.delete).mockResolvedValue({ data: {} })
  vi.mocked(api.get).mockImplementation(url => {
    if (url === '/businesses/me') return Promise.resolve({ data: { id: 1, currency: 'EUR' } })
    if (url === '/expenses/categories') return Promise.resolve({ data: [rent, salary] })
    if (url === '/expenses/reports/profit') return Promise.resolve({ data: {
      revenue: 100, expenses: 50, profit: 50, profit_margin: 50,
      expenses_by_category: [
        { category_id: 1, category_name: 'Rent', category_code: 'rent', total: 30 },
        { category_id: 2, category_name: 'Salaries', category_code: 'salaries', total: 20 },
      ],
    } })
    if (url === '/analytics/payments/statistics') return Promise.resolve({ data: {
      card_payments: { total: 70, count: 2, percentage: 70 }, cash_payments: { total: 30, count: 1, percentage: 30 },
      other_payments: { total: 0, count: 0, percentage: 0 }, total_payments: 100, total_count: 3,
    } })
    const parsed = new URL(url, 'http://test.local')
    const category = parsed.searchParams.get('category_id')
    const items = category ? rows.filter(row => row.category.id === Number(category)) : rows
    return Promise.resolve({ data: { items, page: 1, per_page: 100, pages: 1, total: items.length } })
  })
})

it('names the period fields and keeps the category filter scoped to the expense ledger', async () => {
  renderWithProviders(<Finance />)
  await screen.findByText('Monthly lease')
  fireEvent.change(screen.getByLabelText('Date From'), { target: { value: '2030-02-01' } })
  fireEvent.change(screen.getByLabelText('Date To'), { target: { value: '2030-02-28' } })
  const expected = { date_from: new Date(2030, 1, 1).toISOString(), date_to: new Date(2030, 1, 28, 23, 59, 59, 999).toISOString() }
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/expenses/reports/profit', { params: expected }))
  expect(api.get).toHaveBeenCalledWith('/analytics/payments/statistics', { params: expected })
  await waitFor(() => expect(screen.getByText('Salary payment: Staff payout')).toBeInTheDocument())
  vi.mocked(api.get).mockClear()
  const ledger = screen.getByRole('region', { name: 'Expenses List' })
  await userEvent.selectOptions(within(ledger).getByRole('combobox', { name: 'Category' }), '1')
  await waitFor(() => expect(within(ledger).queryByText('Salary payment: Staff payout')).not.toBeInTheDocument())
  expect(within(ledger).getByText('Monthly lease')).toBeInTheDocument()
  const request = vi.mocked(api.get).mock.calls.find(([url]) => url.startsWith('/expenses/?'))!
  const params = new URL(request[0], 'http://test.local').searchParams
  expect(Object.fromEntries(params)).toMatchObject({ ...expected, category_id: '1', page: '1', per_page: '100' })
  expect(request[1]?.signal).toBeDefined()
  expect(api.get).not.toHaveBeenCalledWith('/expenses/reports/profit', expect.anything())
  expect(api.get).not.toHaveBeenCalledWith('/analytics/payments/statistics', expect.anything())
  expect(screen.getByText('Revenue', { selector: 'dt' }).parentElement).toHaveTextContent('100.00 €')
  expect(screen.getByText('Deposit desk')).toBeInTheDocument()
})

it('keeps every payment-method export row, its total and chart selector', async () => {
  renderWithProviders(<Finance />)
  const payments = await screen.findByRole('region', { name: 'Payments volume' })
  expect(within(payments).getByText('70% (2)')).toBeInTheDocument()
  expect(within(payments).getByText('0% (0)')).toBeInTheDocument()
  await userEvent.click(within(payments).getByRole('button', { name: 'Export' }))
  await userEvent.click(within(screen.getByRole('dialog', { name: 'Export Data' })).getByRole('button', { name: 'Export' }))
  await waitFor(() => expect(exportData).toHaveBeenCalledOnce())
  expect(vi.mocked(exportData).mock.calls[0][0]).toMatchObject({
    data: [
      { 'Payment Method': 'Card', Total: '70.00 €', Count: 2, Percentage: '70%' },
      { 'Payment Method': 'Cash', Total: '30.00 €', Count: 1, Percentage: '30%' },
      { 'Payment Method': 'Other', Total: '0.00 €', Count: 0, Percentage: '0%' },
      { 'Payment Method': 'Total', Total: '100.00 €', Count: 3, Percentage: '100%' },
    ], includeCharts: true, chartSelectors: ['#payment-chart'],
  })
})

it('keeps deletion attached to the chosen expense and requires its confirmation', async () => {
  const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false)
  renderWithProviders(<Finance />)
  const row = await screen.findByRole('row', { name: /Monthly lease/ })
  await userEvent.click(within(row).getByRole('button', { name: 'Delete' }))
  expect(confirmation).toHaveBeenCalledWith('Are you sure you want to delete this expense?')
  expect(api.delete).not.toHaveBeenCalled()
  confirmation.mockReturnValue(true)
  await userEvent.click(within(row).getByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/expenses/8'))
})
