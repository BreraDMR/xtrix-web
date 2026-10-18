import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/client'
import type { Schema } from '../api/types'
import LoadingSpinner from '../components/LoadingSpinner'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import { dayEnd, dayStart, today } from '../utils/dates'

export default function LoyaltyAnalytics() {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date()
    return today(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    const now = new Date()
    return today(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  })

  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['loyalty-statistics', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dayStart(dateFrom))
      if (dateTo) params.append('date_to', dayEnd(dateTo))
      const { data } = await api.get<Schema<'LoyaltyStatisticsResponse'>>(`/loyalty/analytics/statistics?${params.toString()}`)
      return data
    },
  })

  const { data: levelDistribution, isLoading: isLoadingLevelDist } = useQuery({
    queryKey: ['loyalty-level-distribution'],
    queryFn: async () => {
      const { data } = await api.get<Schema<'LevelDistributionResponse'>>('/loyalty/analytics/level-distribution')
      return data
    },
  })

  const { data: topClients, isLoading: isLoadingTopClients } = useQuery({
    queryKey: ['loyalty-top-clients'],
    queryFn: async () => {
      const { data } = await api.get<Schema<'TopClientsResponse'>>('/loyalty/analytics/top-clients?limit=10')
      return data
    },
  })

  const { data: promotions, isLoading: isLoadingPromotions } = useQuery({
    queryKey: ['loyalty-promotion-effectiveness', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', dayStart(dateFrom))
      if (dateTo) params.append('date_to', dayEnd(dateTo))
      const { data } = await api.get<Schema<'PromotionEffectivenessResponse'>>(`/loyalty/analytics/promotion-effectiveness?${params.toString()}`)
      return data
    },
  })

  return (
    <div className="space-y-6">
      {}
      <div className="bg-white p-4 rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{t('analytics.date_from')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">{t('analytics.date_to')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {}
      {isLoadingStats ? (
        <LoadingSpinner />
      ) : statistics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">Total Participants</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{statistics.total_participants || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">{t('loyalty.points')} Earned</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.total_points_earned?.toFixed(0) || '0'}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">{t('loyalty.points')} Spent</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.total_points_spent?.toFixed(0) || '0'}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
            <h3 className="text-sm font-medium text-gray-500 mb-2 dark:text-gray-400">Active {t('loyalty.points')}</h3>
            <p className="text-3xl font-bold text-green-600">{statistics.active_points_balance?.toFixed(0) || '0'}</p>
          </div>
        </div>
      ) : null}

      {}
      {isLoadingLevelDist ? (
        <LoadingSpinner />
      ) : levelDistribution?.distribution && levelDistribution.distribution.length > 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">{t('loyalty.levels')} Distribution</h2>
          <div className="space-y-3">
            {levelDistribution.distribution.map((item) => (
              <div key={item.level_id || 'none'} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="font-medium">{item.level_name}</span>
                </div>
                <span className="font-bold">{item.client_count} clients</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {}
      {isLoadingTopClients ? (
        <LoadingSpinner />
      ) : topClients?.clients && topClients.clients.length > 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">Top Clients</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">{t('loyalty.points')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">{t('loyalty.cashback')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {topClients.clients.map((client) => (
                  <tr key={client.client_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {client.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {client.points?.toFixed(0) || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(client.cashback, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {}
      {isLoadingPromotions ? (
        <LoadingSpinner />
      ) : promotions?.promotions && promotions.promotions.length > 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">Promotion Effectiveness</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Promotion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Usage Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Unique Clients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-400">{t('loyalty.points')} Awarded</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {promotions.promotions.map((promo) => (
                  <tr key={promo.promotion_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {promo.promotion_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {promo.usage_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {promo.unique_clients}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {promo.total_points_awarded?.toFixed(0) || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
