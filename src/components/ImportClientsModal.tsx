import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { HiX, HiUpload, HiCheckCircle, HiXCircle, HiExclamationCircle } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/client'
import { apiClientExists, apiErrorMessage } from '../api/errors'
import * as XLSX from 'xlsx'
import type { ClientOut, ClientPage } from '../api/types'
import { allPages } from '../api/allPages'
import FormError from './FormError'

interface ImportClientsModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenClient?: (clientId: number) => void
}

interface ParsedClient {
  full_name: string
  contact_phone?: string
  contact_email?: string
  row: number
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ImportResult {
  success: number
  skipped: number
  errors: Array<{ row: number; message: string }>
  // rows the API refused as duplicates of a client we already have
  existing: Array<{ row: number; clientId: number }>
}

export default function ImportClientsModal({ isOpen, onClose, onOpenClient }: ImportClientsModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedClient[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [fileError, setFileError] = useState('')

  // a file we can't use: say why and let them pick another one
  const rejectFile = (message: string) => {
    setFile(null)
    setFileError(message)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const loadExistingClients = async () => {
    const clients = await allPages<ClientOut>(async page => (await api.get<ClientPage>('/clients/', {
      params: { page, per_page: 100 },
    })).data)
    const contacts = new Set<string>()
    for (const client of clients) {
      if (client.contact_phone) contacts.add(`phone:${normalizePhone(client.contact_phone)}`)
      if (client.contact_email) contacts.add(`email:${normalizeEmail(client.contact_email)}`)
    }
    return contacts
  }

  const validateEmail = (email: string): boolean => {
    if (!email) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im
    return phoneRegex.test(phone.trim())
  }

  const normalizePhone = (phone: string): string => {
    return phone.trim().replace(/[\s\-()]/g, '')
  }

  const normalizeEmail = (email: string): string => {
    return email.trim().toLowerCase()
  }

  const validateData = (data: ParsedClient[], existingContacts: Set<string>): ValidationError[] => {
    const errors: ValidationError[] = []
    const seenPhones = new Set<string>()
    const seenEmails = new Set<string>()

    for (const client of data) {
      const row = client.row
      const addError = (field: string, message: string) => errors.push({ row, field, message })
      if (!client.full_name.trim()) addError('full_name', t('import.nameRequired'))
      if (client.contact_email && !validateEmail(client.contact_email)) addError('contact_email', t('import.invalidEmail'))
      if (client.contact_phone && !validatePhone(client.contact_phone)) addError('contact_phone', t('import.invalidPhone'))
      const phone = client.contact_phone ? normalizePhone(client.contact_phone) : ''
      const email = client.contact_email ? normalizeEmail(client.contact_email) : ''
      if (phone && existingContacts.has(`phone:${phone}`)) addError('contact_phone', t('import.duplicateExists'))
      if (email && existingContacts.has(`email:${email}`)) addError('contact_email', t('import.duplicateExists'))
      // Only a usable row claims its contacts. An invalid row must not hide a later valid one.
      if (errors.some(error => error.row === row)) continue
      if (phone && seenPhones.has(phone)) addError('contact_phone', t('import.duplicateInFile'))
      if (email && seenEmails.has(email)) addError('contact_email', t('import.duplicateInFile'))
      if (!errors.some(error => error.row === row)) {
        if (phone) seenPhones.add(phone)
        if (email) seenEmails.add(email)
      }
    }
    return errors
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setFileError('')
    setParsedData([])
    setValidationErrors([])
    setImportResult(null)

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][]

      if (jsonData.length === 0) {
        rejectFile(t('import.emptyFile'))
        return
      }

      const headers = jsonData[0].map((h) => String(h).toLowerCase().trim())
      const nameColIndex = headers.findIndex((h: string) =>
        ['имя', 'name', 'фио', 'full name', 'full_name'].includes(h)
      )
      const phoneColIndex = headers.findIndex((h: string) =>
        ['телефон', 'phone', 'тел', 'contact_phone', 'contact phone'].includes(h)
      )
      const emailColIndex = headers.findIndex((h: string) =>
        ['email', 'e-mail', 'почта', 'contact_email', 'contact email'].includes(h)
      )

      if (nameColIndex === -1) {
        rejectFile(t('import.nameColumnNotFound'))
        return
      }

      const parsed: ParsedClient[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        const fullName = nameColIndex >= 0 && row[nameColIndex] ? String(row[nameColIndex]).trim() : ''
        const phone = phoneColIndex >= 0 && row[phoneColIndex] ? String(row[phoneColIndex]).trim() : ''
        const email = emailColIndex >= 0 && row[emailColIndex] ? String(row[emailColIndex]).trim() : ''

        if (!fullName && !phone && !email) continue

        parsed.push({
          full_name: fullName,
          contact_phone: phone || undefined,
          contact_email: email || undefined,
          row: i + 1,
        })
      }

      let existingContacts: Set<string>
      try {
        existingContacts = await loadExistingClients()
      } catch {
        rejectFile(t('common.loadError'))
        return
      }
      const errors = validateData(parsed, existingContacts)
      setParsedData(parsed)
      setValidationErrors(errors)
    } catch (error) {
      console.error('Error parsing file:', error)
      rejectFile(t('import.parseError'))
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return
    if (validationErrors.length > 0) {
      if (!confirm(t('import.importWithErrors'))) {
        return
      }
    }

    setIsImporting(true)
    setImportResult(null)

    const result: ImportResult = {
      success: 0,
      skipped: 0,
      errors: [],
      existing: [],
    }

    const validRows = new Set(
      parsedData
        .filter((client) => !validationErrors.some((err) => err.row === client.row))
        .map((client) => client.row)
    )

    for (const client of parsedData) {
      if (!validRows.has(client.row)) {
        result.skipped++
        continue
      }

      try {
        await api.post('/clients/', {
          full_name: client.full_name.trim(),
          contact_phone: client.contact_phone?.trim() || undefined,
          contact_email: client.contact_email?.trim() || undefined,
        })
        result.success++
      } catch (error) {
        result.skipped++
        const duplicate = apiClientExists(error)
        if (duplicate) {
          result.existing.push({ row: client.row, clientId: duplicate.existingClientId })
          continue
        }
        result.errors.push({
          row: client.row,
          message:
            apiErrorMessage(error, t('import.importError')),
        })
      }
    }

    setImportResult(result)
    setIsImporting(false)

    queryClient.invalidateQueries({ queryKey: ['clients'] })
    queryClient.invalidateQueries({ queryKey: ['clients-statistics'] })
  }

  const handleReset = () => {
    setFile(null)
    setParsedData([])
    setValidationErrors([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!isOpen) return null

  const validRows = parsedData.filter(
    (_, index) => !validationErrors.some((err) => err.row === parsedData[index].row)
  ).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('import.title')}
          </h2>
          <button
            aria-label={t('common.close')}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-400"
            disabled={isImporting}
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {}
        <div className="p-6 space-y-6">
          {}
          {fileError && <div role="alert"><FormError message={fileError} /></div>}
          {!file && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">
                {t('import.selectFile')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:text-gray-400"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('import.fileFormat')}
              </p>
            </div>
          )}

          {}
          {file && parsedData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {t('import.preview')}
                </h3>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={isImporting}
                >
                  {t('import.selectOtherFile')}
                </button>
              </div>

              {}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-700">{t('import.totalRows')}</div>
                  <div className="text-2xl font-bold text-blue-900">{parsedData.length}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm text-green-700">
                    {t('import.validRows')}
                  </div>
                  <div className="text-2xl font-bold text-green-900">{validRows}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-700">
                    {t('import.errors')}
                  </div>
                  <div className="text-2xl font-bold text-red-900">{validationErrors.length}</div>
                </div>
              </div>

              {}
              {validationErrors.length > 0 && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">
                    {t('import.validationErrors')}
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {validationErrors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700">
                        {t('import.row')} {error.row}: {error.message}
                      </div>
                    ))}
                    {validationErrors.length > 10 && (
                      <div className="text-sm text-red-600">
                        … {validationErrors.length - 10} {t('import.moreErrors')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {}
              <div className="border border-gray-200 rounded-lg overflow-hidden dark:border-gray-700">
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 sticky top-0 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                          #
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                          {t('clients.name')}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                          {t('clients.phone')}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                          {t('clients.email')}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                          {t('import.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {parsedData.slice(0, 20).map((client, idx) => {
                        const hasError = validationErrors.some((err) => err.row === client.row)
                        return (
                          <tr
                            key={idx}
                            className={hasError ? 'bg-red-50' : 'bg-green-50'}
                          >
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{client.row}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{client.full_name}</td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                              {client.contact_phone || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                              {client.contact_email || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {hasError ? (
                                <span className="text-red-600 flex items-center gap-1">
                                  <HiXCircle className="w-4 h-4" />
                                  {t('import.error')}
                                </span>
                              ) : (
                                <span className="text-green-600 flex items-center gap-1">
                                  <HiCheckCircle className="w-4 h-4" />
                                  {t('import.ready')}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {parsedData.length > 20 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-sm text-gray-500 text-center dark:text-gray-400">
                            … {parsedData.length - 20} {t('import.moreRows')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {}
          {importResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3">
                {t('import.result')}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <HiCheckCircle className="w-5 h-5" />
                  <span>
                    {t('import.successCount')}: {importResult.success}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-yellow-700">
                  <HiExclamationCircle className="w-5 h-5" />
                  <span>
                    {t('import.skippedCount')}: {importResult.skipped}
                  </span>
                </div>
                {importResult.existing.length > 0 && (
                  <div className="mt-3">
                    <div className="font-medium text-yellow-800 mb-2">
                      {t('import.alreadyInList')}:
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.existing.map((item) => (
                        <div key={item.row} className="text-sm text-yellow-800 flex items-center gap-2">
                          <span>{t('import.row')} {item.row}</span>
                          {onOpenClient && (
                            <button
                              type="button"
                              onClick={() => onOpenClient(item.clientId)}
                              className="text-purple-700 hover:underline font-medium"
                            >
                              {t('import.openClient')}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-3">
                    <div className="font-medium text-red-700 mb-2">
                      {t('import.errors')}:
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.slice(0, 10).map((error, idx) => (
                        <div key={idx} className="text-sm text-red-600">
                          {t('import.row')} {error.row}: {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          <button
            aria-label={t('common.close')}
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-900"
          >
            {t('common.cancel')}
          </button>
          {parsedData.length > 0 && !importResult && (
            <button
              onClick={handleImport}
              disabled={isImporting || validRows === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('import.importing')}
                </>
              ) : (
                <>
                  <HiUpload className="w-4 h-4" />
                  {t('import.import')} ({validRows})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
