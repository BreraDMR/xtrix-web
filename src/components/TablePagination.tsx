import { useId, type ChangeEvent } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import Select from '../ui/Select'

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
  const perPageId = useId()
  const lastPage = Math.max(1, totalPages)
  const page = Math.min(Math.max(1, currentPage), lastPage)
  const startItem = totalItems === 0 ? 0 : (page - 1) * perPage + 1
  const endItem = Math.min(page * perPage, totalItems)
  const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4))
  const pages = Array.from({ length: Math.max(0, Math.min(5, totalPages)) }, (_, index) => firstPage + index)
  const controlClass = 'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border px-2.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40'
  const quietClass = 'border-[var(--workspace-line)] bg-[var(--workspace-panel)] text-[var(--workspace-muted)] hover:bg-[var(--workspace-bg)]'

  const goToPage = (next: number) => onPageChange(Math.max(1, Math.min(next, lastPage)))
  const handlePerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onPerPageChange?.(Number(event.target.value))
    onPageChange(1)
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--workspace-line)] bg-[var(--workspace-panel)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--workspace-muted)]">
        <p>{t('pagination.range').replace('{start}', String(startItem)).replace('{end}', String(endItem)).replace('{total}', String(totalItems))}</p>
        {onPerPageChange && (
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor={perPageId}>{t('pagination.perPage')}</label>
            <Select id={perPageId} value={perPage} onChange={handlePerPageChange} className="min-h-9 w-20 px-2 py-1 text-xs">
              {perPageOptions.map(option => <option key={option} value={option}>{option}</option>)}
            </Select>
          </div>
        )}
      </div>
      <nav aria-label={t('pagination.label')} className="flex w-full shrink-0 items-center justify-between gap-1 sm:w-auto sm:justify-end">
        <button type="button" onClick={() => goToPage(page - 1)} disabled={page <= 1 || totalPages === 0}
          className={`${controlClass} ${quietClass}`}>
          <HiChevronLeft aria-hidden="true" className="hidden h-4 w-4 sm:block" />
          <span className="sm:sr-only">{t('pagination.previous')}</span>
        </button>
        <span className="hidden sm:contents">
          {pages.map(pageNumber => <button type="button" key={pageNumber}
            aria-current={page === pageNumber ? 'page' : undefined}
            onClick={() => goToPage(pageNumber)}
            className={`${controlClass} ${page === pageNumber
              ? 'border-[var(--workspace-line)] bg-[var(--workspace-accent-soft)] text-[var(--workspace-accent)]'
              : quietClass}`}>
            {pageNumber}
          </button>)}
        </span>
        <button type="button" onClick={() => goToPage(page + 1)} disabled={page >= lastPage || totalPages === 0}
          className={`${controlClass} ${quietClass}`}>
          <HiChevronRight aria-hidden="true" className="hidden h-4 w-4 sm:block" />
          <span className="sm:sr-only">{t('pagination.next')}</span>
        </button>
      </nav>
    </div>
  )
}
