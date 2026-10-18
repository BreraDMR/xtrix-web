import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HiX, HiDownload } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import { useLabels } from '../i18n/labels'
import api from '../api/client'
import ExportModal from './ExportModal'
import LoadingSpinner from './LoadingSpinner'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { dayEnd, dayStart, today } from '../utils/dates'

// one line of the report: column title -> cell
type ReportRow = Record<string, string | number>

interface ClientPersonalReportModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: number
}

export default function ClientPersonalReportModal({
  isOpen,
  onClose,
  clientId,
}: ClientPersonalReportModalProps) {
  const { t } = useTranslation()
  const { visitStatus } = useLabels()
  const currency = useBusinessCurrency()
  const [selectedReportType, setSelectedReportType] = useState<string>('profile')
  const [dateFrom, setDateFrom] = useState<string>(
    today(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  )
  const [dateTo, setDateTo] = useState<string>(
    today(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
  )
  const [showExportModal, setShowExportModal] = useState(false)

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}`)
      return data
    },
    enabled: isOpen && clientId > 0,
  })

  const { data: visits, isLoading: isLoadingVisits } = useQuery({
    queryKey: ['client-visits', clientId, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('client_id', clientId.toString())
      if (dateFrom) params.append('date_from', dayStart(dateFrom))
      if (dateTo) params.append('date_to', dayEnd(dateTo))
      const { data } = await api.get(`/visits/?${params.toString()}`)
      return Array.isArray(data) ? data : data?.items || []
    },
    enabled: isOpen && clientId > 0 && (selectedReportType === 'visits' || selectedReportType === 'finance'),
  })

  const { data: loyaltyBalance } = useQuery({
    queryKey: ['client-loyalty-balance', clientId],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/loyalty/balance/${clientId}`)
        return data
      } catch {
        return null
      }
    },
    enabled: isOpen && clientId > 0,
  })

  useEffect(() => {
    if (isOpen) {
      const prefs = localStorage.getItem(`client-report-preferences-${clientId}`)
      if (prefs) {
        try {
          const parsed = JSON.parse(prefs)
          if (parsed.reportType) setSelectedReportType(parsed.reportType)
          if (parsed.dateFrom) setDateFrom(parsed.dateFrom)
          if (parsed.dateTo) setDateTo(parsed.dateTo)
        } catch {
        }
      }
    }
  }, [isOpen, clientId])

  const prepareExportData = (): ReportRow[] => {
    if (!client) return []

    switch (selectedReportType) {
      case 'profile':
        return [
          {
            'Name': client.full_name || '-',
            'Phone': client.contact_phone || '-',
            'Email': client.contact_email || '-',
            'Date of Birth': client.date_of_birth
              ? new Date(client.date_of_birth).toLocaleDateString()
              : '-',
            'Gender': client.gender || '-',
            'Notes': client.notes || '-',
            'Allergies': client.allergies || '-',
            'Chronic Diseases': client.chronic_diseases || '-',
          },
        ]
      case 'contacts':
        return [
          {
            [t('clients.name')]: client.full_name || '-',
            [t('clients.phone')]: client.contact_phone || '-',
            [t('clients.email')]: client.contact_email || '-',
          },
        ]
      case 'visits':
        return (visits || []).map((visit: any) => ({
          [t('visits.date')]: new Date(visit.date_start).toLocaleDateString(),
          [t('visits.service')]: visit.service_name || '-',
          [t('visits.status')]: visitStatus(visit.status) || '-',
          [t('visits.price')]: visit.price ? formatCurrency(visit.price, currency) : '-',
          'Payment Method': visit.payment_method || '-',
        }))
      case 'finance': {
        const totalSpent = (visits || [])
          .filter((v: any) => v.status === 'completed')
          .reduce((sum: number, v: any) => sum + (v.price || 0), 0)
        return [
          {
            [t('export.period')]: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
            'Total Visits': (visits || []).length,
            'Completed': (visits || []).filter((v: any) => v.status === 'completed').length,
            'Total Revenue': formatCurrency(totalSpent, currency),
            [t('loyalty.points')]: loyaltyBalance?.points || 0,
            [t('loyalty.cashback')]: loyaltyBalance?.cashback ? formatCurrency(loyaltyBalance.cashback, currency) : '-',
          },
        ]
      }
      default:
        return []
    }
  }

  const handleExport = () => {
    localStorage.setItem(
      `client-report-preferences-${clientId}`,
      JSON.stringify({
        reportType: selectedReportType,
        dateFrom,
        dateTo,
      })
    )
    setShowExportModal(true)
  }

  if (!isOpen) return null

  const exportData = prepareExportData()
  const columns = exportData.length > 0 ? Object.keys(exportData[0]).map((key) => ({ key, label: key })) : []

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('export.personalReport')} - {client?.full_name || ''}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          {}
          <div className="p-6 space-y-6">
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('export.selectReportType')}
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="profile">{t('export.clientProfile')}</option>
                <option value="contacts">{t('export.clientContacts')}</option>
                <option value="visits">{t('export.clientVisits')}</option>
                <option value="finance">{t('export.clientFinance')}</option>
              </select>
            </div>

            {}
            {(selectedReportType === 'visits' || selectedReportType === 'finance') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('export.fromDate')}
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('export.toDate')}
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {}
            {isLoadingClient || isLoadingVisits ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : exportData.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">
                    Preview
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col.key}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exportData.map((row, idx) => (
                        <tr key={idx}>
                          {columns.map((col) => (
                            <td key={col.key} className="px-4 py-2 text-sm text-gray-900">
                              {row[col.key] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-blue-50 border-t border-blue-200 px-4 py-2 text-sm text-blue-700">
                  {t('export.itemsCount')}: {exportData.length} {t('export.items')}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('common.noData')}
              </div>
            )}
          </div>

          {}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleExport}
              disabled={exportData.length === 0 || isLoadingClient || isLoadingVisits}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <HiDownload className="w-4 h-4" />
              {t('export.export')} / {t('common.print')}
            </button>
          </div>
        </div>
      </div>

      {}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={exportData}
          columns={columns}
          filename={`client-${clientId}-${selectedReportType}-${today()}`}
          title={`${t('export.personalReport')} - ${client?.full_name || ''} - ${selectedReportType}`}
          reportTypes={[]}
        />
      )}
    </>
  )
}
