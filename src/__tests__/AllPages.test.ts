import { expect, it, vi } from 'vitest'
import { allPages } from '../api/allPages'

it('exports more than 100 rows without duplicates or losing the final page', async () => {
  const read = vi.fn(async (page: number) => ({ page, per_page: 100, total: 225, pages: 3,
    items: Array.from({ length: page === 3 ? 25 : 100 }, (_, index) => ({ id: (page - 1) * 100 + index })),
  }))
  expect(await allPages(read)).toEqual(Array.from({ length: 225 }, (_, id) => ({ id })))
  expect(read.mock.calls).toEqual([[1], [2], [3]])
})

it.each(['missing', 'duplicate', 'changed-total', 'wrong-page', 'failed-page'])('refuses a partial file after %s', async (problem) => {
  const read = vi.fn(async (page: number) => {
    if (page === 2 && problem === 'failed-page') throw new Error('Offline')
    return { page: page === 2 && problem === 'wrong-page' ? 1 : page, per_page: 2,
      total: page === 2 && problem === 'changed-total' ? 5 : 4, pages: 2,
      items: page === 1 ? [{ id: 1 }, { id: 2 }] : problem === 'missing' ? [{ id: 3 }] :
        problem === 'duplicate' ? [{ id: 2 }, { id: 3 }] : [{ id: 3 }, { id: 4 }],
    }
  })
  await expect(allPages(read)).rejects.toThrow()
})

it('handles an empty allowed result', async () => {
  expect(await allPages(async page => ({ page, per_page: 100, total: 0, pages: 0, items: [] }))).toEqual([])
})
