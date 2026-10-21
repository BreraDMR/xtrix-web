import { beforeEach, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pricing from '../components/marketing/Pricing'
import api from '../api/client'
import { renderWithProviders, resetStores, routes } from '../test/render'
import { useLocaleStore } from '../store/localeStore'

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
const offers = ['crm', 'ai'].flatMap(product => [100, 300, 700, 2000].map((visits, index) => ({
  code: `${product}_${['starter', product === 'ai' ? 'pro' : 'standard', 'business', 'large_business'][index]}_czk`,
  product, name: ['Start', 'Standard', 'Business', 'Large business'][index], status: 'approved',
  currency: 'CZK', interval: 'month', price: String([200, 400, 700, 1200][index]),
  entitlements: product === 'crm' ? { max_monthly_visits: visits } : { daily_requests_limit: [20, 50, 100, 200][index] },
})))
beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  vi.mocked(api.get).mockImplementation(routes({ '/offers': { offers, version: 'approved' } }))
})
it.each([
  ['en', 'Show more', 'Business', 'Up to 100 visits per month', 'Up to 20 requests per day'],
  ['ru', 'Показать больше', 'Бизнес', 'До 100 визитов в месяц', 'До 20 запросов в день'],
  ['cz', 'Zobrazit více', 'Business', 'Až 100 návštěv měsíčně', 'Až 20 požadavků denně'],
] as const)('shows two plans, reveals larger plans, and keeps CRM and AI separate in %s', async (locale, more, business, visits, requests) => {
  useLocaleStore.setState({ locale })
  renderWithProviders(<Pricing />)
  expect(await screen.findByText(visits)).toBeInTheDocument()
  expect(screen.getAllByRole('article')).toHaveLength(2)
  expect(screen.queryByRole('heading', { name: business })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: more }))
  expect(screen.getAllByRole('article')).toHaveLength(4)
  expect(screen.getByRole('heading', { name: business })).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByRole('combobox'), 'ai')
  expect(screen.getAllByRole('article')).toHaveLength(2)
  expect(screen.getByText(requests)).toBeInTheDocument()
  expect(screen.queryByText(visits)).not.toBeInTheDocument()
  expect(screen.getAllByRole('link').every(link => link.getAttribute('href') === '/register')).toBe(true)
})
it('does not show or offer draft prices to visitors', async () => {
  vi.mocked(api.get).mockImplementation(routes({ '/offers': { offers: offers.map(offer => ({ ...offer, status: 'draft' })), version: 'draft' } }))
  renderWithProviders(<Pricing />)
  expect(await screen.findByText('No plans are available yet.')).toBeInTheDocument()
  expect(screen.queryByRole('article')).not.toBeInTheDocument()
})
