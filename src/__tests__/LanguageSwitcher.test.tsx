import { beforeEach, describe, expect, it } from 'vitest'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLocaleStore } from '../store/localeStore'
import { renderWithProviders, resetStores } from '../test/render'

// DES-11: the toggle used to read just "EN" to a screen reader - say it's the language menu
describe('language switcher', () => {
  beforeEach(() => resetStores())

  it('names the toggle as the language menu in the current language', async () => {
    act(() => useLocaleStore.getState().setLocale('en'))
    renderWithProviders(<LanguageSwitcher />)
    const toggle = screen.getByRole('button', { name: 'EN, Language' })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'RU' }))
    expect(screen.getByRole('button', { name: 'RU, Язык' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on Escape and gives focus back to the toggle', async () => {
    act(() => useLocaleStore.getState().setLocale('cz'))
    renderWithProviders(<LanguageSwitcher />)
    const toggle = screen.getByRole('button', { name: 'CZ, Jazyk' })
    await userEvent.click(toggle)
    await userEvent.keyboard('{Escape}')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })
})
