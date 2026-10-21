import { useState } from 'react'
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import { HiDownload } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import ExportModal from './ExportModal'
import type { ExportColumn } from '../utils/export'

interface ExportButtonProps<T extends object> {
  data: T[]
  columns: ExportColumn<T>[]
  filename: string
  title?: string
  className?: string
  reportTypes?: string[]
  includeCharts?: boolean
  chartSelectors?: string[]
  dataType?: 'all' | 'filtered' | 'selected'
  selectedRows?: T[]
}

export default function ExportButton<T extends object>({
  data,
  columns,
  filename,
  title,
  className = '',
  reportTypes,
  includeCharts = false,
  chartSelectors = [],
  dataType = 'all',
  selectedRows,
}: ExportButtonProps<T>) {
  const { t } = useTranslation()
  const access = useWorkspaceAccessContext()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (access !== undefined && !access?.can_export) return null

  const exportData = dataType === 'selected' && selectedRows ? selectedRows : data

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={exportData.length === 0}
        className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={t('common.export')}
      >
        <HiDownload className="w-4 h-4" />
        <span className="hidden sm:inline">{t('common.export')}</span>
      </button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={exportData}
        columns={columns}
        filename={filename}
        title={title}
        reportTypes={reportTypes}
        includeCharts={includeCharts}
        chartSelectors={chartSelectors}
      />
    </>
  )
}
