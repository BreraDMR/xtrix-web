import { beforeEach, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Landing from '../pages/Landing'
import api from '../api/client'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'
import { useLocaleStore } from '../store/localeStore'
import { useAuthStore } from '../store/authStore'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); resetStores(); vi.mocked(api.get).mockImplementation(routes({})) })

it('keeps guest login and registration destinations and all public section anchors', async () => {
  renderWithProviders(<Landing />)
  const main = screen.getByRole('main')
  expect(within(main).getByRole('link', { name: 'Try for free' })).toHaveAttribute('href', '/register')
  expect(within(main).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  expect(screen.getByRole('link', { name: 'Xtrix' })).toHaveAttribute('href', '/')
  for (const id of ['features', 'tour', 'pricing', 'faq', 'contact']) expect(document.getElementById(id)).toBeInTheDocument()
  expect(await screen.findByText('No plans are available yet.')).toBeInTheDocument()
})

it('uses workspace destinations only for a complete authenticated session', () => {
  signIn({ id: 7, role: 'business_owner' })
  renderWithProviders(<Landing />)
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Open CRM' })).toHaveAttribute('href', '/app')
  expect(screen.queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Try for free' })).not.toBeInTheDocument()
})

it('keeps guest actions when a token has no account', () => {
  useAuthStore.setState({ token: 'incomplete-session', user: null })
  renderWithProviders(<Landing />)
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  expect(screen.queryByRole('link', { name: 'Open CRM' })).not.toBeInTheDocument()
})

it.each([
  ['en', 'Illustrative workspace · fictional appointments and clients'],
  ['ru', 'Пример рабочего пространства · вымышленные визиты и клиенты'],
  ['cz', 'Ukázka pracovního prostoru · smyšlené návštěvy a klienti'],
] as const)('clearly identifies the sample workspace in %s', (locale, notice) => {
  useLocaleStore.setState({ locale })
  renderWithProviders(<Landing />)
  expect(screen.getByRole('figure', { name: notice })).toBeInTheDocument()
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
})

it('opens the named mobile navigation by keyboard and closes it with Escape or a link', async () => {
  renderWithProviders(<Landing />)
  const button = screen.getByRole('button', { name: 'Navigation menu' })
  expect(button).toHaveAttribute('aria-expanded', 'false')
  button.focus()
  await userEvent.keyboard(' ')
  expect(button).toHaveAttribute('aria-expanded', 'true')
  let menu = document.getElementById(button.getAttribute('aria-controls')!)!
  expect(within(menu).getByRole('link', { name: 'Try for free' })).toHaveAttribute('href', '/register')
  await userEvent.keyboard('{Escape}')
  expect(button).toHaveAttribute('aria-expanded', 'false')
  expect(document.getElementById(button.getAttribute('aria-controls')!)).not.toBeInTheDocument()
  await userEvent.keyboard('{Enter}')
  menu = document.getElementById(button.getAttribute('aria-controls')!)!
  await userEvent.click(within(menu).getByRole('link', { name: 'Features' }))
  expect(button).toHaveAttribute('aria-expanded', 'false')
})
