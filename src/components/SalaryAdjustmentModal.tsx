import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HiX } from 'react-icons/hi'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/client'

interface SalaryAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: number
  salaryId: number
}

export default function SalaryAdjustmentModal({
  isOpen,
  onClose,
  employeeId,
  salaryId,
}: SalaryAdjustmentModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [type, setType] = useState<'bonus' | 'penalty' | 'overtime' | 'allowance' | 'deduction'>('bonus')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  const createMutation = useMutation({
    mutationFn: async (data: { type: string; amount: number; description?: string }) => {
      const { data: result } = await api.post(
        `/employees/${employeeId}/salary/${salaryId}/adjustments`,
        data
      )
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-current', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary-history', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employee-salary-detail', employeeId, salaryId] })
      handleClose()
    },
  })

  const handleClose = () => {
    setType('bonus')
    setAmount('')
    setDescription('')
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount === 0) {
      alert(t('salary.invalidAmount'))
      return
    }

    const finalAmount = (type === 'penalty' || type === 'deduction') ? -Math.abs(numAmount) : Math.abs(numAmount)

    createMutation.mutate({
      type,
      amount: finalAmount,
      description: description.trim() || undefined,
    })
  }

  if (!isOpen) return null

  const typeOptions = [
    { value: 'bonus', label: t('salary.bonus'), color: 'green' },
    { value: 'penalty', label: t('salary.penalty'), color: 'red' },
    { value: 'overtime', label: t('salary.overtime'), color: 'blue' },
    { value: 'allowance', label: t('salary.allowance'), color: 'purple' },
    { value: 'deduction', label: t('salary.deduction'), color: 'orange' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('salary.addAdjustment')}
          </h2>
          <button
            aria-label={t('common.close')}
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={createMutation.isPending}
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('salary.adjustmentType')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('salary.amount')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {(type === 'penalty' || type === 'deduction') 
                ? t('salary.willBeDeducted')
                : t('salary.willBeAdded')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('salary.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder={t('salary.adjustmentDescription')}
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
              className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
                type === 'penalty' || type === 'deduction'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {createMutation.isPending
                ? (t('common.saving' as any))
                : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
