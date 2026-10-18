// one variant per field of the row, so format() gets that field's own type
export type ExportColumn<T> = {
  [K in keyof T & string]: {
    key: K
    label: string
    format?: (value: T[K], row?: T) => string
    width?: number
  }
}[keyof T & string]

// raw value of a cell; format() is left to the caller
export function cellValue<T>(row: T, col: ExportColumn<T>): T[keyof T] {
  return row[col.key as keyof T]
}

// the formatted text, or the raw value when the column has no format()
export function cellText<T>(row: T, col: ExportColumn<T>): string | T[keyof T] {
  const value = cellValue(row, col)
  // TS can't tie col.format to col.key across the union, the variant itself guarantees the match
  const format = col.format as ((value: T[keyof T], row?: T) => string) | undefined
  return format ? format(value, row) : value
}
