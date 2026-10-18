import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import BusinessForm from '../components/BusinessForm'
import ClientForm from '../components/ClientForm'
import EmployeeForm from '../components/EmployeeForm'
import ServiceForm from '../components/ServiceForm'
import VisitForm from '../components/VisitForm'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
const noop = () => {}
const jana = { id: 3, full_name: 'Jana', language: 'cz' }

describe('form validation before API requests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    resetStores()
    signIn({ id: 7, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(routes({ '/clients/': [jana], '/services/': [], '/employees/': [], '/users/': [], '/specialist-profiles/types': { categories: {} }, '/employees/4': { employee_user: { full_name: 'Petr' }, base_salary: 0, commission_percentage: 0 } }) as never)
  })

  it.each(['Business', 'Employee', 'Client'])('rejects invalid %s contact details in the form', async (kind) => {
    const Component = kind === 'Business' ? BusinessForm : kind === 'Employee' ? EmployeeForm : ClientForm
    const { container } = renderWithProviders(<Component onSuccess={noop} onCancel={noop} />)
    fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'Name' } })
    fireEvent.change(container.querySelector('input[type="tel"]')!, { target: { value: '-------' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByText('Invalid phone number format')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
    fireEvent.change(container.querySelector('input[type="tel"]')!, { target: { value: '+420777000111' } })
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'invalid@' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByText('Invalid email format')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each([[-1, 0], [101, 0], [0, -1], [0, 100000001]])('rejects commission %s and salary %s', async (commission, salary) => {
    const { container } = renderWithProviders(<EmployeeForm employeeId={4} onSuccess={noop} onCancel={noop} />)
    await screen.findByText('Petr')
    const [commissionInput, salaryInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(commissionInput, { target: { value: commission } })
    fireEvent.change(salaryInput, { target: { value: salary } })
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(api.put).not.toHaveBeenCalled()
  })

  it.each([[0, 0], [100, 100000000]])('accepts commission %s and salary %s without losing zero', async (commission, salary) => {
    vi.mocked(api.put).mockResolvedValue({ data: {} })
    const { container } = renderWithProviders(<EmployeeForm employeeId={4} onSuccess={noop} onCancel={noop} />)
    await screen.findByText('Petr')
    const [commissionInput, salaryInput] = screen.getAllByRole('spinbutton')
    expect(salaryInput).toHaveAttribute('max', '100000000')
    fireEvent.change(commissionInput, { target: { value: commission } })
    fireEvent.change(salaryInput, { target: { value: salary } })
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/employees/4', expect.objectContaining({ commission_percentage: commission, base_salary: salary })))
  })

  it.each([[0, 0], [100, 100000000]])('creates an employee with commission %s and salary %s', async (commission, salary) => {
    vi.mocked(api.post).mockResolvedValue({ data: { generated_password: 'TestPassword123!' } })
    const { container } = renderWithProviders(<EmployeeForm onSuccess={noop} onCancel={noop} />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Petr' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '+420 (777) 000-111' } })
    const [commissionInput, salaryInput] = screen.getAllByRole('spinbutton')
    fireEvent.change(commissionInput, { target: { value: commission } })
    fireEvent.change(salaryInput, { target: { value: salary } })
    expect(commissionInput).toHaveValue(commission)
    expect(salaryInput).toHaveValue(salary)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/employees/create-with-user', expect.objectContaining({ commission_percentage: commission, base_salary: salary })))
  })

  it('rejects a negative service price even for a direct submit', async () => {
    const { container } = renderWithProviders(<ServiceForm onSuccess={noop} onCancel={noop} />)
    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '-1' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Price must be zero or greater')
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each(['2026-10-18T09:00', '2026-10-18T10:00'])('rejects visit end %s at or before start', async (end) => {
    const { container } = renderWithProviders(<VisitForm initialDateStart={new Date('2026-10-18T10:00Z')} onSuccess={noop} onCancel={noop} />)
    await screen.findByRole('option', { name: 'Jana' })
    fireEvent.change(container.querySelector('select')!, { target: { value: '3' } })
    fireEvent.change(container.querySelectorAll('input[type="datetime-local"]')[1], { target: { value: end } })
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('End time must be after start time')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('rejects a negative visit price and sets its native minimum', async () => {
    const { container } = renderWithProviders(<VisitForm onSuccess={noop} onCancel={noop} />)
    await screen.findByRole('option', { name: 'Jana' })
    fireEvent.change(container.querySelector('select')!, { target: { value: '3' } })
    const price = screen.getAllByRole('spinbutton')[0]
    expect(price).toHaveAttribute('min', '0')
    fireEvent.change(price, { target: { value: '-1' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByRole('alert')).toHaveTextContent('Price must be zero or greater')
    expect(api.post).not.toHaveBeenCalled()
  })

  it.each(['Business', 'Employee', 'Service', 'Visit', 'Client'])('keeps %s API errors visible in the form', async (kind) => {
    vi.mocked(api.post).mockRejectedValue(apiError(500, 'Save failed'))
    const Component = { Business: BusinessForm, Employee: EmployeeForm, Service: ServiceForm, Visit: VisitForm, Client: ClientForm }[kind]!
    const { container } = renderWithProviders(<Component onSuccess={noop} onCancel={noop} />)
    if (kind === 'Visit') {
      await screen.findByRole('option', { name: 'Jana' })
      fireEvent.change(container.querySelector('select')!, { target: { value: '3' } })
    } else {
      fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'Name' } })
      const email = container.querySelector('input[type="email"]')
      if (email) fireEvent.change(email, { target: { value: 'test@example.com' } })
    }
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByText('Save failed')).toBeInTheDocument()
  })

  it.each([
    ['Business', 'name'],
    ['Employee', 'full_name'],
    ['Service', 'name'],
    ['Client', 'full_name'],
  ])('puts a %s validation error from the API under its field, translated', async (kind, field) => {
    vi.mocked(api.post).mockRejectedValue(apiError(422, 'Validation error', {
      validation_errors: [{ field: `body -> ${field}`, message: 'String should have at least 2 characters', code: 'string_too_short', params: { min_length: 2 } }],
    }))
    const Component = { Business: BusinessForm, Employee: EmployeeForm, Service: ServiceForm, Client: ClientForm }[kind]!
    const { container } = renderWithProviders(<Component onSuccess={noop} onCancel={noop} />)
    const input = container.querySelector('input[type="text"]')!
    fireEvent.change(input, { target: { value: 'N' } })
    const email = container.querySelector('input[type="email"]')
    if (email) fireEvent.change(email, { target: { value: 'test@example.com' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByText('At least 2 characters')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText(/String should have/)).not.toBeInTheDocument()
  })

  it('puts a visit time range error from the API under the end field', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(422, 'Validation error', {
      validation_errors: [{ field: 'body -> date_end', message: 'End date/time must be after start date/time', code: 'invalid_time_range', params: {} }],
    }))
    const { container } = renderWithProviders(<VisitForm onSuccess={noop} onCancel={noop} />)
    await screen.findByRole('option', { name: 'Jana' })
    fireEvent.change(container.querySelector('select')!, { target: { value: '3' } })
    fireEvent.submit(container.querySelector('form')!)
    expect(await screen.findByText('The end must be after the start and the visit no longer than 24 hours')).toBeInTheDocument()
    expect(container.querySelectorAll('input[type="datetime-local"]')[1]).toHaveAttribute('aria-invalid', 'true')
  })

  it('keeps a loyalty failure visible after saving, without allowing duplicate visits', async () => {
    vi.mocked(api.get).mockImplementation(routes({ '/clients/': [jana], '/services/': [], '/loyalty/balance/3': { points: 100, cashback: 0 } }) as never)
    vi.mocked(api.post).mockImplementation(async (url) => {
      if (url === '/visits/') return { data: { id: 9 } }
      throw apiError(409, 'Loyalty balance changed')
    })
    const onSuccess = vi.fn()
    const { container } = renderWithProviders(<VisitForm onSuccess={onSuccess} onCancel={noop} />)
    await screen.findByRole('option', { name: 'Jana' })
    fireEvent.change(container.querySelector('select')!, { target: { value: '3' } })
    const points = (await screen.findByText(/points to use/i)).parentElement!.querySelector('input')!
    fireEvent.change(points, { target: { value: '10' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    expect(await screen.findByRole('alert')).toHaveTextContent('Loyalty balance changed')
    expect(onSuccess).not.toHaveBeenCalled()
    fireEvent.submit(form)
    expect(vi.mocked(api.post).mock.calls.filter(([url]) => url === '/visits/')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
