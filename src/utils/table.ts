import { cellValue, type ExportColumn } from './columns'



export type SortDirection = 'asc' | 'desc' | null

export interface SortConfig<T> {
  key: keyof T | null
  direction: SortDirection
}


export function sortData<T>(data: T[], sortConfig: SortConfig<T>): T[] {
  if (!sortConfig.key || !sortConfig.direction) {
    return data
  }

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key!]
    const bValue = b[sortConfig.key!]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortConfig.direction === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime()
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    const aStr = String(aValue).toLowerCase()
    const bStr = String(bValue).toLowerCase()
    return sortConfig.direction === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr)
  })
}


export function paginateData<T>(
  data: T[],
  page: number,
  perPage: number
): { paginatedData: T[]; totalPages: number; totalItems: number } {
  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / perPage)
  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage
  const paginatedData = data.slice(startIndex, endIndex)

  return { paginatedData, totalPages, totalItems }
}


export function convertToCSV<T extends object>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  if (data.length === 0) {
    return columns.map((col) => col.label).join(',')
  }

  const header = columns.map((col) => `"${col.label}"`).join(',')

  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const format = col.format as ((value: unknown) => string) | undefined
        const value = cellValue(item, col)
        const formattedValue = format ? format(value) : value ?? ''
        const escaped = String(formattedValue).replace(/"/g, '""')
        return `"${escaped}"`
      })
      .join(',')
  })

  return [header, ...rows].join('\n')
}


export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


export function exportTableToCSV<T extends object>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const csv = convertToCSV(data, columns)
  downloadCSV(csv, filename)
}
