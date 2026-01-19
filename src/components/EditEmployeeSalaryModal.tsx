import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useTranslation } from '../hooks/useTranslation'
import { HiX } from 'react-icons/hi'

interface EditEmployeeSalaryModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId: number
  currentBaseSalary?: number
  currentCommissionPercentage?: number
}

export default function EditEmployeeSalaryModal({
  isOpen,
  onClose,
  employeeId,
  currentBaseSalary = 0,
  currentCommissionPercentage = 0,
}: EditEmployeeSalaryModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [baseSalary, setBaseSalary] = useState<string>(currentBaseSalary.toString())
  const [commissionPercentage, setCommissionPercentage] = useState<string>(currentCommissionPercentage.toString())

  useEffect(() => {
    if (isOpen) {
      setBaseSalary(currentBaseSalary.toString())
      setCommissionPercentage(currentCommissionPercentage.toString())
    }
  }, [isOpen, currentBaseSalary, currentCommissionPercentage])

  const updateMutation = useMutation({
    mutationFn: async (data: { base_salary?: number; commission_percentage?: number }) => {
      const { data: response } = await api.put(`/employees/${employeeId}`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const baseSalaryNum = parseFloat(baseSalary) || 0
    const commissionNum = parseFloat(commissionPercentage) || 0

    if (commissionNum < 0 || commissionNum > 100) {
      alert(t('employees.commission_invalid_range') || 'Комиссия должна быть от 0 до 100%')
      return
    }

    if (baseSalaryNum < 0) {
      alert(t('employees.base_salary_invalid') || 'Базовая зарплата не может быть отрицательной')
      return
    }

    updateMutation.mutate({
      base_salary: baseSalaryNum,
      commission_percentage: commissionNum,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 dark:bg-gray-800">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('employees.edit_salary') || 'Редактировать зарплату'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {t('employees.base_salary')} *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {t('employees.commission')} (%) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={commissionPercentage}
              onChange={(e) => setCommissionPercentage(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? (t('common.saving') || 'Сохранение...') : (t('common.save') || 'Сохранить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
