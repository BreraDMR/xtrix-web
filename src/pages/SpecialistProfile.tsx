import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTranslation, getTranslatedSpecialistType } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import { useLabels } from '../i18n/labels'

interface SpecialistProfileData {
  id: number
  user_id: number
  specialist_type?: string
  specialist_category?: string
  specialization?: string
  experience_years?: number
  education?: string
  certifications?: string
  business_name?: string
  business_type?: string
  address?: string
  description?: string
  languages?: string
  is_verified: string
  verified_at?: string
  created_at: string
  updated_at: string
}


export default function SpecialistProfile() {
  const { t, locale } = useTranslation()
  const labels = useLabels()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<SpecialistProfileData>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: profile, isLoading } = useQuery<SpecialistProfileData>({
    queryKey: ['specialist-profile'],
    queryFn: async () => {
      const { data } = await api.get('/specialist-profiles/me')
      return data
    },
    enabled: user?.role === 'specialist',
  })

  useEffect(() => {
    if (profile) {
      setFormData(profile)
    }
  }, [profile])

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      await api.put('/specialist-profiles/me', formData)
      queryClient.invalidateQueries({ queryKey: ['specialist-profile'] })
      setIsEditing(false)
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update profile'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData(profile)
    }
    setIsEditing(false)
    setError('')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {t('specialistProfile.notFound')}
          </p>
        </div>
      </div>
    )
  }

  const isVerified = profile.is_verified === 'verified'
  const isPending = profile.is_verified === 'pending'

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('specialistProfile.title')}</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {t('common.edit')}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isPending && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
          {t('specialistProfile.verificationPending')}
        </div>
      )}

      {isVerified && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {t('specialistProfile.verified')}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('specialistProfile.basicInfo')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.specialistType')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.specialist_type || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
              ) : (
                <p className="text-gray-900">
                  {formData.specialist_type
                    ? getTranslatedSpecialistType(formData.specialist_type, locale)
                    : '-'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.category')}
              </label>
              <p className="text-gray-900">
                {formData.specialist_category
                  ? labels.specialistCategory(formData.specialist_category)
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('specialistProfile.specialization')}</h2>
          {isEditing ? (
            <textarea
              value={formData.specialization || ''}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder={t('specialistProfile.specializationPlaceholder')}
            />
          ) : (
            <p className="text-gray-900">{formData.specialization || '-'}</p>
          )}
        </div>

        {}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('specialistProfile.experience')}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.experienceYears')}
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.experience_years || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_years: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className="text-gray-900">
                  {formData.experience_years ? `${formData.experience_years} ${t('specialistProfile.years')}` : '-'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.education')}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.education || ''}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={t('specialistProfile.educationPlaceholder')}
                />
              ) : (
                <p className="text-gray-900">{formData.education || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.certifications')}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.certifications || ''}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={t('specialistProfile.certificationsPlaceholder')}
                />
              ) : (
                <p className="text-gray-900">{formData.certifications || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('specialistProfile.businessInfo')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.businessName')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.business_name || ''}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className="text-gray-900">{formData.business_name || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.businessType')}
              </label>
              {isEditing ? (
                <select
                  value={formData.business_type || ''}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">-</option>
                  <option value="individual">{t('businessType.individual')}</option>
                  <option value="salon">{t('businessType.salon')}</option>
                  <option value="clinic">{t('businessType.clinic')}</option>
                  <option value="hospital">{t('businessType.hospital')}</option>
                  <option value="barbershop">{t('businessType.barbershop')}</option>
                  <option value="rehab_center">{t('businessType.rehabCenter')}</option>
                </select>
              ) : (
                <p className="text-gray-900">
                  {formData.business_type
                    ? labels.businessType(formData.business_type)
                    : '-'}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.address')}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                />
              ) : (
                <p className="text-gray-900">{formData.address || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {}
        <div>
          <h2 className="text-lg font-semibold mb-4">{t('specialistProfile.additionalInfo')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.description')}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={t('specialistProfile.descriptionPlaceholder')}
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{formData.description || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('specialistProfile.languages')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.languages || ''}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={t('specialistProfile.languagesPlaceholder')}
                />
              ) : (
                <p className="text-gray-900">{formData.languages || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-4 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

