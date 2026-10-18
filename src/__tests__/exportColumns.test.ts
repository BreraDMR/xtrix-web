import { describe, expect, it } from 'vitest'
import { cellText, cellValue, type ExportColumn } from '../utils/columns'
import { convertToCSV } from '../utils/table'

type Row = { name: string; price: number | null; unit: string }

const rows: Row[] = [
  { name: 'Shampoo "Pro"', price: 12.5, unit: 'ml' },
  { name: 'Gel', price: null, unit: 'pcs' },
]

describe('export columns', () => {
  it('reads the raw value of the column key', () => {
    expect(cellValue(rows[0], { key: 'price', label: 'Price' })).toBe(12.5)
  })

  it('formats with the field value and the row', () => {
    const col: ExportColumn<Row> = { key: 'price', label: 'Price', format: (price, row) => `${price ?? '-'} / ${row?.unit}` }
    expect(cellText(rows[0], col)).toBe('12.5 / ml')
    expect(cellText(rows[1], col)).toBe('- / pcs')
  })

  it('builds a csv with quoted, escaped cells', () => {
    const csv = convertToCSV(rows, [
      { key: 'name', label: 'Name' },
      { key: 'price', label: 'Price', format: (price) => (price === null ? '-' : price.toFixed(2)) },
    ])
    expect(csv.split('\n')).toEqual(['"Name","Price"', '"Shampoo ""Pro""","12.50"', '"Gel","-"'])
  })
})
