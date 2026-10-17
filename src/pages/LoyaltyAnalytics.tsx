import { format, startOfDay, endOfDay } from 'date-fns'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'

export default function LoyaltyAnalytics() {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date()
    return format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM-dd')
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    const now = new Date()
    return format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd')
  })

  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['loyalty-statistics', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', startOfDay(new Date(dateFrom + 'T00:00:00')).toISOString())
      if (dateTo) params.append('date_to', endOfDay(new Date(dateTo + 'T00:00:00')).toISOString())
      const { data } = await api.get(`/loyalty/analytics/statistics?${params.toString()}`)
      return data
    },
  })

  const { data: levelDistribution, isLoading: isLoadingLevelDist } = useQuery({
    queryKey: ['loyalty-level-distribution'],
    queryFn: async () => {
      const { data } = await api.get('/loyalty/analytics/level-distribution')
      return data
    },
  })

  const { data: topClients, isLoading: isLoadingTopClients } = useQuery({
    queryKey: ['loyalty-top-clients'],
    queryFn: async () => {
      const { data } = await api.get('/loyalty/analytics/top-clients?limit=10')
      return data
    },
  })

  const { data: promotions, isLoading: isLoadingPromotions } = useQuery({
    queryKey: ['loyalty-promotion-effectiveness', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', startOfDay(new Date(dateFrom + 'T00:00:00')).toISOString())
      if (dateTo) params.append('date_to', endOfDay(new Date(dateTo + 'T00:00:00')).toISOString())
      const { data } = await api.get(`/loyalty/analytics/promotion-effectiveness?${params.toString()}`)
      return data
    },
  })

  return (
    <div className="space-y-6">
      {}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.date_from')}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.date_to')}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {}
      {isLoadingStats ? (
        <LoadingSpinner />
      ) : statistics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Participants</h3>
            <p className="text-3xl font-bold text-gray-900">{statistics.total_participants || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('loyalty.points')} Earned</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.total_points_earned?.toFixed(0) || '0'}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{t('loyalty.points')} Spent</h3>
            <p className="text-3xl font-bold text-red-600">{statistics.total_points_spent?.toFixed(0) || '0'}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active {t('loyalty.points')}</h3>
            <p className="text-3xl font-bold text-green-600">{statistics.active_points_balance?.toFixed(0) || '0'}</p>
          </div>
        </div>
      ) : null}

      {}
      {isLoadingLevelDist ? (
        <LoadingSpinner />
      ) : levelDistribution?.distribution && levelDistribution.distribution.length > 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('loyalty.levels')} Distribution</h2>
          <div className="space-y-3">
            {levelDistribution.distribution.map((item: any) => (
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
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Clients</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('loyalty.points')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('loyalty.cashback')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topClients.clients.map((client: any) => (
                  <tr key={client.client_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Promotion Effectiveness</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique Clients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('loyalty.points')} Awarded</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.promotions.map((promo: any) => (
                  <tr key={promo.promotion_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {promo.promotion_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {promo.usage_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
