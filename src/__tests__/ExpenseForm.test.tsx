import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Finance from '../pages/Finance'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

async function submitExpense() {
  renderWithProviders(<Finance />)
  await userEvent.click(await screen.findByRole('button', { name: /add expense/i }))
  const form = document.querySelector('form')!
  fireEvent.change(within(form).getAllByRole('spinbutton')[0], { target: { value: '25' } })
  await userEvent.click(within(form).getByRole('button', { name: 'Save' }))
  return form
}

describe('expense form errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 1, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockResolvedValue({ data: [] })
  })

  it('puts API validation errors under amount and date', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(422, 'Validation error', { validation_errors: [
      { field: 'body -> amount', message: 'Input should be greater than 0', code: 'greater_than', params: { gt: 0 } },
      { field: 'body -> expense_date', message: 'bad date', code: 'date_out_of_range', params: { min: '2000-01-01', max: '2100-01-01' } },
    ] }))
    const form = await submitExpense()
    expect(await within(form).findByText('Must be more than 0')).toBeInTheDocument()
    expect(within(form).getByText('Date must be between 2000-01-01 and 2100-01-01')).toBeInTheDocument()
    expect(within(form).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('books the expense to the business from the session', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1 } })
    await submitExpense()
    await vi.waitFor(() => expect(api.post).toHaveBeenCalledWith('/expenses/', expect.objectContaining({ amount: 25, business_id: 1 })))
  })

  it('asks for a business first when the session has none', async () => {
    signIn({ id: 1, role: 'business_owner', business_id: null })
    const form = await submitExpense()
    expect(await within(form).findByRole('alert')).toHaveTextContent('Create your business first')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('shows anything else above the form', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(400, 'Category belongs to another business'))
    const form = await submitExpense()
    expect(await within(form).findByRole('alert')).toHaveTextContent('Category belongs to another business')
  })
})
