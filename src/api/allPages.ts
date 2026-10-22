import type { ClientPage } from './types'

type Page<T> = Omit<ClientPage, 'items'> & { items: T[] }

// Export every server page. Never download a plausible-looking partial file when
// rows move between pages while the export is being prepared.
export async function allPages<T extends { id: number }>(read: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const rows: T[] = []
  const ids = new Set<number>()
  let total: number | undefined
  let pages = 1
  for (let page = 1; page <= pages; page++) {
    const result = await read(page)
    total ??= result.total
    if (result.page !== page || result.total !== total || result.per_page < 1 ||
        result.pages !== Math.ceil(total / result.per_page)) throw new Error('Export data changed')
    pages = result.pages
    if (page < pages && result.items.length !== result.per_page) throw new Error('Incomplete export page')
    for (const row of result.items) {
      if (ids.has(row.id)) throw new Error('Export data changed')
      ids.add(row.id)
      rows.push(row)
    }
  }
  if (rows.length !== total) throw new Error('Incomplete export')
  return rows
}
