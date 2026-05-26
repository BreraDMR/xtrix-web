import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'

type TabType = 'retention' | 'cohorts' | 'trends' | 'forecast' | 'services' | 'insights' | 'benchmarks'

export default function Analytics() {
  const { t } = useTranslation()
  const currency = useBusinessCurrency()
  const [activeTab, setActiveTab] = useState<TabType>('retention')
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  })
  
  const [trendMetric, setTrendMetric] = useState<'revenue' | 'clients' | 'visits' | 'average_check' | 'load'>('revenue')
  const [trendComparison, setTrendComparison] = useState<'MoM' | 'WoW' | 'YoY'>('MoM')
  const [forecastType, setForecastType] = useState<'revenue' | 'visits'>('revenue')
  const [forecastPeriods, setForecastPeriods] = useState(3)

  const tabs: { id: TabType; label: string }[] = [
    { id: 'retention', label: t('analytics.retention') },
    { id: 'cohorts', label: t('analytics.cohorts') },
    { id: 'trends', label: t('analytics.trends') },
    { id: 'forecast', label: t('analytics.forecast') },
    { id: 'services', label: t('analytics.services_specialists') },
    { id: 'insights', label: t('analytics.insights') },
    { id: 'benchmarks', label: t('analytics.benchmarks') },
  ]

  const { data: retentionData, isLoading: isLoadingRetention } = useQuery({
    queryKey: ['retention-metrics', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', new Date(dateFrom).toISOString())
      if (dateTo) params.append('date_to', new Date(dateTo + 'T23:59:59').toISOString())
      const { data } = await api.get(`/analytics/retention/metrics?${params.toString()}`)
      return data
    },
    enabled: activeTab === 'retention',
  })

  const { data: cohortsData, isLoading: isLoadingCohorts } = useQuery({
    queryKey: ['cohorts', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', new Date(dateFrom).toISOString())
      if (dateTo) params.append('date_to', new Date(dateTo + 'T23:59:59').toISOString())
      const { data } = await api.get(`/analytics/retention/cohorts?${params.toString()}`)
      return data
    },
    enabled: activeTab === 'cohorts',
  })

  const { data: trendsData, isLoading: isLoadingTrends } = useQuery({
    queryKey: ['trends', trendMetric, trendComparison],
    queryFn: async () => {
      const { data } = await api.get('/analytics/trends', {
        params: {
          metric: trendMetric,
          comparison_type: trendComparison,
        },
      })
      return data
    },
    enabled: activeTab === 'trends',
  })

  const { data: forecastData, isLoading: isLoadingForecast } = useQuery({
    queryKey: ['forecast', forecastType, forecastPeriods],
    queryFn: async () => {
      const { data } = await api.get('/analytics/forecast', {
        params: {
          forecast_type: forecastType,
          periods: forecastPeriods,
        },
      })
      return data
    },
    enabled: activeTab === 'forecast',
  })

  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services-specialists', dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('date_from', new Date(dateFrom).toISOString())
      if (dateTo) params.append('date_to', new Date(dateTo + 'T23:59:59').toISOString())
      const { data } = await api.get(`/analytics/services-specialists?${params.toString()}`)
      return data
    },
    enabled: activeTab === 'services',
  })

  const { data: insightsData, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/insights')
      return data
    },
    enabled: activeTab === 'insights',
  })

  const { data: benchmarksData, isLoading: isLoadingBenchmarks } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/benchmarks')
      return data
    },
    enabled: activeTab === 'benchmarks',
  })

  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('analytics.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('analytics.subtitle')}</p>
      </div>

      {}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {}
      {(activeTab === 'retention' || activeTab === 'cohorts' || activeTab === 'services') && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
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
      )}

      {}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          {isLoadingRetention ? (
            <LoadingSpinner />
          ) : retentionData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.retention_7_days')}</h3>
                  <p className="text-3xl font-bold text-blue-600">{retentionData.retention_7_days?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.retention_30_days')}</h3>
                  <p className="text-3xl font-bold text-blue-600">{retentionData.retention_30_days?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.retention_90_days')}</h3>
                  <p className="text-3xl font-bold text-blue-600">{retentionData.retention_90_days?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.repeat_rate')}</h3>
                  <p className="text-3xl font-bold text-green-600">{retentionData.repeat_rate?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.total_clients')}</h3>
                  <p className="text-3xl font-bold text-gray-900">{retentionData.total_clients || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.repeat_clients')}</h3>
                  <p className="text-3xl font-bold text-purple-600">{retentionData.repeat_clients || 0}</p>
                </div>
              </div>
              {retentionData.average_days_between_visits && (
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.avg_days_between_visits')}</h3>
                  <p className="text-2xl font-bold text-gray-900">{retentionData.average_days_between_visits.toFixed(1)} days</p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">{t('analytics.no_data')}</div>
          )}
        </div>
      )}

      {}
      {activeTab === 'cohorts' && (
        <div className="space-y-6">
          {isLoadingCohorts ? (
            <LoadingSpinner />
          ) : cohortsData?.cohort_table && cohortsData.cohort_table.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.cohort_month')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.total_clients')}</th>
                    {[0, 1, 2, 3, 4, 5, 6].map((month) => (
                      <th key={month} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        M{month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cohortsData.cohort_table.map((cohort: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cohort.cohort_month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cohort.total_clients}</td>
                      {[0, 1, 2, 3, 4, 5, 6].map((month) => (
                        <td key={month} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cohort[`month_${month}`]?.toFixed(1) || '-'}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">{t('analytics.no_data')}</div>
          )}
        </div>
      )}

      {}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.trend_metric')}</label>
                <select
                  value={trendMetric}
                  onChange={(e) => setTrendMetric(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="revenue">{t('analytics.metric_revenue')}</option>
                  <option value="clients">{t('analytics.metric_clients')}</option>
                  <option value="visits">{t('analytics.metric_visits')}</option>
                  <option value="average_check">{t('analytics.metric_average_check')}</option>
                  <option value="load">{t('analytics.metric_load')}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.trend_comparison')}</label>
                <select
                  value={trendComparison}
                  onChange={(e) => setTrendComparison(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="MoM">{t('analytics.comparison_mom')}</option>
                  <option value="WoW">{t('analytics.comparison_wow')}</option>
                  <option value="YoY">{t('analytics.comparison_yoy')}</option>
                </select>
              </div>
            </div>
          </div>

          {isLoadingTrends ? (
            <LoadingSpinner />
          ) : trendsData ? (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.current_value')}</h3>
                  <p className="text-3xl font-bold text-blue-600">{trendsData.current_value?.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.previous_value')}</h3>
                  <p className="text-3xl font-bold text-gray-600">{trendsData.previous_value?.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.change')}</h3>
                  <p className={`text-3xl font-bold ${trendsData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trendsData.change >= 0 ? '+' : ''}{trendsData.change?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.change_percent')}</h3>
                  <p className={`text-3xl font-bold ${trendsData.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trendsData.change_percent >= 0 ? '+' : ''}{trendsData.change_percent?.toFixed(2)}%
                    <span className="ml-2 text-2xl">
                      {trendsData.trend_direction === 'up' ? '📈' : trendsData.trend_direction === 'down' ? '📉' : '➡️'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">{t('analytics.no_data')}</div>
          )}
        </div>
      )}

      {}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.forecast_type')}</label>
                <select
                  value={forecastType}
                  onChange={(e) => setForecastType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="revenue">{t('analytics.forecast_revenue')}</option>
                  <option value="visits">{t('analytics.forecast_visits')}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.forecast_periods')}</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={forecastPeriods}
                  onChange={(e) => setForecastPeriods(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {isLoadingForecast ? (
            <LoadingSpinner />
          ) : forecastData ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.historical_average')}</h3>
                  <p className="text-2xl font-bold text-blue-600">{forecastData.historical_average?.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.last_value')}</h3>
                  <p className="text-2xl font-bold text-purple-600">{forecastData.last_value?.toFixed(2)}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecasted Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {forecastData.forecast?.map((f: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{f.period}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.forecasted_value?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">{t('analytics.no_data')}</div>
          )}
        </div>
      )}

      {}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {isLoadingServices ? (
            <LoadingSpinner />
          ) : servicesData ? (
            <>
              {}
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <h3 className="text-xl font-semibold text-gray-900 p-4 border-b border-gray-200">{t('analytics.services_specialists')} - Services</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.service_name')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.visit_count')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.total_revenue')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.avg_price')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.unique_clients')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.ltv_per_client')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.visits_per_client')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {servicesData.services?.map((service: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.service_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.visit_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(service.total_revenue, currency)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(service.average_price, currency)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.unique_clients}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(service.ltv_per_client, currency)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.visits_per_client?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {}
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <h3 className="text-xl font-semibold text-gray-900 p-4 border-b border-gray-200">{t('analytics.services_specialists')} - Specialists</h3>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.specialist_name')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.visit_count')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.total_revenue')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.avg_check')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.unique_clients')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('analytics.revenue_per_client')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {servicesData.specialists?.map((specialist: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{specialist.specialist_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{specialist.visit_count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(specialist.total_revenue, currency)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(specialist.average_check, currency)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{specialist.unique_clients}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(specialist.revenue_per_client, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">{t('analytics.no_data')}</div>
          )}
        </div>
      )}

      {}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {isLoadingInsights ? (
            <LoadingSpinner />
          ) : insightsData?.insights && insightsData.insights.length > 0 ? (
            insightsData.insights.map((insight: any, idx: number) => (
              <div
                key={idx}
                className={`p-6 rounded-xl shadow-md border-l-4 ${
                  insight.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : insight.type === 'success'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          insight.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : insight.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {insight.priority === 'high'
                          ? t('analytics.insight_priority_high')
                          : insight.priority === 'medium'
                          ? t('analytics.insight_priority_medium')
                          : t('analytics.insight_priority_low')}
                      </span>
                    </div>
                    <p className="text-gray-700">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">{t('analytics.no_data')}</div>
          )}
        </div>
      )}

      {}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          {isLoadingBenchmarks ? (
            <LoadingSpinner />
          ) : benchmarksData ? (
            benchmarksData.available ? (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('analytics.benchmarks_available')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t('analytics.business_count')}</h4>
                    <p className="text-2xl font-bold text-blue-600">{benchmarksData.business_count}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t('analytics.avg_check_benchmark')}</h4>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(benchmarksData.average_check, currency)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t('analytics.avg_visits_per_client')}</h4>
                    <p className="text-2xl font-bold text-purple-600">{benchmarksData.average_visits_per_client?.toFixed(2)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t('analytics.avg_retention_rate')}</h4>
                    <p className="text-2xl font-bold text-orange-600">{benchmarksData.average_retention_rate?.toFixed(2)}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">{t('analytics.avg_daily_load')}</h4>
                    <p className="text-2xl font-bold text-indigo-600">{benchmarksData.average_daily_load?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">{benchmarksData.reason || t('analytics.benchmarks_not_available')}</div>
            )
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">{t('analytics.no_data')}</div>
          )}
        </div>
      )}
    </div>
  )
}
