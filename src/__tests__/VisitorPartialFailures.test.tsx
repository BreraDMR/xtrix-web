import { beforeEach, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitorVisits from '../pages/visitor/VisitorVisits'
import VisitorProfile from '../pages/visitor/VisitorProfile'
import { VisitorLogin } from '../pages/visitor/VisitorAuth'
import Landing from '../pages/Landing'
import api from '../api/client'
import { renderWithProviders, resetStores, routes } from '../test/render'
import { error, mockVisitorApi, renderVisitor, resetVisitor, signInVisitor } from '../test/visitor'
import type { Schema } from '../api/types'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))

const visit = (id: number, overrides: Record<string, unknown> = {}) => ({
  id, business_id: id, start: '2030-11-20T09:00:00Z', end: '2030-11-20T10:00:00Z', status: 'planned', confirmed_at: null,
  service_name: `Service ${id}`, staff_name: null, price: { amount: '100.00', currency: 'CZK' }, items: [],
  business: { name: `Salon ${id}`, address: null, phone: null, email: null, timezone: 'Europe/Prague' }, ...overrides,
}) as Schema<'VisitorHistoryVisit'>
const me = { status: 200, data: { id: 7, email: 'jana@example.com', email_verified_at: '2026-10-01T10:00:00Z', created_at: '2026-10-01T10:00:00Z', has_password: true, google_connected: false } }

beforeEach(() => { resetStores(); resetVisitor(); vi.mocked(api.get).mockImplementation(routes({})) })

it('shows the other visits when one card cannot be drawn', async () => {
  signInVisitor()
  // a salon sent a visit the card can't read
  const broken = visit(2, { items: null })
  mockVisitorApi({ 'GET /visitor/visits': { status: 200, data: { entries: [visit(1), broken, visit(3)], next_cursor: null } } })
  // the error boundary catches it; keep jsdom and React from printing the expected failure
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const swallow = (event: ErrorEvent) => event.preventDefault()
  window.addEventListener('error', swallow)
  renderVisitor({ '/visitor/visits': <VisitorVisits /> }, '/visitor/visits')
  expect(await screen.findByText('Service 1')).toBeInTheDocument()
  expect(screen.getByText('Service 3')).toBeInTheDocument()
  expect(screen.getByText("This visit can't be shown right now.")).toBeInTheDocument()
  window.removeEventListener('error', swallow)
  vi.mocked(console.error).mockRestore()
})

it('keeps the profile and sign-out working when Google config fails', async () => {
  signInVisitor()
  mockVisitorApi({ 'GET /visitor/me': me, 'GET /visitor/auth/google/config': error(500, 'Down') })
  renderVisitor({ '/visitor/profile': <VisitorProfile /> }, '/visitor/profile')
  expect(await screen.findByText('jana@example.com', { selector: 'dd' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByRole('region', { name: 'Connect Google' })).not.toBeInTheDocument())
})

it('keeps sign-out available when the account cannot be loaded', async () => {
  signInVisitor()
  mockVisitorApi({ 'GET /visitor/me': error(500, 'Down'), 'GET /visitor/auth/google/config': error(503, 'Off') })
  renderVisitor({ '/visitor/profile': <VisitorProfile /> }, '/visitor/profile')
  expect(await screen.findByRole('alert')).toHaveTextContent('Down')
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
})

it('signs in with a password and reads visits while email sending is down', async () => {
  const session = { session_token: 'fresh', expires_at: new Date(Date.now() + 86_400_000).toISOString() }
  mockVisitorApi({
    'GET /visitor/auth/google/config': error(503, 'Google is not configured'),
    'POST /visitor/auth/login': { status: 200, data: session },
    'POST /visitor/auth/register/request': error(503, 'Email sending is not configured'),
    'GET /visitor/visits': { status: 200, data: { entries: [visit(1)], next_cursor: null } },
  })
  renderVisitor({ '/visitor/login': <VisitorLogin />, '/visitor/visits': <VisitorVisits /> }, '/visitor/login')
  await userEvent.type(screen.getByLabelText('Email'), 'jana@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByText('Service 1')).toBeInTheDocument()
})

it('links salon clients to their account from the landing page', () => {
  renderWithProviders(<Landing />)
  expect(screen.getAllByRole('link', { name: 'Client account' })[0]).toHaveAttribute('href', '/visitor/visits')
})
