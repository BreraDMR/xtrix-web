import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Visits from '../pages/Visits'
import api from '../api/client'
import type { VisitOut } from '../api/types'
import type { ExportColumn } from '../utils/export'
import type { operations } from '../api/schema'
import { apiError, renderWithProviders, resetStores, routes, signIn } from '../test/render'
import { formatCurrency } from '../utils/currency'

const capture = vi.hoisted(() => ({ current: undefined as undefined | {
  data: VisitOut[]; totalItems: number; loadData: () => Promise<VisitOut[]>;
  columns: ExportColumn<VisitOut>[]; filename: string; dataType: string;
} }))
vi.mock('../api/client', () => ({ default: { get: vi.fn() } }))
vi.mock('../components/ExportButton', () => ({ default: (props: NonNullable<typeof capture.current>) => {
  capture.current = props
  return <button>Export fixture</button>
} }))

beforeEach(() => { vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'specialist' }); capture.current = undefined })
type Query = NonNullable<operations['visits_list_visits__get']['parameters']['query']>
const rows: VisitOut[] = Array.from({ length: 125 }, (_, index) => ({
  id: index + 1, client_id: index + 1, client_name: `Guest ${String(index + 1).padStart(3, '0')}`,
  specialist_id: 7, service_name: 'Consultation', date_start: '2026-10-18T10:00:00Z',
  created_at: '2026-10-01T09:00:00Z', status: 'completed', price: index === 0 ? 0 : 20,
}))
function serve(failExportPage = false) {
  vi.mocked(api.get).mockImplementation((url, config) => {
    if (url !== '/visits/') return routes({ '/businesses/me': { currency: 'EUR' } })(url, config)
    const query = (config?.params as Query | undefined) ?? {}
    const page = query.page ?? 1
    const per_page = query.per_page ?? 20
    if (failExportPage && per_page === 100 && page === 2) return Promise.reject(apiError(503, 'Second export page unavailable'))
    return Promise.resolve({ data: { page, per_page, total: rows.length, pages: Math.ceil(rows.length / per_page),
      items: rows.slice((page - 1) * per_page, page * per_page) } })
  })
}

it('exports every server page with the current filters, sorting and names instead of just the visible page', async () => {
  serve()
  renderWithProviders(<Visits />)
  await screen.findByRole('cell', { name: 'Guest 001' })
  await userEvent.type(screen.getByRole('searchbox'), 'Guest')
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'completed')
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-10-01' } })
  fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-10-31' } })
  await userEvent.click(screen.getByRole('button', { name: 'Client' }))
  await userEvent.click(await screen.findByRole('button', { name: '2' }))
  await screen.findByRole('cell', { name: 'Guest 021' })
  const config = capture.current!
  expect(config.data).toHaveLength(20)
  expect(config.totalItems).toBe(125)
  expect(config.dataType).toBe('filtered')
  const exported = await config.loadData()
  expect(exported).toHaveLength(125)
  expect(exported[124].client_name).toBe('Guest 125')
  const calls = vi.mocked(api.get).mock.calls.map(([, options]) => options?.params as Query | undefined)
    .filter(params => params?.per_page === 100)
  expect(calls.map(params => params?.page)).toEqual([1, 2])
  for (const params of calls) expect(params).toMatchObject({ q: 'Guest', status: 'completed',
    sort_by: 'client_name', sort_order: 'asc',
    date_from: new Date(2026, 9, 1, 0, 0, 0, 0).toISOString(),
    date_to: new Date(2026, 9, 31, 23, 59, 59, 999).toISOString(),
  })
  const price = config.columns.find(column => column.key === 'price')!
  expect(price.format?.(0, rows[0])).toBe(formatCurrency(0, 'EUR'))
  expect(price.format?.(null, rows[0])).toBe('-')
})

it('rejects a failed later export page without returning a plausible partial directory', async () => {
  serve(true)
  renderWithProviders(<Visits />)
  await screen.findByRole('cell', { name: 'Guest 001' })
  await expect(capture.current!.loadData()).rejects.toThrow('Second export page unavailable')
  expect(screen.getByRole('cell', { name: 'Guest 001' })).toBeInTheDocument()
})
