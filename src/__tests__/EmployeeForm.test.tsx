import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmployeeForm from '../components/EmployeeForm'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

describe('EmployeeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 2, role: 'business_owner', business_id: 1 })
    vi.mocked(api.get).mockImplementation(
      routes({
        '/specialist-profiles/types': { categories: { beauty: { name: 'Beauty', types: ['massage', 'barber'] } } },
        '/employees/4': { id: 4, employee_user_id: 9, business_owner_id: 2, position: 'Barber', is_active: true, base_salary: 1000, commission_percentage: 10, employee_user: { id: 9, full_name: 'Petr Novák' } },
      }) as any
    )
  })

  it('hires by creating an account, with a real specialist type code', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { generated_password: 'Gen3rated!pass' } })
    renderWithProviders(<EmployeeForm onSuccess={() => {}} onCancel={() => {}} />)

    await userEvent.type(screen.getByLabelText(/full name/i), 'Petr Novák')
    await userEvent.type(screen.getByLabelText(/email/i), 'petr@example.com')
    await userEvent.selectOptions(await screen.findByRole('combobox'), 'massage')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/employees/create-with-user',
        expect.objectContaining({ full_name: 'Petr Novák', email: 'petr@example.com', specialist_type: 'massage' })
      )
    )
    expect(await screen.findByDisplayValue('Gen3rated!pass')).toBeInTheDocument()
    // nobody browses "all specialists" any more
    expect(vi.mocked(api.get).mock.calls.map((c) => c[0])).not.toContain('/users/')
  })

  it('edits an employee without sending who they are', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} })
    const onSuccess = vi.fn()
    renderWithProviders(<EmployeeForm employeeId={4} onSuccess={onSuccess} onCancel={() => {}} />)

    expect(await screen.findByText('Petr Novák')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    const body = vi.mocked(api.put).mock.calls[0][1] as Record<string, unknown>
    expect(vi.mocked(api.put).mock.calls[0][0]).toBe('/employees/4')
    expect(body).toMatchObject({ position: 'Barber', base_salary: 1000, commission_percentage: 10 })
    expect(body).not.toHaveProperty('employee_user_id')
  })
})
