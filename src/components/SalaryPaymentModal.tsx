import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HiX } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/client'
import { formatCurrency } from '../utils/currency'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'

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
    new Date().toISOString().split('T')[0]
  )
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash')
  const [status, setStatus] = useState<'completed' | 'pending' | 'failed'>('completed')
  const [notes, setNotes] = useState<string>('')

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
      queryClient.invalidateQueries({ queryKey: [`employee-salary-current`, employeeId] })
      queryClient.invalidateQueries({ queryKey: [`employee-salary-history`, employeeId] })
      queryClient.invalidateQueries({ queryKey: [`employee-salary-${salaryId}`, employeeId] })
      handleClose()
    },
  })

  const handleClose = () => {
    setAmount('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentMethod('cash')
    setStatus('completed')
    setNotes('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(t('salary.invalidAmount') || 'Неверная сумма')
      return
    }

    if (numAmount > remainingAmount) {
      alert(t('salary.exceedsRemaining') || `Сумма превышает остаток: ${formatCurrency(remainingAmount, currency)}`)
      return
    }

    createMutation.mutate({
      amount: numAmount,
      payment_date: new Date(paymentDate + 'T12:00:00').toISOString(),
      payment_method: paymentMethod,
      status,
      notes: notes.trim() || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('salary.recordPayment') || 'Зарегистрировать выплату'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={createMutation.isPending}
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              {t('salary.remainingAmount') || 'Остаток к выплате'}:{' '}
              <span className="font-semibold">{formatCurrency(remainingAmount, currency)}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('salary.amount') || 'Сумма выплаты'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('salary.paymentDate') || 'Дата выплаты'}
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('salary.paymentMethod') || 'Способ оплаты'}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="cash">{t('finance.payment_cash') || 'Наличные'}</option>
              <option value="card">{t('finance.payment_card') || 'Карта'}</option>
              <option value="transfer">{t('salary.transfer') || 'Перевод'}</option>
              <option value="other">{t('finance.payment_other') || 'Другое'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('salary.status') || 'Статус'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="completed">{t('salary.completed') || 'Завершено'}</option>
              <option value="pending">{t('salary.pending') || 'Ожидается'}</option>
              <option value="failed">{t('salary.failed') || 'Не удалось'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('salary.notes') || 'Заметки'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder={t('salary.paymentNotes') || 'Дополнительная информация о выплате'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {createMutation.isPending
                ? (t('common.saving' as any) || 'Сохранение...')
                : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
