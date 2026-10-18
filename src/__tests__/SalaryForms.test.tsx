import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SalaryPaymentModal from '../components/SalaryPaymentModal'
import SalaryAdjustmentModal from '../components/SalaryAdjustmentModal'
import EditEmployeeSalaryModal from '../components/EditEmployeeSalaryModal'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

// the browser's own max/required checks are skipped on purpose - we want our checks to show up
function submit() {
  fireEvent.submit(document.querySelector('form')!)
}

function fillFirstNumber(value: string) {
  fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value } })
}

describe('salary forms show their errors inline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({ '/businesses/me': { id: 1, currency: 'EUR' } }))
  })

  it('payment: an amount over what is left', async () => {
    renderWithProviders(<SalaryPaymentModal isOpen onClose={() => {}} employeeId={2} salaryId={5} remainingAmount={100} />)
    fillFirstNumber('150')
    submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Amount exceeds remaining amount')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('payment: the API refusing it', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(400, 'Salary is already paid'))
    renderWithProviders(<SalaryPaymentModal isOpen onClose={() => {}} employeeId={2} salaryId={5} remainingAmount={100} />)
    fillFirstNumber('50')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Salary is already paid')
  })

  it('adjustment: a zero amount', async () => {
    renderWithProviders(<SalaryAdjustmentModal isOpen onClose={() => {}} employeeId={2} salaryId={5} />)
    fillFirstNumber('0')
    submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid amount')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('employee salary: commission over 100%', async () => {
    renderWithProviders(<EditEmployeeSalaryModal isOpen onClose={() => {}} employeeId={2} currentBaseSalary={1000} currentCommissionPercentage={10} />)
    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '150' } })
    submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Commission must be between 0 and 100%')
    expect(api.put).not.toHaveBeenCalled()
  })
})
