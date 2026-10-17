import { useTranslation } from '../hooks/useTranslation'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import BusinessForm from '../components/BusinessForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../store/authStore'
import { useLabels } from '../i18n/labels'
import type { BusinessOut } from '../api/types'

export default function Business() {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const labels = useLabels()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const queryClient = useQueryClient()

  const { data: business, isLoading } = useQuery<BusinessOut | null>({
    queryKey: ['business', 'me'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/businesses/me')
        return data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: user?.role === 'admin' || user?.role === 'business_owner',
  })

  const handleSuccess = async () => {
    setShowForm(false)
    setEditingId(undefined)
    // a new business changes the user's business_id, and nearly every page depends on it -
    // refresh the stored user and drop all cached answers (they were fetched without a business)
    try {
      const { data } = await api.get('/users/me')
      const { token } = useAuthStore.getState()
      if (token) useAuthStore.getState().setAuth(token, data)
    } catch (error) {
      console.error('Failed to refresh the user after saving the business:', error)
    }
    queryClient.invalidateQueries()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('business.title')}</h1>
        {!showForm && !business && (user?.role === 'admin' || user?.role === 'business_owner') && (
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {t('business.create')}
          </button>
        )}
        {!showForm && business && (
          <button
            onClick={() => {
              setEditingId(business.id)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {t('business.edit')}
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <BusinessForm
            businessId={editingId}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingId(undefined)
            }}
          />
        </div>
      ) : business ? (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{t('business.name')}</label>
              <p className="text-lg font-semibold text-gray-900">{business.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{t('business.type')}</label>
              <p className="text-gray-900">{labels.businessType(business.business_type)}</p>
            </div>
            {business.address && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{t('business.address')}</label>
                <p className="text-gray-900">{business.address}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {business.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('clients.phone')}</label>
                  <p className="text-gray-900">{business.phone}</p>
                </div>
              )}
              {business.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">{t('clients.email')}</label>
                  <p className="text-gray-900">{business.email}</p>
                </div>
              )}
            </div>
            {business.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">{t('business.description')}</label>
                <p className="text-gray-900">{business.description}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">{t('business.empty')}</p>
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {t('business.create')}
          </button>
        </div>
      )}
    </div>
  )
}

