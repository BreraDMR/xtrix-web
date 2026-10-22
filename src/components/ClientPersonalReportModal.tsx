import { useState, useEffect, useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HiDownload } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import { useLabels } from '../i18n/labels'
import api from '../api/client'
import { allPages } from '../api/allPages'
import { synchronizeStoredSession, useAuthStore } from '../store/authStore'
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import QueryError from './QueryError'
import ExportModal from './ExportModal'
import Modal from '../ui/Modal'
import LoadingSpinner from './LoadingSpinner'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { dayEnd, dayStart, showDay, today } from '../utils/dates'
import type { ClientLoyaltyBalance, ClientOut, Schema, VisitOut } from '../api/types'

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
  const formId = useId()
  const { visitStatus } = useLabels()
  const currency = useBusinessCurrency()
  const { user, sessionRevision } = useAuthStore()
  const access = useWorkspaceAccessContext()
  const canExport = access === undefined || access?.can_export === true
  const scope = JSON.stringify([sessionRevision, user?.id, user?.role, user?.business_id, user?.employer_id])
  const assertSession = (signal: AbortSignal) => {
    synchronizeStoredSession()
    const current = useAuthStore.getState()
    if (signal.aborted || scope !== JSON.stringify([current.sessionRevision, current.user?.id,
      current.user?.role, current.user?.business_id, current.user?.employer_id])) throw new Error('Session changed')
  }
  const [selectedReportType, setSelectedReportType] = useState<string>('profile')
  const [dateFrom, setDateFrom] = useState<string>(
    today(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  )
  const [dateTo, setDateTo] = useState<string>(
    today(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))
  )
  const [showExportModal, setShowExportModal] = useState(false)

  const needsHistory = selectedReportType === 'visits' || selectedReportType === 'finance'
  const clientQuery = useQuery<ClientOut>({
    queryKey: ['client', clientId, scope],
    queryFn: async ({ signal }) => {
      assertSession(signal)
      const { data } = await api.get<ClientOut>(`/clients/${clientId}`, { signal })
      assertSession(signal)
      return data
    },
    enabled: isOpen && clientId > 0,
    retry: false,
  })
  const client = clientQuery.data

  const history = useQuery({
    queryKey: ['client-visits', clientId, dateFrom, dateTo, scope],
    queryFn: ({ signal }) => allPages<VisitOut>(async page => {
      assertSession(signal)
      const params = new URLSearchParams({ client_id: String(clientId), page: String(page),
        per_page: '100', sort_by: 'id', sort_order: 'asc' })
      if (dateFrom) params.set('date_from', dayStart(dateFrom))
      if (dateTo) params.set('date_to', dayEnd(dateTo))
      const { data } = await api.get<Schema<'PaginatedResponse_VisitOut_'>>(`/visits/?${params.toString()}`, { signal })
      assertSession(signal)
      return data
    }),
    enabled: isOpen && clientId > 0 && needsHistory,
    retry: false,
  })
  const visits = history.data
  const pending = clientQuery.isPending || clientQuery.isFetching
    || (needsHistory && (history.isPending || history.isFetching))
  const failed = clientQuery.isError || (needsHistory && history.isError)
  const ready = !pending && !failed && !!client

  const { data: loyaltyBalance } = useQuery({
    queryKey: ['client-loyalty-balance', clientId, scope],
    queryFn: async () => {
      try {
        const { data } = await api.get<ClientLoyaltyBalance>(`/loyalty/balance/${clientId}`)
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
            'Date of Birth': showDay(client.birth_date),
            'Gender': client.gender || '-',
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
        return (visits || []).map((visit) => ({
          [t('visits.date')]: new Date(visit.date_start).toLocaleDateString(),
          [t('visits.service')]: visit.service_name || '-',
          [t('visits.status')]: visitStatus(visit.status) || '-',
          [t('visits.price')]: visit.price != null ? formatCurrency(visit.price, currency) : '-',
          'Payment Method': visit.payment_method || '-',
        }))
      case 'finance': {
        const completed = (visits || []).filter(visit => visit.status === 'completed')
        const totalSpent = completed.some(visit => visit.price == null)
          ? null : completed.reduce((sum, visit) => sum + (visit.price ?? 0), 0)
        return [
          {
            [t('export.period')]: `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`,
            'Total Visits': (visits || []).length,
            'Completed': completed.length,
            'Total Revenue': totalSpent != null ? formatCurrency(totalSpent, currency) : '-',
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
    if (!ready || !canExport || exportData.length === 0) return
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

  useEffect(() => { setShowExportModal(false) }, [scope, clientId, isOpen])

  if (!isOpen) return null

  const exportData = prepareExportData()
  const columns = exportData.length > 0 ? Object.keys(exportData[0]).map((key) => ({ key, label: key })) : []

  return (
    <>
      <Modal title={`${t('export.personalReport')} - ${client?.full_name || ''}`} onClose={onClose} wide>
          <div className="p-6 space-y-6">
            {}
            <div>
              <label htmlFor={`${formId}-type`} className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                {t('export.selectReportType')}
              </label>
              <select
                id={`${formId}-type`}
                value={selectedReportType}
                onChange={(e) => { setShowExportModal(false); setSelectedReportType(e.target.value) }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
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
                  <label htmlFor={`${formId}-from`} className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    {t('export.fromDate')}
                  </label>
                  <input
                    id={`${formId}-from`}
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setShowExportModal(false); setDateFrom(e.target.value) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label htmlFor={`${formId}-to`} className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                    {t('export.toDate')}
                  </label>
                  <input
                    id={`${formId}-to`}
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setShowExportModal(false); setDateTo(e.target.value) }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
                  />
                </div>
              </div>
            )}

            {}
            {failed ? (
              <QueryError retry={() => {
                void clientQuery.refetch()
                if (needsHistory) void history.refetch()
              }} />
            ) : pending ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : exportData.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-700">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preview
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        {columns.map((col) => (
                          <th
                            key={col.key}
                            className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {exportData.map((row, idx) => (
                        <tr key={idx}>
                          {columns.map((col) => (
                            <td key={col.key} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                              {row[col.key] ?? '-'}
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
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('common.noData')}
              </div>
            )}
          </div>

          {}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-900"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleExport}
              disabled={exportData.length === 0 || !ready || !canExport}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <HiDownload className="w-4 h-4" />
              {t('export.export')} / {t('common.print')}
            </button>
          </div>
      </Modal>

      {}
      {showExportModal && ready && canExport && (
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
