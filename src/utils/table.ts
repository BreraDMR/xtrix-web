/**
 * Utility functions for table operations: sorting, pagination, export
 */

export type SortDirection = 'asc' | 'desc' | null

export interface SortConfig<T> {
  key: keyof T | null
  direction: SortDirection
}

/**
 * Sort an array of data based on sort configuration
 */
export function sortData<T>(data: T[], sortConfig: SortConfig<T>): T[] {
  if (!sortConfig.key || !sortConfig.direction) {
    return data
  }

  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.key!]
    const bValue = b[sortConfig.key!]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    // Handle dates
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortConfig.direction === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime()
    }

    // Handle strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    }

    // Fallback to string comparison
    const aStr = String(aValue).toLowerCase()
    const bStr = String(bValue).toLowerCase()
    return sortConfig.direction === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr)
  })
}

/**
 * Paginate an array of data
 */
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

/**
 * Convert data array to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string; format?: (value: any) => string }>
): string {
  if (data.length === 0) {
    return columns.map((col) => col.label).join(',')
  }

  // Create header row
  const header = columns.map((col) => `"${col.label}"`).join(',')

  // Create data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        const value = item[col.key]
        const formattedValue = col.format ? col.format(value) : value ?? ''
        // Escape quotes and wrap in quotes
        const escaped = String(formattedValue).replace(/"/g, '""')
        return `"${escaped}"`
      })
      .join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * Download CSV file
 */
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

/**
 * Export table data to CSV
 */
export function exportTableToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: keyof T; label: string; format?: (value: any) => string }>,
  filename: string
): void {
  const csv = convertToCSV(data, columns)
  downloadCSV(csv, filename)
}
