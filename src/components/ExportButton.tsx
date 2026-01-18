import { HiDownload } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import { exportTableToCSV } from '../utils/table'

interface Column<T> {
  key: keyof T
  label: string
  format?: (value: any) => string
}

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[]
  columns: Column<T>[]
  filename: string
  className?: string
}

export default function ExportButton<T extends Record<string, any>>({
  data,
  columns,
  filename,
  className = '',
}: ExportButtonProps<T>) {
  const { t } = useTranslation()

  const handleExport = () => {
    exportTableToCSV(data, columns, filename)
  }

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={t('common.export')}
    >
      <HiDownload className="w-4 h-4" />
      <span className="hidden sm:inline">{t('common.export')}</span>
    </button>
  )
}
