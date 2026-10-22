import { afterAll, afterEach, beforeEach, expect, it } from 'vitest'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductTour from '../components/marketing/ProductTour'
import FAQ from '../components/marketing/FAQ'
import PublicFooter from '../components/marketing/PublicFooter'
import { renderWithProviders, resetStores } from '../test/render'
import { useLocaleStore } from '../store/localeStore'

const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true } })
Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false } })
afterAll(() => {
  if (originalShow) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShow)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, 'close', originalClose)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})
afterEach(() => { document.body.style.overflow = '' })
beforeEach(resetStores)

it.each([
  ['en', 'Clients & Cards', 'Comprehensive client profiles', 'Assistant Chat', 'Voice & text assistant dialogs'],
  ['ru', 'Клиенты и карточки', 'Подробная карточка клиента', 'Чат ассистента', 'Голосовые и текстовые диалоги'],
  ['cz', 'Klienti a karty', 'Podrobná karta klienta', 'Chat asistentky', 'Hlasové a textové dialogy s asistentem'],
] as const)('selects localized product views by keyboard and exposes the active panel in %s', async (locale, clients, clientPanel, assistant, assistantPanel) => {
  useLocaleStore.setState({ locale })
  renderWithProviders(<ProductTour />)
  const button = screen.getByRole('button', { name: clients })
  expect(button).toHaveAttribute('aria-pressed', 'false')
  button.focus()
  await userEvent.keyboard(' ')
  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('region', { name: clientPanel })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: assistant }))
  expect(screen.getByRole('region', { name: assistantPanel })).toBeInTheDocument()
  expect(screen.queryByText(/Какое расписание у мастера Елены/)).not.toBeInTheDocument()
})

it('keeps the FAQ answer associated with its question while toggling by keyboard', async () => {
  renderWithProviders(<FAQ />)
  const trial = screen.getByRole('button', { name: 'How does the free trial work?' })
  expect(trial).toHaveAttribute('aria-expanded', 'true')
  const answer = document.getElementById(trial.getAttribute('aria-controls')!)!
  expect(answer).toHaveTextContent('7 days of CRM and AI without a card')
  expect(answer).toHaveAttribute('aria-labelledby', trial.id)
  trial.focus()
  await userEvent.keyboard(' ')
  expect(trial).toHaveAttribute('aria-expanded', 'false')
  expect(document.getElementById(trial.getAttribute('aria-controls')!)).not.toBeInTheDocument()
  await userEvent.keyboard('{Enter}')
  expect(trial).toHaveAttribute('aria-expanded', 'true')
})

it.each(['Privacy Policy', 'Terms of Service'])('keeps %s as a named legal preview and returns focus after Escape', async title => {
  renderWithProviders(<PublicFooter />)
  const opener = screen.getByRole('button', { name: title })
  await userEvent.click(opener)
  const preview = screen.getByRole('dialog', { name: title })
  expect(within(preview).getByText('Legal documentation preview')).toBeInTheDocument()
  expect(preview).toHaveTextContent(title === 'Privacy Policy' ? 'Xtrix обеспечивает изоляцию данных' : 'Настоящий проект находится в активной разработке')
  fireEvent(preview, new Event('cancel', { cancelable: true }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(opener).toHaveFocus()
})
