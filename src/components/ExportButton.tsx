import { useState } from 'react'
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import { LuDownload } from 'react-icons/lu'
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
  loadData?: () => Promise<T[]>
  totalItems?: number
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
  loadData,
  totalItems,
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
        className={`ui-button ui-button-secondary ${className}`}
        title={t('common.export')}
      >
        <LuDownload aria-hidden="true" className="w-4 h-4" />
        {/* the word stays on phones too: an icon alone in a wide pill read as an empty field */}
        <span>{t('common.export')}</span>
      </button>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={exportData}
        loadData={dataType === 'selected' ? undefined : loadData}
        totalItems={dataType === 'selected' ? exportData.length : totalItems}
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
