import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TableSortHeader from '../components/TableSortHeader'
import type { SortConfig } from '../utils/table'

type Row = { name: string; amount: number }

it('sorts from Enter and Space, reports direction and activates once per click', async () => {
  const changed = vi.fn()
  function Table() {
    const [sort, setSort] = useState<SortConfig<Row>>({ key: null, direction: null })
    const onSort = (key: keyof Row) => {
      changed(key)
      setSort(previous => previous.key !== key || previous.direction === null
        ? { key, direction: 'asc' }
        : previous.direction === 'asc' ? { key, direction: 'desc' } : { key: null, direction: null })
    }
    return <table><thead><tr>
      <TableSortHeader columnKey="name" label="Name" currentSort={sort} onSort={onSort} />
      <TableSortHeader columnKey="amount" label="Amount" currentSort={sort} onSort={onSort} />
    </tr></thead></table>
  }
  render(<Table />)
  const name = screen.getByRole('button', { name: 'Name' })
  const nameHeader = screen.getByRole('columnheader', { name: 'Name' })
  const amountHeader = screen.getByRole('columnheader', { name: 'Amount' })
  expect(nameHeader).toHaveAttribute('aria-sort', 'none')
  name.focus()
  await userEvent.keyboard('{Enter}')
  expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  expect(amountHeader).toHaveAttribute('aria-sort', 'none')
  await userEvent.keyboard(' ')
  expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  await userEvent.click(name)
  expect(nameHeader).toHaveAttribute('aria-sort', 'none')
  expect(changed.mock.calls).toEqual([['name'], ['name'], ['name']])
  await userEvent.click(screen.getByRole('button', { name: 'Amount' }))
  expect(amountHeader).toHaveAttribute('aria-sort', 'ascending')
  expect(nameHeader).toHaveAttribute('aria-sort', 'none')
  expect(name).toHaveAttribute('type', 'button')
})
