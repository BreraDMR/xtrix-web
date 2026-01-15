import { useState } from 'react'

interface FilterOption {
  label: string
  value: string
}

interface FilterPanelProps {
  filters: {
    [key: string]: {
      label: string
      options: FilterOption[]
      value: string | null
      onChange: (value: string | null) => void
    }
  }
  onReset: () => void
}

export default function FilterPanel({ filters, onReset }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasActiveFilters = Object.values(filters).some((f) => f.value !== null)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 border rounded-md flex items-center gap-2 ${
          hasActiveFilters ? 'bg-blue-50 border-blue-300' : 'bg-white'
        }`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filters
        {hasActiveFilters && (
          <span className="ml-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
            {Object.values(filters).filter((f) => f.value !== null).length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-20 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={onReset}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-4">
              {Object.entries(filters).map(([key, filter]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-2">
                    {filter.label}
                  </label>
                  <select
                    value={filter.value || ''}
                    onChange={(e) => filter.onChange(e.target.value || null)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}











