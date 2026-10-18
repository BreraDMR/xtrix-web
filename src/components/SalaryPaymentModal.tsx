import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HiX } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/client'
import FormError from './FormError'
import { apiErrorMessage } from '../api/errors'
import { formatCurrency } from '../utils/currency'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { dayNoon, today } from '../utils/dates'
import type { SalaryPaymentCreate } from '../api/types'

interface SalaryPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: number
  salaryId: number
  remainingAmount: number
}

export default function SalaryPaymentModal({
  isOpen,
  onClose,
  employeeId,
  salaryId,
  remainingAmount,
}: SalaryPaymentModalProps) {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(
    today()
  )
  const [paymentMethod, setPaymentMethod] = useState<SalaryPaymentCreate['payment_method']>('cash')
  const [status, setStatus] = useState<SalaryPaymentCreate['status']>('completed')
  const [notes, setNotes] = useState<string>('')
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data: {
      amount: number
      payment_date: string
      payment_method: string
      status: string
      notes?: string
    }) => {
      const { data: result } = await api.post(
        `/employees/${employeeId}/salary/${salaryId}/payments`,
        data
      )
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-current', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary-history', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary-detail', employeeId, salaryId] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      handleClose()
    },
    onError: (err) => setError(apiErrorMessage(err, t('common.error_saving'))),
  })

  const handleClose = () => {
    setAmount('')
    setPaymentDate(today())
    setPaymentMethod('cash')
    setStatus('completed')
    setNotes('')
    setError('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    setError('')
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('salary.invalidAmount'))
      return
    }

    if (numAmount > remainingAmount) {
      setError(t('salary.exceedsRemaining'))
      return
    }

    createMutation.mutate({
      amount: numAmount,
      payment_date: dayNoon(paymentDate),
      payment_method: paymentMethod,
      status,
      notes: notes.trim() || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full dark:bg-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('salary.recordPayment')}
          </h2>
          <button
            aria-label={t('common.close')}
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors dark:hover:text-gray-400"
            disabled={createMutation.isPending}
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div role="alert"><FormError message={error} /></div>}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              {t('salary.remainingAmount')}:{' '}
              <span className="font-semibold">{formatCurrency(remainingAmount, currency)}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('salary.amount')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('salary.paymentDate')}
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('salary.paymentMethod')}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as SalaryPaymentCreate['payment_method'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
              required
            >
              <option value="cash">{t('finance.payment_cash')}</option>
              <option value="card">{t('finance.payment_card')}</option>
              <option value="transfer">{t('salary.transfer')}</option>
              <option value="other">{t('finance.payment_other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('salary.status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SalaryPaymentCreate['status'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
              required
            >
              <option value="completed">{t('salary.completed')}</option>
              <option value="pending">{t('salary.pending')}</option>
              <option value="failed">{t('salary.failed')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('salary.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600"
              rows={3}
              placeholder={t('salary.paymentNotes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-900"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending
                ? (t('common.saving'))
                : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
