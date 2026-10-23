import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Privacy from '../pages/Privacy'

it('tells visitors what Google sign-in shares and how to get their data deleted', () => {
  render(<MemoryRouter><Privacy /></MemoryRouter>)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Политика конфиденциальности')
  expect(screen.getByText(/имя, адрес почты и идентификатор аккаунта Google/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'damir.brera.eb@gmail.com' })).toHaveAttribute('href', 'mailto:damir.brera.eb@gmail.com')
})
