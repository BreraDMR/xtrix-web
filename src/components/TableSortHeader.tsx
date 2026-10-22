import { HiChevronUp, HiChevronDown } from 'react-icons/hi'
import { SortDirection } from '../utils/table'

interface TableSortHeaderProps<T> {
  columnKey: keyof T
  label: string
  currentSort: { key: keyof T | null; direction: SortDirection }
  onSort: (key: keyof T) => void
  className?: string
}

export default function TableSortHeader<T>({
  columnKey,
  label,
  currentSort,
  onSort,
  className = 'px-5',
}: TableSortHeaderProps<T>) {
  const isActive = currentSort.key === columnKey
  const direction = isActive ? currentSort.direction : null

  return (
    <th
      scope="col"
      aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
      className={`py-3 text-left text-xs font-medium text-[var(--workspace-muted)] ${className}`}
    >
      <button type="button" onClick={() => onSort(columnKey)}
        className="flex min-h-6 w-full select-none items-center gap-2 rounded-sm text-left text-xs font-medium uppercase tracking-wide hover:text-[var(--workspace-ink)]">
        <span>{label}</span>
        <span aria-hidden="true" className="flex shrink-0 flex-col">
          <HiChevronUp
            className={`w-3 h-3 -mb-1 ${
              direction === 'asc' ? 'text-[var(--workspace-accent)]' : 'opacity-30'
            }`}
          />
          <HiChevronDown
            className={`w-3 h-3 ${
              direction === 'desc' ? 'text-[var(--workspace-accent)]' : 'opacity-30'
            }`}
          />
        </span>
      </button>
    </th>
  )
}
