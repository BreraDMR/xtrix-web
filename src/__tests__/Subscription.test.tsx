import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
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
        // 404: not on anyone's staff, a solo specialist
      })
    )
  })

  it('shows the no-plans message without internal diagnostics', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/subscriptions/me': null,
      '/subscriptions/trial/status': { is_trial: false, has_access: false },
      '/subscriptions/plans?active_only=true': [{ ...plan, code: 'admin_month', price: 100 }],
      '/subscriptions/history': [],
    }))
    const { container } = renderWithProviders(<Subscription />)
    await screen.findByText(/no.*plans/i)
    expect(container.querySelector('details')).toBeNull()
    expect(screen.queryByText(/Отладочная информация/)).not.toBeInTheDocument()
  })

  it.each([
    ['en', '/ month', '/ year'],
    ['ru', '/ месяц', '/ год'],
    ['cz', '/ měsíc', '/ rok'],
  ] as const)('labels monthly and annual prices by period in %s', async (locale, monthlyLabel, yearlyLabel) => {
    useLocaleStore.setState({ locale })
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    const plans = [
      { ...plan, id: 1, code: 'admin_unlimited_monthly', period_days: 30, price: 129 },
      { ...plan, id: 2, code: 'admin_unlimited_yearly', period_days: 365, price: 1248 },
      { ...plan, id: 3, code: 'admin_custom', period_days: 364, price: 999 },
      { ...plan, id: 4, code: 'admin_custom_leap', period_days: 366, price: 1249 },
    ]
    vi.mocked(api.get).mockImplementation(routes({
      '/subscriptions/me': null,
      '/subscriptions/trial/status': { is_trial: false, has_access: false },
      '/subscriptions/plans?active_only=true': plans,
      '/subscriptions/history': [],
    }))
    renderWithProviders(<Subscription />)
    for (const [price, label, otherLabel] of [
      [129, monthlyLabel, yearlyLabel], [1248, yearlyLabel, monthlyLabel],
      [999, monthlyLabel, yearlyLabel], [1249, yearlyLabel, monthlyLabel],
    ] as const) {
      const amount = await screen.findByText(`${price}€`)
      const priceLine = within(amount.parentElement!)
      expect(priceLine.getByText(label)).toBeInTheDocument()
      expect(priceLine.queryByText(otherLabel)).not.toBeInTheDocument()
    }
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
      })
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
      })
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
    }))
    renderWithProviders(<Subscription />)
    expect(await screen.findByText('Расписание, онлайн-запись, клиенты')).toBeInTheDocument()
    expect(screen.queryByText('Schedule, online booking, clients')).not.toBeInTheDocument()
  })

  it('lets a business owner buy a business plan for the team', async () => {
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    const businessPlan = { ...plan, id: 4, code: 'admin_up_to_7_employees', name: 'Admin: up to 7 employees', price: 79 }
    vi.mocked(api.get).mockImplementation(routes({
      '/subscriptions/me': { id: 9, user_id: 5, plan_id: 99, status: 'active', is_trial: true, cancel_at_period_end: false, created_at: '2026-10-17T10:00:00', trial_end: '2026-10-22T10:00:00' },
      '/subscriptions/trial/status': { is_trial: true, is_trial_active: true, has_access: true, trial_end: '2026-10-22T10:00:00' },
      '/subscriptions/plans?active_only=true': [plan, businessPlan],
      '/subscriptions/history': [],
    }))
    vi.mocked(api.post).mockResolvedValue({ data: { url: '' } })
    renderWithProviders(<Subscription />)

    expect(await screen.findByText('Business: up to 7 employees')).toBeInTheDocument()
    expect(screen.queryByText('Solo')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^subscribe$/i }))
    expect(api.post).toHaveBeenCalledWith('/subscriptions/checkout/create-session', null, { params: { plan_id: 4 } })
    expect(api.get).toHaveBeenCalledWith('/subscriptions/me')
  })

  it.each([
    ['an employee', { id: 8, role: 'employee' }],
    ['a specialist on the owner\'s staff', { id: 8, role: 'specialist', employer_id: 5, business_id: 1 }],
  ])('tells %s the owner pays, with no pay buttons', async (_who, user) => {
    signIn(user)
    vi.mocked(api.get).mockImplementation(routes({
      '/subscriptions/trial/status': { is_trial: false, has_access: true },
      '/subscriptions/plans?active_only=true': [plan],
    }))
    renderWithProviders(<Subscription />)

    expect(await screen.findByText(/paid by the business owner/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalledWith('/subscriptions/me')
    // /users/me says who employs them, no extra lookup
    expect(vi.mocked(api.get).mock.calls.map((c) => c[0])).not.toContain('/employees/by-user/8')
  })

  it('warns staff when the owner\'s subscription has lapsed', async () => {
    signIn({ id: 8, role: 'employee' })
    vi.mocked(api.get).mockImplementation(routes({
      '/subscriptions/trial/status': { is_trial: false, has_access: false },
      '/subscriptions/plans?active_only=true': [plan],
    }))
    renderWithProviders(<Subscription />)
    expect(await screen.findByText(/ask them to renew/i)).toBeInTheDocument()
  })

  it('switches to the staff message if checkout says staff cannot buy', async () => {
    vi.mocked(api.post).mockRejectedValue(apiError(403, 'Not allowed'))
    renderWithProviders(<Subscription />)
    await userEvent.click(await screen.findByRole('button', { name: /^subscribe$/i }))
    // a solo specialist by /users/me, nothing else to look up
    expect(vi.mocked(api.get).mock.calls.map((c) => c[0])).not.toContain('/employees/by-user/7')
    expect(await screen.findByText(/paid by the business owner/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument()
  })
})
