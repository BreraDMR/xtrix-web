import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import AssistantLauncher from '../components/assistant/AssistantLauncher'
import api from '../api/client'
import { setSavedConversationId } from '../hooks/useConversations'
import { useLocaleStore } from '../store/localeStore'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

type Gender = 'female' | 'male' | 'neuter'
const persona = (name = 'Sasha', gender: Gender = 'female', is_default = true) => ({ name, gender, is_default })

const status = (over: Record<string, unknown> = {}) => ({
  enabled: true, voice_enabled: false, assistant: persona(), limit: 100, used: 3,
  resets_at: '2026-11-01T00:00:00Z', period: 'month', ...over,
})

const display = (over: Record<string, unknown> = {}) => ({
  client_name: null, service_name: null, specialist_name: null, start_time: null, end_time: null, note: null, ...over,
})

const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString()

const bookingPlan = (over: Record<string, unknown> = {}) => ({
  plan_id: 'plan-1',
  summary: 'Book Clara for a haircut',
  questions: [],
  actions: [
    { action: 'find_client', ref: 'c', name: 'Clara', phone: null, email: null, display: display({ client_name: 'Clara Client' }) },
    {
      action: 'create_visit', client_id: null, client_ref: 'c', specialist_id: null, service_id: 7, start: '2026-10-20T08:00:00Z',
      slot_ref: null, duration_minutes: null, note: null,
      display: display({ client_name: 'Clara Client', service_name: 'Haircut', specialist_name: 'Olga Owner',
        start_time: '2026-10-20T08:00:00Z', end_time: '2026-10-20T09:00:00Z' }),
    },
  ],
  assistant: persona(),
  expires_at: inMinutes(10),
  ...over,
})

const executed = (over: Record<string, unknown> = {}) => ({
  ok: true, done_count: 2, failed_index: null,
  results: [
    { index: 0, action: 'find_client', status: 'done', data: { client_id: 4 }, error: null },
    { index: 1, action: 'create_visit', status: 'done', data: { visit_id: 9 }, error: null },
  ],
  ...over,
})

function mockStatus(value = status()) {
  // an existing chat keeps the tests on one POST per request instead of creating a conversation first
  setSavedConversationId('conv-1', 5, 1)
  vi.mocked(api.get).mockImplementation(routes({
    '/assistant/status': value,
    '/businesses/me': null,
    '/assistant/conversations': {
      items: [{ id: 'conv-1', title: 'Chat', created_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-20T10:00:00Z', archived_at: null }],
      total: 1,
      limit: 50,
      offset: 0,
    },
    '/assistant/conversations/conv-1/messages': { items: [], next_before: null },
  }))
}

function networkError() {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  return new AxiosError('Network Error', 'ERR_NETWORK', config, {})
}

const launcher = () => screen.getByRole('button', { name: /open the assistant|открыть помощника|otevřít asistenta/i })
const input = () => screen.findByRole('textbox', { name: /type a request|напишите запрос|napište požadavek/i })

async function openPanel() {
  await userEvent.click(launcher())
  return screen.findByRole('dialog')
}

async function ask(text: string) {
  const box = await input()
  await userEvent.type(box, text)
  await userEvent.click(screen.getByRole('button', { name: /^(send|отправить|odeslat)$/i }))
}

describe('assistant launcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    mockStatus()
  })

  it('is there for every staff role and not for others', () => {
    for (const role of ['admin', 'business_owner', 'specialist', 'employee']) {
      signIn({ id: 5, role, business_id: 1 })
      const { unmount } = renderWithProviders(<AssistantLauncher />)
      expect(launcher()).toBeInTheDocument()
      unmount()
    }
    signIn({ id: 5, role: 'client' })
    renderWithProviders(<AssistantLauncher />)
    expect(screen.queryByRole('button', { name: /open the assistant/i })).not.toBeInTheDocument()
  })

  it("doesn't ask for the status until the panel is opened", async () => {
    renderWithProviders(<AssistantLauncher />)
    expect(api.get).not.toHaveBeenCalledWith('/assistant/status')
    await openPanel()
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/assistant/status'))
  })

  it("shows the server's name for the assistant and the usage", async () => {
    mockStatus(status({ assistant: persona('Marek', 'male', false), used: 3, limit: 100 }))
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()
    expect(await within(panel).findByRole('heading', { name: 'Marek' })).toBeInTheDocument()
    expect(within(panel).getByText('3 of 100 requests this month')).toBeInTheDocument()
    expect(panel).toHaveAccessibleName('Marek')
  })

  it('counts a pilot daily allowance as today, not as this month', async () => {
    mockStatus(status({ used: 7, limit: 50, period: 'day', resets_at: '2026-10-23T00:00:00Z' }))
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()
    expect(await within(panel).findByText('7 of 50 requests today')).toBeInTheDocument()
    expect(within(panel).queryByText(/this month/)).not.toBeInTheDocument()
  })

  it("explains that the assistant isn't set up yet and offers no input", async () => {
    useLocaleStore.setState({ locale: 'ru' })
    mockStatus(status({ enabled: false, assistant: persona('Сашенька') }))
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()
    expect(await within(panel).findByText(/Сашенька ещё не настроена/)).toBeInTheDocument()
    expect(within(panel).queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows a retry when the status fails to load', async () => {
    vi.mocked(api.get).mockImplementation(((url: string) => url === '/assistant/status'
      ? Promise.reject(apiError(500, 'boom')) : Promise.resolve({ data: null })) as typeof api.get)
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()
    expect(await within(panel).findByText("Couldn't load the assistant")).toBeInTheDocument()
    mockStatus()
    await userEvent.click(within(panel).getByRole('button', { name: 'Try again' }))
    expect(await input()).toBeInTheDocument()
  })
})

describe('focus and keyboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    mockStatus()
    vi.mocked(api.post).mockResolvedValue({ data: bookingPlan() })
  })

  it('puts the focus into the input and gives it back to the button on Escape', async () => {
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    const box = await input()
    await waitFor(() => expect(box).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(launcher()).toHaveFocus()
  })

  it('keeps Tab inside the panel when it covers the whole screen (phone)', async () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true, writable: true })
    try {
      renderWithProviders(<AssistantLauncher />)
      const panel = await openPanel()
      expect(panel).toHaveAttribute('aria-modal', 'true')
      const box = await input()
      await waitFor(() => expect(box).toHaveFocus())
      await userEvent.tab()
      expect(within(panel).getByRole('button', { name: 'Close' })).toHaveFocus()
      await userEvent.tab({ shift: true })
      expect(box).toHaveFocus()
    } finally {
      Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true })
    }
  })

  it('leaves the page usable next to the side panel on a wide screen', async () => {
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()
    expect(panel).not.toHaveAttribute('aria-modal')
  })

  it('closes with the close button too', async () => {
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()
    await userEvent.click(within(panel).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sends on Enter and keeps Shift+Enter for a new line', async () => {
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    const box = await input()
    await userEvent.type(box, 'Book Clara{Shift>}{Enter}{/Shift}tomorrow')
    expect(box).toHaveValue('Book Clara\ntomorrow')
    expect(api.post).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/assistant/plan', expect.objectContaining({
      text: 'Book Clara\ntomorrow', locale: 'en', conversation_id: 'conv-1', client_request_id: expect.any(String),
    })))
    await waitFor(() => expect(box).toHaveValue(''))
  })

  it("doesn't send blank text", async () => {
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await userEvent.type(await input(), '   {Enter}')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('announces new messages politely', async () => {
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()
    const log = within(panel).getByRole('log')
    expect(log).toHaveAttribute('aria-live', 'polite')
    await ask('Book Clara')
    expect(await within(log).findByText('Book Clara for a haircut')).toBeInTheDocument()
  })
})

describe('plan card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    mockStatus()
  })

  it('lists what will be done from the display data, with Confirm and Cancel', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: bookingPlan() })
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara for a haircut tomorrow at 10')

    const card = await screen.findByRole('article', { name: /Book Clara for a haircut/ })
    expect(within(card).getByText('Find the client')).toBeInTheDocument()
    expect(within(card).getByText('Book a visit')).toBeInTheDocument()
    expect(within(card).getAllByText('Clara Client')).toHaveLength(2)
    expect(within(card).getByText('Haircut')).toBeInTheDocument()
    expect(within(card).getByText('Olga Owner')).toBeInTheDocument()
    const start = new Date('2026-10-20T08:00:00Z')
    const hhmm = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    expect(within(card).getAllByText(new RegExp(hhmm)).some((el) => el.tagName === 'DD')).toBe(true)
    expect(within(card).getByText(/Valid for 9:5\d|Valid for 10:00/)).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Confirm' })).toBeEnabled()
    expect(within(card).getByRole('button', { name: 'Cancel' })).toBeEnabled()
    expect(screen.getByText('Sasha prepared a plan, check it and confirm')).toBeInTheDocument()
  })

  it('sends the UI language with the request', async () => {
    useLocaleStore.setState({ locale: 'cz' })
    vi.mocked(api.post).mockResolvedValue({ data: bookingPlan() })
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Zapiš Kláru')
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/assistant/plan', expect.objectContaining({
      text: 'Zapiš Kláru', locale: 'cz', conversation_id: 'conv-1', client_request_id: expect.any(String),
    })))
  })

  it("shows the model's questions and no Confirm, then sends the answer with the first request", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: bookingPlan({ plan_id: 'plan-q', summary: 'Need a time', questions: ['What time?', 'Which service?'], actions: [] }),
    })
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara tomorrow')
    const card = await screen.findByRole('article', { name: /Need a time/ })
    expect(within(card).getByText('Sasha asks:')).toBeInTheDocument()
    expect(within(card).getByText('What time?')).toBeInTheDocument()
    expect(within(card).getByText('Which service?')).toBeInTheDocument()
    expect(within(card).getByText('Answer in a new message')).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()

    vi.mocked(api.post).mockResolvedValueOnce({ data: bookingPlan({ plan_id: 'plan-2' }) })
    await ask('at 10, haircut')
    await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/assistant/plan', expect.objectContaining({
      text: 'Book Clara tomorrow\nat 10, haircut', locale: 'en', conversation_id: 'conv-1', client_request_id: expect.any(String),
    })))
    expect(await screen.findByRole('article', { name: /Book Clara for a haircut/ })).toBeInTheDocument()
  })

  it("says it didn't understand when there is nothing to do", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: bookingPlan({ summary: '', actions: [] }) })
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('hello')
    expect(await screen.findByText("Sasha didn't understand the request, try rephrasing it")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })

  it('closes an older open plan when a newer one comes', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: bookingPlan({ plan_id: 'old', summary: 'Old plan' }) })
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('first')
    await screen.findByRole('article', { name: /Old plan/ })
    vi.mocked(api.post).mockResolvedValueOnce({ data: bookingPlan({ plan_id: 'new', summary: 'New plan' }) })
    await ask('second')
    await screen.findByRole('article', { name: /New plan/ })
    const old = screen.getByRole('article', { name: /Old plan/ })
    expect(within(old).getByText('Replaced by a newer plan')).toBeInTheDocument()
    expect(within(old).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Confirm' })).toHaveLength(1)
  })

  it('cancels without calling the API', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: bookingPlan() })
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    const card = await screen.findByRole('article', { name: /Book Clara for a haircut/ })
    await userEvent.click(within(card).getByRole('button', { name: 'Cancel' }))
    expect(within(card).getByText('Cancelled, nothing was changed')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Type a request…' })).toHaveFocus()
    expect(within(card).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
    expect(api.post).toHaveBeenCalledTimes(1)
  })

  it('turns an expired plan into "send again" without a Confirm', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: bookingPlan({ expires_at: new Date(Date.now() + 1200).toISOString() }) })
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    const card = await screen.findByRole('article', { name: /Book Clara for a haircut/ })
    await waitFor(() => expect(within(card).getByText('This plan has expired, send the request again')).toBeInTheDocument(), { timeout: 3000 })
    expect(within(card).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })
})

describe('confirming a plan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    mockStatus()
  })

  async function planReady(plan = bookingPlan()) {
    vi.mocked(api.post).mockResolvedValueOnce({ data: plan })
    const view = renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    const card = await screen.findByRole('article', { name: new RegExp(plan.summary as string) })
    return { ...view, card }
  }

  it('runs the saved plan, shows each result and refreshes visits and clients', async () => {
    const { card, queryClient } = await planReady()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    vi.mocked(api.post).mockResolvedValueOnce({ data: executed() })
    await userEvent.click(within(card).getByRole('button', { name: 'Confirm' }))

    await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/assistant/execute', { plan_id: 'plan-1' }))
    expect(await screen.findByText('Sasha booked the visit')).toBeInTheDocument()
    expect(within(card).getAllByText('Done')).toHaveLength(2)
    // the Confirm button is gone, so the focus goes back to the input instead of getting lost
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Type a request…' })).toHaveFocus())
    expect(within(card).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()

    const keys = invalidate.mock.calls.map(([filters]) => filters)
    const touched = (key: string) => keys.some((f) => typeof f?.predicate === 'function'
      ? f.predicate({ queryKey: [key] } as never) : f?.queryKey?.[0] === key)
    for (const key of ['visits', 'clients', 'visits-statistics', 'clients-statistics', 'client-visits', 'assistant-status']) {
      expect(touched(key), key).toBe(true)
    }
    expect(touched('employees')).toBe(false)
  })

  it('says it in the gender of the assistant', async () => {
    useLocaleStore.setState({ locale: 'ru' })
    mockStatus(status({ assistant: persona('Сашенька', 'female') }))
    const { card } = await planReady(bookingPlan({ assistant: persona('Сашенька', 'female') }))
    vi.mocked(api.post).mockResolvedValueOnce({ data: executed() })
    await userEvent.click(within(card).getByRole('button', { name: 'Подтвердить' }))
    expect(await screen.findByText('Сашенька записала визит')).toBeInTheDocument()
  })

  it('uses the male form for a male assistant', async () => {
    useLocaleStore.setState({ locale: 'ru' })
    mockStatus(status({ assistant: persona('Марк', 'male', false) }))
    const { card } = await planReady(bookingPlan({ assistant: persona('Марк', 'male', false) }))
    vi.mocked(api.post).mockResolvedValueOnce({ data: executed() })
    await userEvent.click(within(card).getByRole('button', { name: 'Подтвердить' }))
    expect(await screen.findByText('Марк записал визит')).toBeInTheDocument()
  })

  it('shows which action failed, why, and what was skipped', async () => {
    const plan = bookingPlan({
      actions: [...bookingPlan().actions, { action: 'add_note', visit_id: 3, text: 'call back', display: display({ note: 'call back' }) }],
    })
    const { card } = await planReady(plan)
    vi.mocked(api.post).mockResolvedValueOnce({
      data: executed({
        ok: false, done_count: 1, failed_index: 1,
        results: [
          { index: 0, action: 'find_client', status: 'done', data: {}, error: null },
          { index: 1, action: 'create_visit', status: 'failed', data: {},
            error: { status: 409, code: 'visit_overlap', message: 'The specialist already has a visit at this time' } },
          { index: 2, action: 'add_note', status: 'skipped', data: {}, error: null },
        ],
      }),
    })
    await userEvent.click(within(card).getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByText('Sasha completed 1 of 3 actions')).toBeInTheDocument()
    expect(within(card).getByText('The specialist already has a visit at this time')).toBeInTheDocument()
    expect(within(card).getByText('Failed')).toBeInTheDocument()
    expect(within(card).getByText('Skipped')).toBeInTheDocument()
  })

  it('tells an expired plan apart on execute (404 plan_not_found)', async () => {
    const { card } = await planReady()
    vi.mocked(api.post).mockRejectedValueOnce(apiError(404, 'Plan not found', { code: 'plan_not_found' }))
    await userEvent.click(within(card).getByRole('button', { name: 'Confirm' }))
    expect(await within(card).findByText('This plan has expired, send the request again')).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })

  it('keeps the plan open after a network error on execute', async () => {
    const { card } = await planReady()
    vi.mocked(api.post).mockRejectedValueOnce(networkError())
    await userEvent.click(within(card).getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByText('No connection to the server, check the internet and try again')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Confirm' })).toBeEnabled()
  })

  it("doesn't send a second execute while the first runs", async () => {
    const { card } = await planReady()
    let finish: (value: unknown) => void = () => {}
    vi.mocked(api.post).mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const confirm = within(card).getByRole('button', { name: 'Confirm' })
    await userEvent.click(confirm)
    expect(await within(card).findByText('Sasha is on it…')).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
    await act(async () => finish({ data: executed() }))
    expect(api.post).toHaveBeenCalledTimes(2)
  })
})

describe('errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
    mockStatus()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const send = () => screen.getByRole('button', { name: /^send$/i })

  it('429 ai_limit_reached: says when the limit resets and blocks sending', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(429, 'Limit', { code: 'ai_limit_reached', limit: 100, used: 100 },
      { headers: { 'retry-after': '86400' } }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    const date = new Date('2026-11-01T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    expect(await screen.findByText(`This month's assistant limit is used up. It resets on ${date}.`)).toBeInTheDocument()
    expect(send()).toBeDisabled()
  })

  it('blocks sending right away when the status says the limit is used up', async () => {
    mockStatus(status({ used: 100, limit: 100 }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    expect(await screen.findByText(/This month's assistant limit is used up/)).toBeInTheDocument()
    expect(send()).toBeDisabled()
  })

  it('says a used up daily allowance comes back tomorrow, not next month', async () => {
    mockStatus(status({ used: 50, limit: 50, period: 'day', resets_at: '2026-10-23T00:00:00Z' }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    const date = new Date('2026-10-23T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    expect(await screen.findByText(`Today's assistant limit is used up. It resets on ${date}.`)).toBeInTheDocument()
    expect(screen.queryByText(/This month's/)).not.toBeInTheDocument()
    expect(send()).toBeDisabled()
  })

  it('503 ai_busy: counts down Retry-After and unblocks sending', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(503, 'Busy', { code: 'ai_busy', retry_after: 2 }, { headers: { 'retry-after': '2' } }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    expect(await screen.findByText(/Sasha is busy right now, try again in [12] s/)).toBeInTheDocument()
    expect(send()).toBeDisabled()
    await userEvent.type(await input(), 'again')
    expect(send()).toBeDisabled()
    await waitFor(() => expect(send()).toBeEnabled(), { timeout: 4000 })
    expect(screen.queryByText(/is busy right now/)).not.toBeInTheDocument()
  })

  it('503 ai_not_configured: reloads the status and explains', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(503, 'Not configured', { code: 'ai_not_configured' }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    mockStatus(status({ enabled: false }))
    await ask('Book Clara')
    expect(await screen.findByText(/Sasha isn't set up yet/)).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument())
  })

  it('503 ai_unavailable: asks to try later', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(503, 'Unavailable', { code: 'ai_unavailable' }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    expect(await screen.findByText("Sasha can't answer right now, try again a bit later")).toBeInTheDocument()
    expect(await input()).toHaveValue('Book Clara')
  })

  it('a network error keeps the text so it can be sent again', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(networkError())
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    expect(await screen.findByText('No connection to the server, check the internet and try again')).toBeInTheDocument()
    expect(await input()).toHaveValue('Book Clara')
    expect(send()).toBeEnabled()
  })

  it('other errors show the server message', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(422, 'Validation failed', {
      validation_errors: [{ field: 'body -> text', message: 'too long', code: 'string_too_long', params: { max_length: 2000 } }],
    }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    expect(await screen.findByRole('alert')).toHaveTextContent(/2000/)
  })

  it('a slowapi 429 without a code waits out Retry-After too', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(apiError(429, 'Rate limit exceeded', undefined, { headers: { 'retry-after': '2' }, type: 'RateLimitExceeded' }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    expect(await screen.findByRole('alert')).toHaveTextContent(/too many requests/i)
    expect(send()).toBeDisabled()
    await waitFor(() => expect(send()).toBeEnabled(), { timeout: 4000 })
  })

  it('caps the request at 2000 characters', async () => {
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    const box = await input()
    expect(box).toHaveAttribute('maxLength', '2000')
    fireEvent.change(box, { target: { value: 'x'.repeat(10) } })
    expect(box).toHaveValue('x'.repeat(10))
  })
})

describe('saved chats and history', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 5, role: 'business_owner', business_id: 1 })
  })

  const conv = (id: string, title: string) => ({
    id, title, created_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-20T10:00:00Z', archived_at: null,
  })
  const msg = (id: string, role: 'user' | 'assistant', text: string, over: Record<string, unknown> = {}) => ({
    id, conversation_id: 'conv-1', ordinal: 1, request_id: 'req-1', role, status: 'succeeded', text, ...over,
  })

  it('drops the previous chat right away when the next one fails to load', async () => {
    setSavedConversationId('conv-1', 5, 1)
    vi.mocked(api.get).mockImplementation(routes({
      '/assistant/status': status(),
      '/businesses/me': null,
      '/assistant/conversations': {
        items: [conv('conv-1', 'First Chat'), conv('conv-2', 'Second Chat')], total: 2, limit: 50, offset: 0,
      },
      '/assistant/conversations/conv-1/messages': {
        items: [msg('m1', 'user', 'Question about Tuesday'), msg('m2', 'assistant', 'Answer about Tuesday')],
        next_before: null,
      },
      // conv-2 messages are deliberately unmocked and fail with a 404
    }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    expect(await screen.findByText('Answer about Tuesday')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Second Chat'))

    await waitFor(() => expect(screen.queryByText('Answer about Tuesday')).not.toBeInTheDocument())
    expect(screen.queryByText('Question about Tuesday')).not.toBeInTheDocument()
    expect(screen.getByText('Sasha is ready to help')).toBeInTheDocument()
  })

  it('keeps a saved chat that is older than the first page instead of opening the newest one', async () => {
    setSavedConversationId('conv-old', 5, 1)
    vi.mocked(api.get).mockImplementation(routes({
      '/assistant/status': status(),
      '/businesses/me': null,
      '/assistant/conversations': {
        items: [conv('conv-new', 'Newest chat')], total: 2, limit: 1, offset: 0,
      },
      '/assistant/conversations/conv-old/messages': {
        items: [msg('m-old', 'user', 'From the old chat')], next_before: null,
      },
    }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()

    expect(await screen.findByText('From the old chat')).toBeInTheDocument()
    expect(screen.getByText('Newest chat')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/assistant/conversations/conv-old/messages', { params: undefined })
    expect(api.get).not.toHaveBeenCalledWith('/assistant/conversations/conv-new/messages', expect.anything())
  })

  it('loads older chats from the next page', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/assistant/status': status(),
      '/businesses/me': null,
      '/assistant/conversations': {
        items: [conv('conv-new', 'Newest chat')], total: 2, limit: 1, offset: 0,
      },
      '/assistant/conversations/conv-new/messages': { items: [], next_before: null },
    }))
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    expect(await screen.findByText('Newest chat')).toBeInTheDocument()

    const firstPage = vi.mocked(api.get).mock.results.length
    vi.mocked(api.get).mockImplementation(routes({
      '/assistant/status': status(),
      '/businesses/me': null,
      '/assistant/conversations': {
        items: [conv('conv-old', 'Older chat')], total: 2, limit: 1, offset: 1,
      },
      '/assistant/conversations/conv-old/messages': { items: [], next_before: null },
    }))
    await userEvent.click(screen.getByRole('button', { name: 'Show older chats' }))

    expect(await screen.findByText('Older chat')).toBeInTheDocument()
    expect(screen.getByText('Newest chat')).toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls.slice(firstPage)).toContainEqual([
      '/assistant/conversations', { params: { offset: 1 } },
    ])
    expect(screen.queryByRole('button', { name: 'Show older chats' })).not.toBeInTheDocument()
  })

  it('loads earlier messages and shows them oldest first', async () => {
    setSavedConversationId('conv-1', 5, 1)
    vi.mocked(api.get).mockImplementation(((url: string, config?: { params?: { before?: number } }) => {
      if (url === '/assistant/status') return Promise.resolve({ data: status() })
      if (url === '/businesses/me') return Promise.resolve({ data: null })
      if (url === '/assistant/conversations') {
        return Promise.resolve({ data: { items: [conv('conv-1', 'Chat')], total: 1, limit: 50, offset: 0 } })
      }
      if (url === '/assistant/conversations/conv-1/messages') {
        if (config?.params?.before === 100) {
          return Promise.resolve({ data: { items: [msg('m-old', 'user', 'Earlier question')], next_before: null } })
        }
        return Promise.resolve({ data: { items: [msg('m-new', 'assistant', 'Latest answer')], next_before: 100 } })
      }
      return Promise.reject(apiError(404, 'no mock'))
    }) as typeof api.get)
    renderWithProviders(<AssistantLauncher />)
    const panel = await openPanel()

    expect(await within(panel).findByText('Latest answer')).toBeInTheDocument()
    await userEvent.click(within(panel).getByRole('button', { name: 'Show earlier messages' }))

    expect(await within(panel).findByText('Earlier question')).toBeInTheDocument()
    expect(within(panel).getByText('Latest answer')).toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: 'Show earlier messages' })).not.toBeInTheDocument()
    const log = within(panel).getByRole('log').textContent ?? ''
    expect(log.indexOf('Earlier question')).toBeLessThan(log.indexOf('Latest answer'))
    expect(vi.mocked(api.get)).toHaveBeenCalledWith('/assistant/conversations/conv-1/messages', { params: { before: 100 } })
  })

  it('retries a lost request with the same key so the server can replay it', async () => {
    mockStatus()
    vi.mocked(api.post).mockRejectedValueOnce(networkError())
    renderWithProviders(<AssistantLauncher />)
    await openPanel()
    await ask('Book Clara')
    expect(await screen.findByText('No connection to the server, check the internet and try again')).toBeInTheDocument()
    expect(await input()).toHaveValue('Book Clara')

    vi.mocked(api.post).mockResolvedValueOnce({ data: bookingPlan() })
    await userEvent.click(screen.getByRole('button', { name: /^send$/i }))
    await screen.findByRole('article', { name: /Book Clara for a haircut/ })

    const planCalls = vi.mocked(api.post).mock.calls.filter(([url]) => url === '/assistant/plan')
    expect(planCalls).toHaveLength(2)
    const keyOf = (call: unknown[]) => (call[1] as { client_request_id: string }).client_request_id
    expect(keyOf(planCalls[1])).toBe(keyOf(planCalls[0]))
  })
})
