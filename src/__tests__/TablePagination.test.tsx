import { useState } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TablePagination from '../components/TablePagination'
import { useLocaleStore } from '../store/localeStore'
import { renderWithProviders, resetStores } from '../test/render'

beforeEach(resetStores)

it('keeps one named set of controls, announces the current page and respects the ends', async () => {
  const changed = vi.fn()
  function Pages() {
    const [page, setPage] = useState(1)
    return <TablePagination currentPage={page} totalPages={7} totalItems={65} perPage={10}
      onPageChange={next => { changed(next); setPage(next) }} />
  }
  renderWithProviders(<Pages />)
  const navigation = screen.getByRole('navigation', { name: 'Pagination' })
  const previous = within(navigation).getByRole('button', { name: 'Previous' })
  const next = within(navigation).getByRole('button', { name: 'Next' })
  expect(screen.getAllByRole('button', { name: 'Previous' })).toHaveLength(1)
  expect(screen.getAllByRole('button', { name: 'Next' })).toHaveLength(1)
  expect(previous).toBeDisabled()
  expect(within(navigation).getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page')
  next.focus()
  await userEvent.keyboard('{Enter}')
  expect(within(navigation).getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page')
  expect(within(navigation).getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current')
  expect(screen.getByText('Showing 11–20 of 65 results')).toBeInTheDocument()
  await userEvent.click(within(navigation).getByRole('button', { name: '5' }))
  expect(within(navigation).getAllByRole('button').map(element => element.textContent?.trim()))
    .toEqual(['Previous', '3', '4', '5', '6', '7', 'Next'])
  await userEvent.click(within(navigation).getByRole('button', { name: '7' }))
  expect(next).toBeDisabled()
  expect(screen.getByText('Showing 61–65 of 65 results')).toBeInTheDocument()
  previous.focus()
  await userEvent.keyboard(' ')
  expect(within(navigation).getByRole('button', { name: '6' })).toHaveAttribute('aria-current', 'page')
  expect(changed.mock.calls.map(([page]) => page)).toEqual([2, 5, 7, 6])
})

it('renders an empty range without offering page zero or a navigation outside the bounds', async () => {
  const changed = vi.fn()
  renderWithProviders(<TablePagination currentPage={1} totalPages={0} totalItems={0} perPage={20} onPageChange={changed} />)
  expect(screen.getByText('Showing 0–0 of 0 results')).toBeInTheDocument()
  const navigation = screen.getByRole('navigation', { name: 'Pagination' })
  expect(within(navigation).queryByRole('button', { name: /^[0-9]+$/ })).not.toBeInTheDocument()
  for (const button of within(navigation).getAllByRole('button')) {
    expect(button).toBeDisabled()
    await userEvent.click(button)
  }
  expect(changed).not.toHaveBeenCalled()
})

it('keeps navigation within the new page count while the parent replaces an old page', async () => {
  const changed = vi.fn()
  renderWithProviders(<TablePagination currentPage={8} totalPages={3} totalItems={25} perPage={10} onPageChange={changed} />)
  const navigation = screen.getByRole('navigation', { name: 'Pagination' })
  expect(within(navigation).getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page')
  expect(within(navigation).getByRole('button', { name: 'Next' })).toBeDisabled()
  await userEvent.click(within(navigation).getByRole('button', { name: 'Previous' }))
  expect(changed).toHaveBeenCalledExactlyOnceWith(2)
})

it('labels multiple page-size controls independently and resets only the selected table', async () => {
  const firstPage = vi.fn()
  const firstSize = vi.fn()
  const secondPage = vi.fn()
  const secondSize = vi.fn()
  renderWithProviders(<>
    <TablePagination currentPage={3} totalPages={7} totalItems={65} perPage={10} onPageChange={firstPage} onPerPageChange={firstSize} />
    <TablePagination currentPage={2} totalPages={4} totalItems={65} perPage={20} onPageChange={secondPage} onPerPageChange={secondSize} />
  </>)
  const controls = screen.getAllByRole('combobox', { name: 'Per page:' })
  expect(controls).toHaveLength(2)
  expect(controls[0].id).not.toBe(controls[1].id)
  expect(screen.getAllByLabelText('Per page:')).toEqual(controls)
  await userEvent.selectOptions(controls[1], '50')
  expect(secondSize).toHaveBeenCalledExactlyOnceWith(50)
  expect(secondPage).toHaveBeenCalledExactlyOnceWith(1)
  expect(firstSize).not.toHaveBeenCalled()
  expect(firstPage).not.toHaveBeenCalled()
})

it.each([
  ['ru', 'Страницы', 'Назад', 'Далее', 'На странице:'],
  ['cz', 'Stránkování', 'Předchozí', 'Další', 'Na stránku:'],
] as const)('keeps the existing %s control names', (locale, label, previous, next, perPage) => {
  useLocaleStore.setState({ locale })
  renderWithProviders(<TablePagination currentPage={1} totalPages={2} totalItems={30} perPage={20} onPageChange={vi.fn()} onPerPageChange={vi.fn()} />)
  const navigation = screen.getByRole('navigation', { name: label })
  expect(within(navigation).getByRole('button', { name: previous })).toBeDisabled()
  expect(within(navigation).getByRole('button', { name: next })).toBeEnabled()
  expect(screen.getByRole('combobox', { name: perPage })).toHaveValue('20')
})
