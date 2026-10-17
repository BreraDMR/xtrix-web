import { useState, useEffect } from 'react'
import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
import LoadingSpinner from './LoadingSpinner'
import { useLabels } from '../i18n/labels'
import type { BusinessType } from '../api/types'

// same order as the API enum
const BUSINESS_TYPES: BusinessType[] = ['salon', 'clinic', 'medical', 'dental', 'hospital', 'individual']

interface BusinessFormProps {
  businessId?: number
  onSuccess: () => void
  onCancel: () => void
}

interface BusinessData {
  name: string
  business_type: BusinessType
  address?: string
  phone?: string
  email?: string
  description?: string
  currency?: string
}

export default function BusinessForm({ businessId, onSuccess, onCancel }: BusinessFormProps) {
  const labels = useLabels()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BusinessData>({
    name: '',
    business_type: 'salon',
    currency: 'EUR',
  })

  useEffect(() => {
    if (businessId) {
      loadBusiness()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loaders are plain functions, rerun only on these
  }, [businessId])

  const loadBusiness = async () => {
    try {
      const { data } = await api.get(`/businesses/${businessId}`)
      setFormData({
        name: data.name || '',
        business_type: data.business_type || 'salon',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        description: data.description || '',
        currency: data.currency || 'EUR',
      })
    } catch (error) {
      console.error('Failed to load business:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const businessData: any = { ...formData }
      Object.keys(businessData).forEach(key => {
        if (businessData[key] === '' || businessData[key] === undefined) {
          delete businessData[key]
        }
      })

      if (businessId) {
        await api.put(`/businesses/${businessId}`, businessData)
      } else {
        await api.post('/businesses', businessData)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Error saving business:', error)
      const errorMessage = apiErrorMessage(error, 'Failed to save business')
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Business Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-3 py-2 border rounded-md"
          placeholder="e.g., My Beauty Salon"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Business Type *</label>
        <select
          value={formData.business_type}
          onChange={(e) => setFormData({ ...formData, business_type: e.target.value as BusinessType })}
          required
          className="w-full px-3 py-2 border rounded-md"
        >
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>{labels.businessType(type)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Business address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="+1234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="business@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Business description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Currency</label>
        <select
          value={formData.currency || 'EUR'}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="EUR">EUR (€)</option>
          <option value="USD">USD ($)</option>
          <option value="CZK">CZK (Kč)</option>
          <option value="RUB">RUB (₽)</option>
          <option value="UAH">UAH (₴)</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Saving...</span>
            </>
          ) : (
            businessId ? 'Update Business' : 'Create Business'
          )}
        </button>
      </div>
    </form>
  )
}

