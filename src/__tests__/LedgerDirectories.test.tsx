import { beforeEach, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Inventory from '../pages/Inventory'
import Finance from '../pages/Finance'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('../components/payments/ServicePayments', () => ({ default: () => null }))

beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 1, role: 'business_owner', business_id: 1 }) })

function serve(ledger: 'products' | 'expenses', fail = false) {
    vi.mocked(api.get).mockImplementation(url => {
      const parsed = new URL(url, 'http://test.local')
      if (parsed.pathname === `/${ledger}/`) {
        const page = Number(parsed.searchParams.get('page') ?? 1)
        const per_page = Number(parsed.searchParams.get('per_page') ?? 20)
        if (fail && page > 1) return Promise.reject(apiError(500, 'Later page unavailable'))
        const rows = Array.from({ length: 125 }, (_, i) => ledger === 'products'
          ? { id: i + 1, name: `Product ${i + 1}`, unit: 'pcs', quantity: 5, min_quantity: 1 }
          : { id: i + 1, amount: 20, currency: 'EUR', expense_date: '2026-10-10T10:00:00Z', description: `Expense ${i + 1}` })
        return Promise.resolve({ data: { items: rows.slice((page - 1) * per_page, page * per_page),
          page, per_page, pages: Math.ceil(rows.length / per_page), total: rows.length } })
      }
      if (url === '/businesses/me') return Promise.resolve({ data: { id: 1, currency: 'EUR' } })
      return Promise.resolve({ data: [] })
    })
}

for (const ledger of ['products', 'expenses'] as const) {
  it(`loads ${ledger} beyond the first hundred`, async () => {
    serve(ledger)
    renderWithProviders(ledger === 'products' ? <Inventory /> : <Finance />)
    expect(await screen.findByText(ledger === 'products' ? 'Product 125' : 'Expense 125')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Export' }).at(-1)!)
    expect(await screen.findByText('125 items')).toBeInTheDocument()
  })
  it(`does not show or export partial ${ledger} when a later page fails`, async () => {
    serve(ledger, true)
    renderWithProviders(ledger === 'products' ? <Inventory /> : <Finance />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load data')
    expect(screen.queryByText(ledger === 'products' ? 'Product 1' : 'Expense 1')).not.toBeInTheDocument()
    const panel = ledger === 'products' ? document.body : screen.getByRole('heading', { name: 'Expenses List' }).parentElement!
    expect(within(panel).queryByRole('button', { name: 'Export' })).not.toBeInTheDocument()
    serve(ledger)
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText(ledger === 'products' ? 'Product 125' : 'Expense 125')).toBeInTheDocument()
  })
}
