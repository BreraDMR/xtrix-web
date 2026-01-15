import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import BusinessForm from '../components/BusinessForm'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuthStore } from '../store/authStore'

interface Business {
  id: number
  name: string
  business_type: string
  address?: string
  phone?: string
  email?: string
  description?: string
  currency?: string
  created_at: string
}

export default function Business() {
  const { user } = useAuthStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | undefined>()
  const queryClient = useQueryClient()

  // Получаем бизнес текущего пользователя
  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ['business', 'me'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/businesses/me')
        return data
      } catch (error: any) {
        // Если бизнес не найден (404), возвращаем null
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: user?.role === 'admin' || user?.role === 'business_owner',
  })

  const handleSuccess = () => {
    setShowForm(false)
    setEditingId(undefined)
    queryClient.invalidateQueries({ queryKey: ['business'] })
    // Обновляем данные пользователя, чтобы получить обновленный business_id
    queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
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
        <h1 className="text-2xl font-bold">My Business</h1>
        {!showForm && !business && (user?.role === 'admin' || user?.role === 'business_owner') && (
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Create Business
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
            Edit Business
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
              <label className="block text-sm font-medium text-gray-500 mb-1">Business Name</label>
              <p className="text-lg font-semibold text-gray-900">{business.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Business Type</label>
              <p className="text-gray-900 capitalize">{business.business_type}</p>
            </div>
            {business.address && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                <p className="text-gray-900">{business.address}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {business.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                  <p className="text-gray-900">{business.phone}</p>
                </div>
              )}
              {business.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-900">{business.email}</p>
                </div>
              )}
            </div>
            {business.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                <p className="text-gray-900">{business.description}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">You don't have a business yet.</p>
          <button
            onClick={() => {
              setEditingId(undefined)
              setShowForm(true)
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Create Business
          </button>
        </div>
      )}
    </div>
  )
}

