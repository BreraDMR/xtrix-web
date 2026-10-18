import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BusinessForm from '../components/BusinessForm'
import Business from '../pages/Business'
import api from '../api/client'
import { useLocaleStore } from '../store/localeStore'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const noop = () => {}
const salon = (assistant_name: string | null = null, assistant_gender = 'female') => ({
  id: 1, name: 'Salon Lena', business_type: 'salon', currency: 'CZK', created_at: '2026-10-01T10:00:00',
  assistant_name, assistant_gender,
})

function mockBusiness(business = salon()) {
  vi.mocked(api.get).mockImplementation(routes({ '/businesses/1': business, '/businesses/me': business }))
}

const nameField = () => screen.findByRole('textbox', { name: /assistant name|имя помощника|jméno asistenta/i })
const genderField = () => screen.getByRole('combobox', { name: /gender|род|rod/i })
const save = () => userEvent.click(screen.getByRole('button', { name: /update business|сохранить бизнес|uložit podnik/i }))

describe('assistant name in the business form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    vi.mocked(api.put).mockResolvedValue({ data: salon() })
  })

  it('loads the saved name and gender and sends the edited ones', async () => {
    mockBusiness(salon('Marek', 'male'))
    const onSuccess = vi.fn()
    renderWithProviders(<BusinessForm businessId={1} onSuccess={onSuccess} onCancel={noop} />)
    const name = await nameField()
    await waitFor(() => expect(name).toHaveValue('Marek'))
    expect(genderField()).toHaveValue('male')

    await userEvent.clear(name)
    await userEvent.type(name, 'Lenka')
    await userEvent.selectOptions(genderField(), 'female')
    await save()

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(api.put).toHaveBeenCalledWith('/businesses/1', expect.objectContaining({ assistant_name: 'Lenka', assistant_gender: 'female' }))
  })

  it('picks the gender from a dropdown with three options', async () => {
    mockBusiness()
    renderWithProviders(<BusinessForm businessId={1} onSuccess={noop} onCancel={noop} />)
    await nameField()
    const gender = genderField()
    expect(gender.tagName).toBe('SELECT')
    expect(within(gender).getAllByRole('option').map((o) => (o as HTMLOptionElement).value)).toEqual(['female', 'male', 'neuter'])
  })

  it('sends null for an empty name, so the default comes back', async () => {
    mockBusiness(salon('Marek', 'male'))
    renderWithProviders(<BusinessForm businessId={1} onSuccess={noop} onCancel={noop} />)
    const name = await nameField()
    await waitFor(() => expect(name).toHaveValue('Marek'))
    await userEvent.clear(name)
    await userEvent.type(name, '   ')
    await save()
    await waitFor(() => expect(api.put).toHaveBeenCalled())
    expect(vi.mocked(api.put).mock.calls[0][1]).toMatchObject({ assistant_name: null, assistant_gender: 'male' })
  })

  it.each([
    ['en', 'Sasha'],
    ['ru', 'Сашенька'],
    ['cz', 'Saška'],
  ] as const)('shows the %s default name as the placeholder', async (locale, placeholder) => {
    useLocaleStore.setState({ locale })
    mockBusiness()
    renderWithProviders(<BusinessForm businessId={1} onSuccess={noop} onCancel={noop} />)
    const name = await nameField()
    expect(name).toHaveValue('')
    expect(name).toHaveAttribute('placeholder', placeholder)
  })

  it('says right away when the name is longer than 30 characters and does not save it', async () => {
    mockBusiness()
    renderWithProviders(<BusinessForm businessId={1} onSuccess={noop} onCancel={noop} />)
    const name = await nameField()
    await userEvent.type(name, 'A'.repeat(31))
    expect(await screen.findByText('Up to 30 characters')).toBeInTheDocument()
    expect(name).toHaveAttribute('aria-invalid', 'true')
    await save()
    expect(api.put).not.toHaveBeenCalled()

    await userEvent.type(name, '{Backspace}')
    expect(screen.queryByText('Up to 30 characters')).not.toBeInTheDocument()
  })

  it('counts letters, not UTF-16 units, like the API does', async () => {
    mockBusiness()
    renderWithProviders(<BusinessForm businessId={1} onSuccess={noop} onCancel={noop} />)
    fireEvent.change(await nameField(), { target: { value: '🌸'.repeat(30) } })
    expect(screen.queryByText('Up to 30 characters')).not.toBeInTheDocument()
  })

  it('refuses line breaks and control characters', async () => {
    mockBusiness()
    renderWithProviders(<BusinessForm businessId={1} onSuccess={noop} onCancel={noop} />)
    fireEvent.change(await nameField(), { target: { value: 'Sa\tsha' } })
    expect(await screen.findByText('No line breaks or special characters')).toBeInTheDocument()
    await save()
    expect(api.put).not.toHaveBeenCalled()
  })

  it('puts API errors under the assistant fields', async () => {
    mockBusiness()
    vi.mocked(api.put).mockRejectedValue(apiError(422, 'Validation error', { validation_errors: [
      { field: 'body -> assistant_name', message: "The assistant name can't contain line breaks", code: 'invalid_assistant_name' },
      { field: 'body -> assistant_gender', message: 'bad', code: 'invalid_choice', params: { allowed: ['female', 'male', 'neuter'] } },
    ] }))
    renderWithProviders(<BusinessForm businessId={1} onSuccess={noop} onCancel={noop} />)
    await userEvent.type(await nameField(), 'Lenka')
    await save()

    const nameBox = (await nameField()).parentElement!
    expect(await within(nameBox).findByText('No line breaks or special characters')).toBeInTheDocument()
    expect(within(genderField().parentElement!).getByText('Choose one of: female, male, neuter')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await userEvent.selectOptions(genderField(), 'male')
    expect(within(genderField().parentElement!).queryByText('Choose one of: female, male, neuter')).not.toBeInTheDocument()
  })

  it('is not part of creating a business, the API takes it on update only', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: salon() })
    const { container } = renderWithProviders(<BusinessForm onSuccess={noop} onCancel={noop} />)
    expect(screen.queryByRole('textbox', { name: /assistant name/i })).not.toBeInTheDocument()
    fireEvent.change(container.querySelector('input[type="text"]')!, { target: { value: 'Salon Lena' } })
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(api.post).toHaveBeenCalled())
    const body = vi.mocked(api.post).mock.calls[0][1] as Record<string, unknown>
    expect(body).not.toHaveProperty('assistant_name')
    expect(body).not.toHaveProperty('assistant_gender')
  })
})

describe('assistant on the business page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
  })

  it("shows the business's own name and gender", async () => {
    mockBusiness(salon('Marek', 'male'))
    renderWithProviders(<Business />)
    expect(await screen.findByText('Marek')).toBeInTheDocument()
    expect(screen.getByText('Male (he)')).toBeInTheDocument()
  })

  it('shows the default name for the UI language when none is set', async () => {
    useLocaleStore.setState({ locale: 'ru' })
    mockBusiness()
    renderWithProviders(<Business />)
    expect(await screen.findByText('Сашенька (по умолчанию)')).toBeInTheDocument()
  })

  it('is not shown to staff, like the rest of the business settings', async () => {
    signIn({ id: 8, role: 'employee', business_id: 1, employer_id: 5 })
    mockBusiness(salon('Marek', 'male'))
    renderWithProviders(<Business />)
    expect(await screen.findByRole('heading', { name: 'My Business' })).toBeInTheDocument()
    expect(screen.queryByText('Marek')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Business' })).not.toBeInTheDocument()
  })
})
