import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitForm from '../components/VisitForm'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

// DES-08: frequent fields up front and labelled, rare ones behind one explicit "More options",
// and a validation error points at its own field
const jana = { id: 3, full_name: 'Jana Nováková', contact_phone: '+420777000111', language: 'cz', created_at: '2026-10-01T10:00:00' }
const massage = { id: 5, name: 'Massage', duration_minutes: 60, price: 900, is_active: true, specialist_id: 7 }
const table = {
  '/clients/': [jana],
  '/services/': [massage],
  '/services/5': { ...massage, specialists: [{ id: 7, full_name: 'Petr Novák' }] },
  '/loyalty/balance/3': { points: 100, cashback: 0 },
}

async function pickClient() {
  const option = await screen.findByRole('option', { name: 'Jana Nováková' })
  await userEvent.selectOptions(option.closest('select')!, option)
}

describe('VisitForm layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(routes(table))
  })

  it('ties every frequent field to its label', async () => {
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
    await screen.findByRole('option', { name: 'Jana Nováková' })
    expect(screen.getByLabelText(/^Client/)).toBeInstanceOf(HTMLSelectElement)
    expect(screen.getByLabelText(/^Service$/)).toBeInstanceOf(HTMLSelectElement)
    expect(screen.getByLabelText(/^Start Date & Time/)).toHaveAttribute('type', 'datetime-local')
    expect(screen.getByLabelText(/^End Date & Time/)).toHaveAttribute('type', 'datetime-local')
    expect(screen.getByLabelText(/^Price/)).toHaveAttribute('type', 'number')
    expect(screen.getByLabelText(/^Status/)).toBeInstanceOf(HTMLSelectElement)
    expect(screen.getByLabelText('Notes')).toBeInstanceOf(HTMLTextAreaElement)
    // the client source switch says which one is on
    expect(screen.getByRole('button', { name: 'Client List' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Search Client' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps gift certificate and points behind More options until asked', async () => {
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
    await pickClient()
    const more = await screen.findByRole('button', { name: /More options/ })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByLabelText('Certificate code')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Points to use/i)).not.toBeInTheDocument()

    await userEvent.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByLabelText('Certificate code')).toBeInTheDocument()
    expect(await screen.findByLabelText(/Points to use/i)).toBeInTheDocument()
  })

  it('shows the custom name up front for a free visit and folds it away once a catalogue service is picked', async () => {
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
    await screen.findByRole('option', { name: 'Jana Nováková' })
    // no service, no client: nothing rare to offer, the free name is the visit's name
    expect(screen.getByLabelText(/^Service Name/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /More options/ })).not.toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText(/^Service$/), '5')
    await waitFor(() => expect(screen.queryByLabelText(/^Service Name/)).not.toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: /More options/ }))
    expect(screen.getByLabelText(/^Service Name/)).toHaveValue('Massage')
  })

  it('opens More options by itself when the saved visit already uses one of them', async () => {
    vi.mocked(api.get).mockImplementation(routes({ ...table, '/visits/21': {
      id: 21, client_id: 3, specialist_id: 7, service_id: 5, service_name: 'Massage with oil',
      date_start: '2030-03-04T10:00:00Z', date_end: '2030-03-04T11:00:00Z', status: 'planned', price: 900,
    } }))
    renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
    expect(await screen.findByLabelText(/^Service Name/)).toHaveValue('Massage with oil')
    expect(screen.getByRole('button', { name: /More options/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('marks and focuses the end field when it is before the start', async () => {
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
    await pickClient()
    const start = screen.getByLabelText(/^Start Date & Time/)
    const end = screen.getByLabelText(/^End Date & Time/)
    fireEvent.change(start, { target: { value: '2030-03-04T10:00' } })
    fireEvent.change(end, { target: { value: '2030-03-04T09:00' } })
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('End time must be after start time')
    expect(end).toHaveAttribute('aria-invalid', 'true')
    expect(end).toHaveAccessibleDescription(/End time must be after start time/)
    expect(end).toHaveFocus()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('points a missing client at the client field', async () => {
    renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
    await screen.findByRole('option', { name: 'Jana Nováková' })
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Select client...')
    expect(screen.getByLabelText(/^Client/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/^Client/)).toHaveFocus()
  })

  it('hands the saved visit to the caller, so it can offer the next step', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 40, client_id: 3, client_name: 'Jana Nováková', date_start: '2030-03-04T10:00:00Z', status: 'planned' } })
    const onSuccess = vi.fn()
    renderWithProviders(<VisitForm onSuccess={onSuccess} onCancel={() => {}} />)
    await pickClient()
    await userEvent.click(screen.getByRole('button', { name: /create visit/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 40, client_name: 'Jana Nováková' })))
  })
})
