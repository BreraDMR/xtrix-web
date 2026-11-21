import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationSettings from '../pages/NotificationSettings'
import api from '../api/client'
import type { NotificationSettingsOut } from '../api/types'
import { useLocaleStore } from '../store/localeStore'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

const settings: NotificationSettingsOut = {
  channel: 'email',
  reminder_time: '10:00',
  is_enabled: true,
  birthday_greetings_enabled: false,
  visit_followups_enabled: false,
  crm_visit_messages_enabled: true,
  provider_ready: true,
  available_channels: ['email'],
}

function mockApi(data: NotificationSettingsOut = settings) {
  vi.mocked(api.get).mockImplementation(routes({
    '/businesses/me/notification-settings': data,
    '/businesses/me': { id: 1, name: 'Alpha', timezone: 'Europe/Prague' },
    '/businesses/me/notification-deliveries': { items: [], total: 0, page: 1, per_page: 20, pages: 0 },
  }))
}

describe('NotificationSettings message types', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
    signIn({ id: 2, role: 'business_owner', business_id: 1 })
    mockApi()
  })

  it('shows each message type with its saved state', async () => {
    renderWithProviders(<NotificationSettings />)
    const birthday = (await screen.findByLabelText(/birthday greetings/i)) as HTMLSelectElement
    expect(birthday.value).toBe('off')
    expect((screen.getByLabelText(/thank-you note/i) as HTMLSelectElement).value).toBe('off')
    expect((screen.getByLabelText(/visit changes made in the crm/i) as HTMLSelectElement).value).toBe('on')
    // marketing types say they only reach clients who agreed to it
    expect(screen.getAllByText(/agreed to marketing/i).length).toBeGreaterThan(0)
  })

  it('saves the switched message types together with the rest', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { ...settings, birthday_greetings_enabled: true } })
    renderWithProviders(<NotificationSettings />)
    await userEvent.selectOptions(await screen.findByLabelText(/birthday greetings/i), 'on')
    await userEvent.selectOptions(screen.getByLabelText(/visit changes made in the crm/i), 'off')
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => expect(api.put).toHaveBeenCalled())
    expect(api.put).toHaveBeenCalledWith('/businesses/me/notification-settings', {
      channel: 'email',
      reminder_time: '10:00',
      is_enabled: true,
      birthday_greetings_enabled: true,
      visit_followups_enabled: false,
      crm_visit_messages_enabled: false,
    })
  })

  it('speaks Russian and Czech too', async () => {
    useLocaleStore.setState({ locale: 'ru' })
    const { unmount } = renderWithProviders(<NotificationSettings />)
    expect(await screen.findByLabelText(/поздравления с днём рождения/i)).toBeInTheDocument()
    unmount()
    useLocaleStore.setState({ locale: 'cz' })
    renderWithProviders(<NotificationSettings />)
    expect(await screen.findByLabelText(/přání k narozeninám/i)).toBeInTheDocument()
  })
})
