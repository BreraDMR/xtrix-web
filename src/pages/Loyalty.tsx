import { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'

type TabType = 'program' | 'levels' | 'promotions' | 'transactions'

interface LoyaltyProgram {
  id: number
  business_id: number
  program_type: 'points' | 'cashback' | 'hybrid'
  points_per_currency: number
  points_name?: string
  currency_per_point?: number
  cashback_percent?: number
  use_levels: boolean
  points_expiry_days?: number
  birthday_bonus_enabled: boolean
  birthday_bonus_points?: number
  birthday_bonus_percent?: number
  max_bonus_payment_percent?: number
  is_active: boolean
  created_at: string
}

interface LoyaltyLevel {
  id: number
  program_id: number
  name: string
  level_number: number
  min_spending: number
  points_multiplier?: number
  cashback_multiplier?: number
  benefits?: string
  color?: string
  created_at: string
}

interface LoyaltyPromotion {
  id: number
  program_id: number
  name: string
  promotion_type: 'double_points' | 'extra_cashback' | 'bonus_points' | 'discount'
  bonus_points?: number
  discount_percent?: number
  points_multiplier?: number
  cashback_percent?: number
  start_date: string
  end_date: string
  min_amount?: number
  client_id?: number
  service_ids?: string
  is_active: boolean
  created_at: string
}

interface LoyaltyTransaction {
  id: number
  client_id: number
  business_id: number
  transaction_type: 'earned' | 'spent' | 'birthday_bonus' | 'level_up'
  points_amount: number
  cashback_amount?: number
  program_id: number
  visit_id?: number
  promotion_id?: number
  level_id?: number
  description?: string
  expiry_date?: string
  created_at: string
}

export default function Loyalty() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('program')
  
  const isAdmin = user?.role === 'admin' || user?.role === 'business_owner'
  
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'program', label: t('loyalty.program_settings'), icon: '⚙️' },
    { id: 'levels', label: t('loyalty.levels'), icon: '⭐' },
    { id: 'promotions', label: t('loyalty.promotions'), icon: '🎁' },
    { id: 'transactions', label: t('loyalty.transactions'), icon: '📋' },
  ]

  // Fetch program
  const { data: program, isLoading: isLoadingProgram } = useQuery({
    queryKey: ['loyalty-program'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/loyalty/program')
        return data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    enabled: activeTab === 'program',
  })

  // Fetch levels
  const { data: levels = [], isLoading: isLoadingLevels } = useQuery({
    queryKey: ['loyalty-levels'],
    queryFn: async () => {
      const { data } = await api.get('/loyalty/levels')
      return data
    },
    enabled: activeTab === 'levels' && !!program,
  })

  // Fetch promotions
  const { data: promotions = [], isLoading: isLoadingPromotions } = useQuery({
    queryKey: ['loyalty-promotions'],
    queryFn: async () => {
      const { data } = await api.get('/loyalty/promotions')
      return data
    },
    enabled: activeTab === 'promotions' && !!program,
  })

  // Create/Update program mutation
  const programMutation = useMutation({
    mutationFn: async (programData: Partial<LoyaltyProgram>) => {
      if (program) {
        const { data } = await api.put('/loyalty/program', programData)
        return data
      } else {
        const { data } = await api.post('/loyalty/program', programData)
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-program'] })
    },
  })

  // Delete program mutation
  const deleteProgramMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/loyalty/program')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-program'] })
    },
  })

  // Create level mutation
  const createLevelMutation = useMutation({
    mutationFn: async (levelData: Partial<LoyaltyLevel>) => {
      const { data } = await api.post('/loyalty/levels', levelData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-levels'] })
    },
  })

  // Update level mutation
  const updateLevelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LoyaltyLevel> }) => {
      const { data: result } = await api.put(`/loyalty/levels/${id}`, data)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-levels'] })
    },
  })

  // Delete level mutation
  const deleteLevelMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/loyalty/levels/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-levels'] })
    },
  })

  // Create promotion mutation
  const createPromotionMutation = useMutation({
    mutationFn: async (promotionData: Partial<LoyaltyPromotion>) => {
      const { data } = await api.post('/loyalty/promotions', promotionData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-promotions'] })
    },
  })

  // Update promotion mutation
  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LoyaltyPromotion> }) => {
      const { data: result } = await api.put(`/loyalty/promotions/${id}`, data)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-promotions'] })
    },
  })

  // Delete promotion mutation
  const deletePromotionMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/loyalty/promotions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-promotions'] })
    },
  })

  const [showProgramForm, setShowProgramForm] = useState(false)
  const [showLevelForm, setShowLevelForm] = useState(false)
  const [showPromotionForm, setShowPromotionForm] = useState(false)
  const [editingLevel, setEditingLevel] = useState<LoyaltyLevel | null>(null)
  const [editingPromotion, setEditingPromotion] = useState<LoyaltyPromotion | null>(null)

  const handleCreateProgram = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const programData: any = {
      business_id: user?.business_id,
      program_type: formData.get('program_type'),
      points_per_currency: parseFloat(formData.get('points_per_currency') as string),
      points_name: formData.get('points_name') as string || undefined,
      currency_per_point: formData.get('currency_per_point') ? parseFloat(formData.get('currency_per_point') as string) : undefined,
      cashback_percent: formData.get('cashback_percent') ? parseFloat(formData.get('cashback_percent') as string) : undefined,
      use_levels: formData.get('use_levels') === 'on',
      points_expiry_days: formData.get('points_expiry_days') ? parseInt(formData.get('points_expiry_days') as string) : undefined,
      birthday_bonus_enabled: formData.get('birthday_bonus_enabled') === 'on',
      birthday_bonus_points: formData.get('birthday_bonus_points') ? parseFloat(formData.get('birthday_bonus_points') as string) : undefined,
      birthday_bonus_percent: formData.get('birthday_bonus_percent') ? parseFloat(formData.get('birthday_bonus_percent') as string) : undefined,
      max_bonus_payment_percent: formData.get('max_bonus_payment_percent') ? parseFloat(formData.get('max_bonus_payment_percent') as string) : undefined,
      is_active: formData.get('is_active') === 'on',
    }
    
    try {
      await programMutation.mutateAsync(programData)
      setShowProgramForm(false)
    } catch (error) {
      console.error('Error creating program:', error)
    }
  }

  const handleUpdateProgram = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const programData: any = {
      program_type: formData.get('program_type'),
      points_per_currency: parseFloat(formData.get('points_per_currency') as string),
      points_name: formData.get('points_name') as string || undefined,
      currency_per_point: formData.get('currency_per_point') ? parseFloat(formData.get('currency_per_point') as string) : undefined,
      cashback_percent: formData.get('cashback_percent') ? parseFloat(formData.get('cashback_percent') as string) : undefined,
      use_levels: formData.get('use_levels') === 'on',
      points_expiry_days: formData.get('points_expiry_days') ? parseInt(formData.get('points_expiry_days') as string) : undefined,
      birthday_bonus_enabled: formData.get('birthday_bonus_enabled') === 'on',
      birthday_bonus_points: formData.get('birthday_bonus_points') ? parseFloat(formData.get('birthday_bonus_points') as string) : undefined,
      birthday_bonus_percent: formData.get('birthday_bonus_percent') ? parseFloat(formData.get('birthday_bonus_percent') as string) : undefined,
      max_bonus_payment_percent: formData.get('max_bonus_payment_percent') ? parseFloat(formData.get('max_bonus_payment_percent') as string) : undefined,
      is_active: formData.get('is_active') === 'on',
    }
    
    try {
      await programMutation.mutateAsync(programData)
      setShowProgramForm(false)
    } catch (error) {
      console.error('Error updating program:', error)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('loyalty.title')}</h1>
        <p className="text-gray-600">{t('loyalty.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-x-auto">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Program Settings Tab */}
      {activeTab === 'program' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {isLoadingProgram ? (
            <LoadingSpinner />
          ) : !program ? (
            <div>
              <p className="text-gray-600 mb-4">{t('loyalty.no_program')}</p>
              {isAdmin && (
                <button
                  onClick={() => setShowProgramForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {t('loyalty.create_program')}
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{t('loyalty.program_settings')}</h2>
                  <p className={`text-sm mt-1 ${program.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {program.is_active ? t('loyalty.is_active') : t('loyalty.program_not_active')}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowProgramForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      {t('loyalty.edit_program')}
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete the loyalty program?')) {
                          await deleteProgramMutation.mutateAsync()
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      {t('loyalty.delete_program')}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.program_type')}</label>
                  <p className="text-gray-900">{t(`loyalty.program_${program.program_type}`)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.points_per_currency')}</label>
                  <p className="text-gray-900">{program.points_per_currency}</p>
                </div>
                {program.currency_per_point && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.currency_per_point')}</label>
                    <p className="text-gray-900">{program.currency_per_point}</p>
                  </div>
                )}
                {program.cashback_percent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.cashback_percent')}</label>
                    <p className="text-gray-900">{program.cashback_percent}%</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.use_levels')}</label>
                  <p className="text-gray-900">{program.use_levels ? 'Yes' : 'No'}</p>
                </div>
                {program.points_expiry_days && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.points_expiry_days')}</label>
                    <p className="text-gray-900">{program.points_expiry_days} {t('common.days')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Program Form Modal */}
          {(showProgramForm || !program) && isAdmin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowProgramForm(false)}>
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{program ? t('loyalty.edit_program') : t('loyalty.create_program')}</h3>
                <form onSubmit={program ? handleUpdateProgram : handleCreateProgram}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.program_type')}</label>
                      <select
                        name="program_type"
                        defaultValue={program?.program_type}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="points">{t('loyalty.program_points')}</option>
                        <option value="cashback">{t('loyalty.program_cashback')}</option>
                        <option value="hybrid">{t('loyalty.program_hybrid')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.points_per_currency')}</label>
                      <input
                        type="number"
                        name="points_per_currency"
                        step="0.01"
                        defaultValue={program?.points_per_currency}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.points_name')}</label>
                      <input
                        type="text"
                        name="points_name"
                        defaultValue={program?.points_name || 'Points'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.currency_per_point')}</label>
                      <input
                        type="number"
                        name="currency_per_point"
                        step="0.01"
                        defaultValue={program?.currency_per_point}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.cashback_percent')}</label>
                      <input
                        type="number"
                        name="cashback_percent"
                        step="0.01"
                        defaultValue={program?.cashback_percent}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="use_levels"
                        defaultChecked={program?.use_levels}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">{t('loyalty.use_levels')}</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.points_expiry_days')}</label>
                      <input
                        type="number"
                        name="points_expiry_days"
                        defaultValue={program?.points_expiry_days}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="birthday_bonus_enabled"
                        defaultChecked={program?.birthday_bonus_enabled}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">{t('loyalty.birthday_bonus_enabled')}</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.birthday_bonus_points')}</label>
                      <input
                        type="number"
                        name="birthday_bonus_points"
                        step="0.01"
                        defaultValue={program?.birthday_bonus_points}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('loyalty.max_bonus_payment_percent')}</label>
                      <input
                        type="number"
                        name="max_bonus_payment_percent"
                        step="0.01"
                        defaultValue={program?.max_bonus_payment_percent}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={program?.is_active ?? true}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">{t('loyalty.is_active')}</label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProgramForm(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Levels Tab */}
      {activeTab === 'levels' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {!program ? (
            <p className="text-gray-600">{t('loyalty.no_program')}</p>
          ) : isLoadingLevels ? (
            <LoadingSpinner />
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('loyalty.levels')}</h2>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingLevel(null)
                      setShowLevelForm(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {t('loyalty.add_level')}
                  </button>
                )}
              </div>
              {levels.length === 0 ? (
                <p className="text-gray-600">{t('loyalty.no_levels')}</p>
              ) : (
                <div className="space-y-4">
                  {levels.map((level: LoyaltyLevel) => (
                    <div key={level.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          {level.color && (
                            <div
                              className="w-6 h-6 rounded-full"
                              style={{ backgroundColor: level.color }}
                            />
                          )}
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{level.name}</h3>
                            <p className="text-sm text-gray-600">Level {level.level_number} • Min: {level.min_spending} €</p>
                            {level.benefits && <p className="text-sm text-gray-600 mt-1">{level.benefits}</p>}
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingLevel(level)
                                setShowLevelForm(true)
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this level?')) {
                                  await deleteLevelMutation.mutateAsync(level.id)
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {!program ? (
            <p className="text-gray-600">{t('loyalty.no_program')}</p>
          ) : isLoadingPromotions ? (
            <LoadingSpinner />
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('loyalty.promotions')}</h2>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingPromotion(null)
                      setShowPromotionForm(true)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {t('loyalty.add_promotion')}
                  </button>
                )}
              </div>
              {promotions.length === 0 ? (
                <p className="text-gray-600">{t('loyalty.no_promotions')}</p>
              ) : (
                <div className="space-y-4">
                  {promotions.map((promotion: LoyaltyPromotion) => (
                    <div key={promotion.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{promotion.name}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(promotion.start_date).toLocaleDateString()} - {new Date(promotion.end_date).toLocaleDateString()}
                          </p>
                          <p className={`text-sm mt-1 ${promotion.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                            {promotion.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingPromotion(promotion)
                                setShowPromotionForm(true)
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this promotion?')) {
                                  await deletePromotionMutation.mutateAsync(promotion.id)
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('loyalty.transactions')}</h2>
          <p className="text-gray-600">{t('loyalty.no_transactions')}</p>
        </div>
      )}
    </div>
  )
}
