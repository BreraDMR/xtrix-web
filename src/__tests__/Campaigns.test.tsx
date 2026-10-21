import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import api from '../api/client'
import Campaigns from '../pages/Campaigns'
import Unsubscribe from '../pages/Unsubscribe'
import { apiError, renderWithProviders, resetStores, routes } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

const BUSINESS = {
  id: 1,
  name: 'Alpha Salon',
  business_type: 'salon',
  currency: 'EUR',
  timezone: 'Europe/Prague',
}

function campaign(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    business_id: 1,
    name: 'Win back',
    subject: 'We miss you, {name}',
    body: 'Hello {name}, book with {business} again.',
    segment_kind: 'no_visits',
    inactive_days: 60,
    scheduled_at: null,
    status: 'draft',
    audience_hash: null,
    content_hash: null,
    recipient_count: 0,
    queued_count: 0,
    confirmed_at: null,
    confirmed_by: null,
    created_by: 1,
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    ...overrides,
  }
}

function preview(overrides: Record<string, unknown> = {}) {
  return {
    campaign_id: 1,
    status: 'draft',
    audience_source: 'draft',
    audience_hash: 'audience-hash',
    content_hash: 'content-hash',
    recipient_count: 2,
    limit: 500,
    over_limit: false,
    recipients: [
      { client_id: 1, name: 'Anna', email: 'a***@example.com', last_visit_at: null },
      { client_id: 2, name: 'Boris', email: 'b***@example.com', last_visit_at: null },
    ],
    provider_ready: true,
    notifications_enabled: true,
    requires_confirmation: true,
    send_ready: false,
    excluded_after_confirmation: 0,
    ...overrides,
  }
}

function campaignPage(items: unknown[]) {
  return { items, page: 1, pages: 1, per_page: 20, total: items.length }
}

beforeEach(() => {
  vi.resetAllMocks()
  resetStores()
  window.history.replaceState(null, '', '/')
})

describe('campaign workspace', () => {
  it('freezes a draft, sends it, and never sends before confirmation', async () => {
    let status = 'draft'
    const detail = () =>
      campaign({
        status,
        recipient_count: status === 'draft' ? 0 : 2,
        queued_count: status === 'sending' || status === 'sent' ? 2 : 0,
        audience_hash: status === 'draft' ? null : 'audience-hash',
        content_hash: status === 'draft' ? null : 'content-hash',
      })
    const previewData = () =>
      preview({
        status,
        audience_source: status === 'draft' ? 'draft' : 'frozen',
        requires_confirmation: status === 'draft',
        send_ready: status === 'confirmed',
      })

    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/businesses/me') return Promise.resolve({ data: BUSINESS })
      if (url === '/businesses/me/campaigns') {
        return Promise.resolve({ data: campaignPage([campaign({ status })]) })
      }
      if (url === '/businesses/me/campaigns/1') return Promise.resolve({ data: detail() })
      if (url === '/businesses/me/campaigns/1/preview') return Promise.resolve({ data: previewData() })
      if (url === '/businesses/me/campaigns/1/stats') {
        status = 'sent'
        return Promise.resolve({
          data: {
            campaign_id: 1,
            status: 'sent',
            audience: 2,
            queued: 2,
            excluded_after_confirmation: 0,
            pending: 0,
            processing: 0,
            sent: 0,
            delivered: 0,
            captured: 2,
            skipped: 0,
            failed: 0,
            errors: 0,
            cancelled: 0,
            unsubscribed: 0,
            opens_tracked: false,
            revenue_tracked: false,
          },
        })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)

    vi.mocked(api.post).mockImplementation(((url: string) => {
      if (url === '/businesses/me/campaigns/1/confirm') {
        status = 'confirmed'
        return Promise.resolve({ data: detail() })
      }
      if (url === '/businesses/me/campaigns/1/send') {
        status = 'sending'
        return Promise.resolve({ data: detail() })
      }
      return Promise.reject(apiError(404, `no mock for ${url}`))
    }) as never)

    renderWithProviders(<Campaigns />)

    expect(await screen.findByRole('heading', { name: 'Win back' })).toBeInTheDocument()
    expect(screen.getByText('Audience is counted at confirmation')).toBeInTheDocument()
    expect(screen.queryByText('Will receive: 0')).not.toBeInTheDocument()
    expect(screen.getByText('Hello {name}, book with {business} again.')).toBeInTheDocument()
    expect(screen.getByText('a***@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send campaign' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Confirm audience and text' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Freeze this audience and text?')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/businesses/me/campaigns/1/confirm')
    })

    const send = await screen.findByRole('button', { name: 'Send campaign' })
    await waitFor(() => expect(send).toBeEnabled())
    await userEvent.click(send)
    await userEvent.click(await screen.findByRole('button', { name: 'Send' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/businesses/me/campaigns/1/send')
    })
    expect(await screen.findByText('Delivery summary')).toBeInTheDocument()
    expect(await screen.findByText('Captured locally')).toBeInTheDocument()
    expect(screen.getByText('Opens and revenue are not tracked, so this summary shows only delivery states.')).toBeInTheDocument()
  })

  it('disables sending until the provider is ready', async () => {
    vi.mocked(api.get).mockImplementation(routes({
      '/businesses/me': BUSINESS,
      '/businesses/me/campaigns': campaignPage([
        campaign({ status: 'confirmed', recipient_count: 2, audience_hash: 'a', content_hash: 'b' }),
      ]),
      '/businesses/me/campaigns/1': campaign({
        status: 'confirmed',
        recipient_count: 2,
        audience_hash: 'a',
        content_hash: 'b',
      }),
      '/businesses/me/campaigns/1/preview': preview({
        status: 'confirmed',
        audience_source: 'frozen',
        requires_confirmation: false,
        send_ready: false,
        provider_ready: false,
      }),
    }))

    renderWithProviders(<Campaigns />)

    const send = await screen.findByRole('button', { name: 'Send campaign' })
    expect(send).toBeDisabled()
    expect(
      screen.getByText('Email provider is not connected, sending is disabled.'),
    ).toBeInTheDocument()
  })

  it('explains that campaigns are not available to this role', async () => {
    vi.mocked(api.get).mockImplementation(((url: string) => {
      if (url === '/businesses/me') return Promise.resolve({ data: BUSINESS })
      return Promise.reject(apiError(403, 'Forbidden'))
    }) as never)

    renderWithProviders(<Campaigns />)

    expect(await screen.findByText('You do not have access to campaigns.')).toBeInTheDocument()
  })
})

describe('public unsubscribe page', () => {
  it('unsubscribes a signed link once and shows the final state', async () => {
    window.history.replaceState(null, '', '/unsubscribe#token=7.1.signed')
    vi.mocked(api.get).mockResolvedValue({
      data: {
        business_name: 'Alpha Salon',
        email: 'a***@example.com',
        status: 'subscribed',
        channel: 'email',
      },
    } as never)
    vi.mocked(api.post).mockResolvedValue({
      data: {
        business_name: 'Alpha Salon',
        email: 'a***@example.com',
        status: 'unsubscribed',
        channel: 'email',
      },
    } as never)

    renderWithProviders(<Unsubscribe />)

    expect(await screen.findByRole('heading', { name: 'Email preferences' })).toBeInTheDocument()
    expect(screen.getByText('Alpha Salon')).toBeInTheDocument()
    expect(screen.getByText('This address is subscribed to marketing emails.')).toBeInTheDocument()
    expect(screen.getByText('a***@example.com')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/public/campaigns/unsubscribe', {
        token: '7.1.signed',
      })
    })
    expect(
      await screen.findByText('You are unsubscribed. This address will not receive marketing emails.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Unsubscribe' })).not.toBeInTheDocument()
  })

  it('rejects an invalid unsubscribe link without offering the action', async () => {
    window.history.replaceState(null, '', '/unsubscribe#token=broken')
    vi.mocked(api.get).mockRejectedValue(apiError(400, 'This unsubscribe link is invalid'))

    renderWithProviders(<Unsubscribe />)

    expect(
      await screen.findByText('This unsubscribe link is invalid or incomplete.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Unsubscribe' })).not.toBeInTheDocument()
  })
})
