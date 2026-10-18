import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Subscription from '../pages/Subscription'
import api from '../api/client'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'
import { useLocaleStore } from '../store/localeStore'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const plan = { id: 1, code: 'solo_month', name: 'Solo', period_days: 30, price: 20, currency: 'EUR', is_trial: false, is_active: true }

describe('Subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 7, role: 'specialist' })
    vi.mocked(api.get).mockImplementation(
      routes({
        '/subscriptions/me': null,
        '/subscriptions/trial/status': { is_trial: false, is_trial_active: false, has_access: false },
        '/subscriptions/plans?active_only=true': [plan],
        '/subscriptions/history': [],
      }) as any
    )
  })

  it('shows the no-plans message without internal diagnostics', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/subscriptions/me': null,
      '/subscriptions/trial/status': { is_trial: false, has_access: false },
      '/subscriptions/plans?active_only=true': [{ ...plan, code: 'admin_month', price: 100 }],
      '/subscriptions/history': [],
    }) as any)
    const { container } = renderWithProviders(<Subscription />)
    await screen.findByText(/no.*plans/i)
    expect(container.querySelector('details')).toBeNull()
    expect(screen.queryByText(/Отладочная информация/)).not.toBeInTheDocument()
  })

  it('does not create a subscription itself when Stripe is down', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(503, 'Stripe not configured'))
    renderWithProviders(<Subscription />)

    await userEvent.click(await screen.findByRole('button', { name: /subscribe/i }))

    expect(await screen.findByText(/online payment is not available/i)).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/subscriptions/checkout/create-session', null, { params: { plan_id: 1 } })
  })

  it('shows statuses as words, not codes', async () => {
    vi.mocked(api.get).mockImplementation(
      routes({
        '/subscriptions/me': { id: 3, user_id: 7, plan_id: 1, status: 'pending_cancellation', is_trial: false, cancel_at_period_end: true, created_at: '2026-10-01T10:00:00' },
        '/subscriptions/trial/status': { is_trial: false },
        '/subscriptions/plans?active_only=true': [plan],
        '/subscriptions/history': [],
        '/subscriptions/3/transactions': [{ id: 1, subscription_id: 3, amount: 20, currency: 'eur', payment_method: 'card', status: 'succeeded', created_at: '2026-10-01T10:00:00', updated_at: '2026-10-01T10:00:00' }],
      }) as any
    )
    renderWithProviders(<Subscription />)

    await waitFor(() => expect(screen.getByText('Paid')).toBeInTheDocument())
    expect(screen.getAllByText('Pending Cancellation').length).toBeGreaterThan(0)
    expect(screen.queryByText('succeeded')).not.toBeInTheDocument()
  })

  it('lets a specialist on the signup trial buy a paid plan', async () => {
    vi.mocked(api.get).mockImplementation(
      routes({
        '/subscriptions/me': { id: 2, user_id: 7, plan_id: 8, status: 'active', is_trial: true, cancel_at_period_end: false, created_at: '2026-10-17T10:00:00', trial_end: '2026-10-31T10:00:00' },
        '/subscriptions/trial/status': { is_trial: true, trial_end: '2026-10-31T10:00:00' },
        '/subscriptions/plans?active_only=true': [plan],
        '/subscriptions/history': [],
      }) as any
    )
    vi.mocked(api.post).mockResolvedValue({ data: { url: '' } })
    renderWithProviders(<Subscription />)

    const subscribe = await screen.findByRole('button', { name: /^subscribe$/i })
    expect(subscribe).toBeEnabled()
    await userEvent.click(subscribe)
    expect(api.post).toHaveBeenCalledWith('/subscriptions/checkout/create-session', null, { params: { plan_id: 1 } })
  })

  it('names plans and their features by code in the UI language', async () => {
    useLocaleStore.setState({ locale: 'ru' })
    vi.mocked(api.get).mockImplementation(routes({
      '/subscriptions/me': null,
      '/subscriptions/trial/status': { is_trial: false },
      '/subscriptions/plans?active_only=true': [{ ...plan, code: 'solo_basic', name: 'Solo Basic', features: 'Schedule, online booking, clients' }],
      '/subscriptions/history': [],
    }) as any)
    renderWithProviders(<Subscription />)
    expect(await screen.findByText('Расписание, онлайн-запись, клиенты')).toBeInTheDocument()
    expect(screen.queryByText('Schedule, online booking, clients')).not.toBeInTheDocument()
  })
})
