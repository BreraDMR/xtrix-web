import { afterAll, afterEach, beforeEach, expect, it } from 'vitest'
import { useAuthStore } from '../store/authStore'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitorProfile from '../pages/visitor/VisitorProfile'
import VisitorEmailChange from '../pages/visitor/VisitorEmailChange'
import { VisitorLogin } from '../pages/visitor/VisitorAuth'
import { RequireVisitor } from '../components/visitor/VisitorUi'
import { savePendingClaim } from '../components/visitor/links'
import { resetStores } from '../test/render'
import { error, mockVisitorApi, renderVisitor, resetVisitor, signInVisitor } from '../test/visitor'
import { useVisitorSession } from '../store/visitorSession'

const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true } })
afterAll(() => { if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow) })

const me = { status: 200, data: { id: 7, email: 'jana@example.com', email_verified_at: '2026-10-01T10:00:00Z', created_at: '2026-10-01T10:00:00Z', has_password: true, google_connected: false } }
const noGoogle = { 'GET /visitor/auth/google/config': { status: 200, data: { enabled: false, client_id: null } } }
const session = { session_token: 'fresh', expires_at: new Date(Date.now() + 86_400_000).toISOString() }
const routes = {
  '/visitor/profile': <RequireVisitor><VisitorProfile /></RequireVisitor>,
  '/visitor/login': <VisitorLogin />,
  '/visitor/email-change': <VisitorEmailChange />,
}

beforeEach(() => { resetStores(); resetVisitor(); signInVisitor() })
afterEach(() => { window.location.hash = '' })

it('shows the account and its sign-in methods', async () => {
  mockVisitorApi({ 'GET /visitor/me': me, ...noGoogle })
  renderVisitor(routes, '/visitor/profile')
  expect(await screen.findByText('jana@example.com', { selector: 'dd' })).toBeInTheDocument()
  expect(screen.getByText('Not connected')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Change password' })).toBeInTheDocument()
  // Google is off on this server: no empty Google block
  expect(screen.queryByText('Sign in with your Google account instead of a password.')).not.toBeInTheDocument()
})

it('asks to sign in again on the 5-minute rule and then repeats the email change', async () => {
  let requests = 0
  const { calls } = mockVisitorApi({
    'GET /visitor/me': me, ...noGoogle,
    'POST /visitor/auth/email/change/request': () => (++requests === 1 ? error(403, 'Please sign in again') : { status: 202, data: { message: 'sent' } }),
    'POST /visitor/auth/login': { status: 200, data: session },
    'POST /visitor/auth/logout': { status: 204 },
  })
  savePendingClaim({ kind: 'manage', token: 'waiting' })
  renderVisitor(routes, '/visitor/profile')
  await userEvent.type(await screen.findByLabelText('New email'), 'new@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Send the link' }))
  expect(await screen.findByRole('heading', { name: 'Sign in again' })).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Email'), 'jana@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  // back to the profile, not to the waiting booking link, and the request is repeated
  expect(await screen.findByText(/We've sent a link to new@example.com/)).toBeInTheDocument()
  expect(screen.getByTestId('location')).toHaveTextContent('/visitor/profile')
  expect(requests).toBe(2)
  expect(useVisitorSession.getState().session?.token).toBe('fresh')
  // the replaced session is revoked with its own token
  const logout = calls.find(call => call.url === '/visitor/auth/logout')!
  expect(logout.headers['X-Visitor-Token']).toBe('visitor-token')
})

it('shows a taken email under the field', async () => {
  mockVisitorApi({ 'GET /visitor/me': me, ...noGoogle, 'POST /visitor/auth/email/change/request': error(422, 'This email cannot be used') })
  renderVisitor(routes, '/visitor/profile')
  await userEvent.type(await screen.findByLabelText('New email'), 'bad@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Send the link' }))
  expect(await screen.findByText('This email cannot be used')).toBeInTheDocument()
})

it('confirms a new email from the link', async () => {
  window.location.hash = '#token=change-1'
  const { calls } = mockVisitorApi({ 'POST /visitor/auth/email/change/confirm': { status: 204 } })
  renderVisitor(routes, '/visitor/email-change')
  await userEvent.click(await screen.findByRole('button', { name: 'Confirm' }))
  expect(await screen.findByRole('heading', { name: 'Email changed' })).toBeInTheDocument()
  expect(JSON.parse(String(calls[0].data))).toEqual({ token: 'change-1' })
  expect(calls[0].headers['X-Visitor-Token']).toBe('visitor-token')
})

it('sends an email-change link opened without a session to sign in first', async () => {
  resetVisitor()
  window.location.hash = '#token=change-1'
  mockVisitorApi(noGoogle)
  renderVisitor(routes, '/visitor/email-change')
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/login?next=%2Fvisitor%2Femail-change'))
})

it('signs out everywhere after asking', async () => {
  const { calls } = mockVisitorApi({ 'GET /visitor/me': me, ...noGoogle, 'POST /visitor/auth/logout-all': { status: 204 } })
  renderVisitor(routes, '/visitor/profile')
  await userEvent.click(await screen.findByRole('button', { name: 'Sign out everywhere' }))
  await userEvent.click(within(screen.getByRole('dialog', { name: 'Sign out on all devices?' })).getByRole('button', { name: 'Sign out everywhere' }))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/login'))
  expect(calls.some(call => call.url === '/visitor/auth/logout-all')).toBe(true)
  expect(useVisitorSession.getState().session).toBeNull()
})

it('signs out locally even when the server call fails', async () => {
  mockVisitorApi({ 'GET /visitor/me': me, ...noGoogle, 'POST /visitor/auth/logout': error(500, 'Down') })
  renderVisitor(routes, '/visitor/profile')
  await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }))
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/visitor/login'))
  expect(useVisitorSession.getState().session).toBeNull()
})

it('sends the exact revoked token even though local sign-out clears it immediately', async () => {
  const owner = { id: 1, full_name: 'Jana', role: 'business_owner', business_id: 10 }
  useAuthStore.getState().setAuth('crm-token', owner)
  const { calls } = mockVisitorApi({ 'GET /visitor/me': me, ...noGoogle, 'POST /visitor/auth/logout': { status: 204 } })
  const { client } = renderVisitor(routes, '/visitor/profile')
  client.setQueryData(['clients'], ['CRM data'])
  await userEvent.click(await screen.findByRole('button', { name: 'Sign out', exact: true }))
  await waitFor(() => expect(calls.find(call => call.url === '/visitor/auth/logout')).toBeDefined())
  const logout = calls.find(call => call.url === '/visitor/auth/logout')!
  expect(logout.headers['X-Visitor-Token']).toBe('visitor-token')
  expect(logout.headers.Authorization).toBeUndefined()
  expect(useVisitorSession.getState().session).toBeNull()
  expect(useAuthStore.getState().token).toBe('crm-token')
  expect(client.getQueryData(['clients'])).toEqual(['CRM data'])
  expect(client.getQueryData(['visitor', 'me'])).toBeUndefined()
})

it('clears all locally revoked credentials after confirming the new contact and keeps the success screen', async () => {
  window.location.hash = '#token=change-1'
  mockVisitorApi({ 'POST /visitor/auth/email/change/confirm': { status: 204 } })
  renderVisitor(routes, '/visitor/email-change')
  await userEvent.click(await screen.findByRole('button', { name: 'Confirm', exact: true }))
  expect(await screen.findByRole('heading', { name: 'Email changed' })).toBeInTheDocument()
  expect(useVisitorSession.getState().session).toBeNull()
  expect(sessionStorage.getItem('visitor_session')).toBeNull()
  expect(sessionStorage.getItem('visitor_email_change_token')).toBeNull()
  expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute('href', '/visitor/login')
})

it('shows the confirmed contact in the profile', async () => {
  mockVisitorApi({ 'GET /visitor/me': me, ...noGoogle })
  renderVisitor(routes, '/visitor/profile')
  expect(await screen.findByText('Email verified')).toBeInTheDocument()
})

it('keeps the session when signing out everywhere fails and allows retry', async () => {
  let attempts = 0
  mockVisitorApi({ 'GET /visitor/me': me, ...noGoogle,
    'POST /visitor/auth/logout-all': () => ++attempts === 1 ? error(503, 'Try later') : { status: 204 },
  })
  renderVisitor(routes, '/visitor/profile')
  await userEvent.click(await screen.findByRole('button', { name: 'Sign out everywhere' }))
  const dialog = screen.getByRole('dialog', { name: 'Sign out on all devices?' })
  await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out everywhere' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Try later')
  expect(useVisitorSession.getState().session?.token).toBe('visitor-token')
  await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out everywhere' }))
  await waitFor(() => expect(useVisitorSession.getState().session).toBeNull())
  expect(attempts).toBe(2)
})
