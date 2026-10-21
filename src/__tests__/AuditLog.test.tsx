import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import api from '../api/client'
import AuditLog from '../pages/AuditLog'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

const BUSINESS = {
  id: 1,
  name: 'Alpha Salon',
  business_type: 'salon',
  currency: 'EUR',
  timezone: 'Europe/Prague',
}

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    action: 'visit.created',
    entity_type: 'visit',
    entity_id: 11,
    actor_user_id: 7,
    actor_name: 'Olga Owner',
    actor_role: 'business_owner',
    request_id: 'req-1',
    changes: { status: 'planned' },
    created_at: '2026-10-20T10:00:00Z',
    ...overrides,
  }
}

function auditPage(items: unknown[]) {
  return { items, page: 1, pages: 1, per_page: 20, total: items.length }
}

beforeEach(() => {
  vi.resetAllMocks()
  resetStores()
  signIn({ id: 7, role: 'business_owner', full_name: 'Olga Owner' })
  window.history.replaceState(null, '', '/')
})

describe('action log', () => {
  it('shows who, when and what changed, filters the journal and exports CSV', async () => {
    const items = [
      event(),
      event({
        id: 2,
        action: 'payment.paid',
        entity_type: 'payment',
        entity_id: 5,
        actor_user_id: null,
        actor_name: null,
        actor_role: 'system',
        request_id: 'evt-paid-1',
        changes: {
          amount: '12.30',
          currency: 'EUR',
          status: 'paid',
          provider: 'sandbox',
          provider_event_id: 'evt-paid-1',
        },
      }),
      event({
        id: 3,
        action: 'questionnaire.submitted',
        entity_type: 'questionnaire',
        entity_id: 4,
        actor_user_id: null,
        actor_name: null,
        actor_role: 'guest',
        request_id: null,
        changes: { version: 1, fields_count: 3, answered_count: 3 },
      }),
      event({
        id: 4,
        action: 'client.updated',
        entity_type: 'client',
        entity_id: 3,
        changes: { fields: ['contact_email'] },
        created_at: '2026-10-21T12:30:00Z',
        request_id: 'client-update-1',
      }),
    ]
    vi.mocked(api.get).mockImplementation(
      routes({
        '/businesses/me': BUSINESS,
        '/businesses/me/audit': auditPage(items),
        '/businesses/me/audit/export/csv': new Blob(['ID,Action\n1,visit.created']),
      }) as never,
    )

    const createObjectURL = vi.fn(() => 'blob:audit')
    Object.defineProperty(URL, 'createObjectURL', { writable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    renderWithProviders(<AuditLog />)

    expect(await screen.findByRole('heading', { name: 'Action log' })).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getByText('Visit created')).toBeInTheDocument()
    expect(within(table).getByText('Payment received')).toBeInTheDocument()
    expect(within(table).getByText('Questionnaire submitted')).toBeInTheDocument()
    expect(within(table).getByText('Client card updated')).toBeInTheDocument()
    expect(within(table).getAllByText('Olga Owner')).toHaveLength(2)
    expect(within(table).getByText('System')).toBeInTheDocument()
    expect(within(table).getByText('Guest')).toBeInTheDocument()
    expect(within(table).getByText('req-1')).toBeInTheDocument()
    expect(within(table).getByText('Status: Planned')).toBeInTheDocument()
    expect(within(table).getByText(/Amount: 12.30/)).toBeInTheDocument()
    expect(within(table).getByText(/Changed: Email/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/secret@example.com/)).not.toBeInTheDocument()

    const filters = screen.getByRole('heading', { name: 'Filters' }).closest('form')
    if (!filters) throw new Error('filters form is missing')
    await userEvent.selectOptions(within(filters).getByLabelText('Action'), 'visit.created')
    await userEvent.type(within(filters).getByLabelText('Actor (user ID)'), '7')
    await userEvent.type(within(filters).getByLabelText('From date'), '2026-10-01')
    await userEvent.type(within(filters).getByLabelText('To date'), '2026-10-31')
    await userEvent.click(within(filters).getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/businesses/me/audit', {
        params: {
          page: 1,
          per_page: 20,
          action: 'visit.created',
          actor_user_id: 7,
          date_from: new Date('2026-10-01T00:00:00').toISOString(),
          date_to: new Date('2026-10-31T23:59:59.999').toISOString(),
        },
      }),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Export CSV' }))
    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/businesses/me/audit/export/csv', {
        params: expect.objectContaining({ action: 'visit.created', actor_user_id: 7 }),
        responseType: 'blob',
      }),
    )
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled())
    expect(click).toHaveBeenCalled()
  })

  it('shows the access message for a forbidden journal', async () => {
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/businesses/me') return Promise.resolve({ data: BUSINESS })
      return Promise.reject(apiError(403, 'Forbidden'))
    }) as typeof api.get)

    renderWithProviders(<AuditLog />)

    expect(await screen.findByText('You do not have access to the action log.')).toBeInTheDocument()
  })

  it('hides payment and questionnaire filters from a role without those rights', async () => {
    signIn({ id: 9, role: 'specialist', employer_id: 7, full_name: 'Staff Member' })
    vi.mocked(api.get).mockImplementation(
      routes({ '/businesses/me': BUSINESS, '/businesses/me/audit': auditPage([event()]) }) as never,
    )

    renderWithProviders(<AuditLog />)

    const filters = (await screen.findByRole('heading', { name: 'Filters' })).closest('form')
    if (!filters) throw new Error('filters form is missing')
    const actionSelect = within(filters).getByLabelText('Action')
    const entitySelect = within(filters).getByLabelText('Record type')
    expect(within(actionSelect).queryByRole('option', { name: 'Payment received' })).not.toBeInTheDocument()
    expect(within(actionSelect).queryByRole('option', { name: 'Questionnaire submitted' })).not.toBeInTheDocument()
    expect(within(entitySelect).queryByRole('option', { name: 'Payment' })).not.toBeInTheDocument()
    expect(within(entitySelect).queryByRole('option', { name: 'Questionnaire' })).not.toBeInTheDocument()
    expect(within(actionSelect).getByRole('option', { name: 'Visit created' })).toBeInTheDocument()
  })
})
