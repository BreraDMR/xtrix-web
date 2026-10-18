import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MySalary from '../pages/MySalary'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

const salary = {
  id: 9, employee_id: 3, period_start: '2026-09-01T00:00:00', period_end: '2026-09-30T23:59:59',
  total_visits: 12, completed_visits: 10, cancelled_visits: 2, total_revenue: 5000,
  commission_percentage: 10, commission_amount: 500, base_salary: 1000, total_salary: 1500,
  adjustments_total: 0, total_with_adjustments: 1500, paid_amount: 500, payment_status: 'partial',
  is_paid: false, paid_at: null, notes: null, calculated_at: '2026-10-01T10:00:00',
}

describe('my salary export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 3, role: 'specialist', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({
      '/employees/me/salary/current': salary,
      '/employees/me/salary/history': [salary],
      '/businesses/me': { id: 1, currency: 'EUR' },
    }))
  })

  it('opens the real export dialog with the salary rows', async () => {
    renderWithProviders(<MySalary />)
    const tabs = await screen.findAllByRole('button', { name: 'Export' })
    await userEvent.click(tabs[0])
    const exportButtons = await screen.findAllByRole('button', { name: /export/i })
    await userEvent.click(exportButtons[exportButtons.length - 1])
    // ten lines: period, visits, completed, revenue, base, commission, adjustments, total, paid, remaining
    expect(await screen.findByText('10 items')).toBeInTheDocument()
  })
})
