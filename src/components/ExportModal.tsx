import { useState, useEffect } from 'react'
import { HiX, HiDownload, HiPrinter } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import { exportData, exportChartToImage, ExportFormat, ExportOptions } from '../utils/export'
import { getExportPreferences, saveExportPreferences } from '../utils/export'

interface Column<T> {
  key: keyof T | string
  label: string
  format?: (value: any, row?: T) => string
  width?: number
}

interface ExportModalProps<T extends Record<string, any>> {
  isOpen: boolean
  onClose: () => void
  data: T[]
  columns: Column<T>[]
  filename: string
  title?: string
  reportTypes?: string[]
  includeCharts?: boolean
  chartSelectors?: string[]
  onExportStart?: () => void
  onExportComplete?: () => void
}

export default function ExportModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  data,
  columns,
  filename,
  title,
  reportTypes,
  includeCharts = false,
  chartSelectors = [],
  onExportStart,
  onExportComplete,
}: ExportModalProps<T>) {
  const { t } = useTranslation()
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [selectedReportType, setSelectedReportType] = useState<string | null>(
    reportTypes?.[0] || null
  )
  const [isExporting, setIsExporting] = useState(false)
  const [includeChartsOption, setIncludeChartsOption] = useState(includeCharts)

  useEffect(() => {
    if (isOpen) {
      const prefs = getExportPreferences()
      if (prefs.format) setSelectedFormat(prefs.format as ExportFormat)
    }
  }, [isOpen])

  const handleExport = async () => {
    if (data.length === 0) return

    setIsExporting(true)
    onExportStart?.()

    try {
      const options: ExportOptions<T> = {
        data,
        columns: columns.map((col) => ({
          key: col.key,
          label: col.label,
          format: col.format,
          width: col.width,
        })),
        filename: `${filename}-${selectedFormat}`,
        title: title || selectedReportType || undefined,
        format: selectedFormat,
        includeCharts: includeChartsOption && chartSelectors.length > 0,
        chartSelectors: includeChartsOption ? chartSelectors : undefined,
      }

      saveExportPreferences({ format: selectedFormat })

      await exportData(options)

      if (includeChartsOption && chartSelectors.length > 0 && selectedFormat !== 'pdf') {
        for (const selector of chartSelectors) {
          await exportChartToImage(selector, `${filename}-chart-${Date.now()}`, 'png')
        }
      }

      onExportComplete?.()
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert(t('export.error'))
    } finally {
      setIsExporting(false)
    }
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('export.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isExporting}
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {}
        <div className="p-6 space-y-6">
          {}
          {reportTypes && reportTypes.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('export.reportType')}
              </label>
              <select
                value={selectedReportType || ''}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isExporting}
              >
                {reportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('export.format')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedFormat('pdf')}
                disabled={isExporting}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="font-medium">PDF</div>
                <div className="text-xs text-gray-500 mt-1">Document</div>
              </button>
              <button
                onClick={() => setSelectedFormat('excel')}
                disabled={isExporting}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  selectedFormat === 'excel'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="font-medium">Excel</div>
                <div className="text-xs text-gray-500 mt-1">Spreadsheet</div>
              </button>
              <button
                onClick={() => setSelectedFormat('csv')}
                disabled={isExporting}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  selectedFormat === 'csv'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="font-medium">CSV</div>
                <div className="text-xs text-gray-500 mt-1">Text file</div>
              </button>
              <button
                onClick={() => setSelectedFormat('print')}
                disabled={isExporting}
                className={`p-3 border-2 rounded-lg text-center transition-all ${
                  selectedFormat === 'print'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <HiPrinter className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs text-gray-500">Print</div>
              </button>
            </div>
          </div>

          {}
          {chartSelectors.length > 0 && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCharts"
                checked={includeChartsOption}
                onChange={(e) => setIncludeChartsOption(e.target.checked)}
                disabled={isExporting || selectedFormat === 'print'}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="includeCharts" className="ml-2 text-sm text-gray-700">
                {t('export.includeCharts')}
              </label>
            </div>
          )}

          {}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            <div className="font-medium mb-1">{t('export.itemsCount')}:</div>
            <div>{data.length} {t('export.items')}</div>
          </div>
        </div>

        {}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('export.exporting')}
              </>
            ) : (
              <>
                <HiDownload className="w-4 h-4" />
                {selectedFormat === 'print' ? t('export.print') : t('export.export')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
