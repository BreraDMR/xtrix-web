import { useState } from 'react'
import { HiDownload } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import ExportModal from './ExportModal'

interface Column<T> {
  key: keyof T | string
  label: string
  format?: (value: any, row?: T) => string
  width?: number
}

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[]
  columns: Column<T>[]
  filename: string
  title?: string
  className?: string
  reportTypes?: string[]
  includeCharts?: boolean
  chartSelectors?: string[]
  dataType?: 'all' | 'filtered' | 'selected'
  selectedRows?: T[]
}

export default function ExportButton<T extends Record<string, any>>({
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
  const [isModalOpen, setIsModalOpen] = useState(false)

  const exportData = dataType === 'selected' && selectedRows ? selectedRows : data

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={exportData.length === 0}
        className={`btn-outline ${className}`}
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
