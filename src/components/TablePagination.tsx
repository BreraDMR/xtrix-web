import { useTranslation } from '../hooks/useTranslation'
import React from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  perPage: number
  onPageChange: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  perPageOptions?: number[]
}

export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50, 100],
}: TablePaginationProps) {
  const { t } = useTranslation()
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, totalItems)

  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPerPage = parseInt(e.target.value, 10)
    if (onPerPageChange) {
      onPerPageChange(newPerPage)
    }
    onPageChange(1)
  }

  return (
    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 bg-white sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('pagination.previous')}
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('pagination.next')}
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700">
            {t('pagination.range').replace('{start}', String(startItem)).replace('{end}', String(endItem)).replace('{total}', String(totalItems))}
          </p>
          {onPerPageChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="per-page" className="text-sm text-gray-700">
                {t('pagination.perPage')}
              </label>
              <select
                id="per-page"
                value={perPage}
                onChange={handlePerPageChange}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {perPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div>
          <nav
            className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
            aria-label={t('pagination.label')}
          >
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">{t('pagination.previous')}</span>
              <HiChevronLeft className="h-5 w-5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === pageNum
                      ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">{t('pagination.next')}</span>
              <HiChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
