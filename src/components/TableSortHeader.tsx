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
  className = '',
}: TableSortHeaderProps<T>) {
  const isActive = currentSort.key === columnKey
  const direction = isActive ? currentSort.direction : null

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 ${className}`}
      onClick={() => onSort(columnKey)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <div className="flex flex-col">
          <HiChevronUp
            className={`w-3 h-3 -mb-1 ${
              direction === 'asc' ? 'text-purple-600' : 'text-gray-300'
            }`}
          />
          <HiChevronDown
            className={`w-3 h-3 ${
              direction === 'desc' ? 'text-purple-600' : 'text-gray-300'
            }`}
          />
        </div>
      </div>
    </th>
  )
}
