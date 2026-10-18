import QueryError from '../components/QueryError'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from '../hooks/useTranslation'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import { apiErrorMessage } from '../api/errors'
import LoadingSpinner from '../components/LoadingSpinner'
import FormError from '../components/FormError'
import { useBusinessCurrency } from '../hooks/useBusinessCurrency'
import { formatCurrency } from '../utils/currency'
import ExportButton from '../components/ExportButton'
import { today } from '../utils/dates'
import { UNIT_CODES, useLabels } from '../i18n/labels'

interface Product {
  id: number
  name: string
  description?: string
  unit: string
  quantity: number
  min_quantity: number
  price_per_unit?: number
  category?: string
  barcode?: string
  supplier?: string
  location?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function Inventory() {
  const { t } = useTranslation()
  const labels = useLabels()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const currency = useBusinessCurrency()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState<Product | null>(null)
  const [formError, setFormError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [addQuantityProduct, setAddQuantityProduct] = useState<Product | null>(null)
  const [addQuantityValue, setAddQuantityValue] = useState('')

  const { data: productsResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', searchTerm, lowStockOnly],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (lowStockOnly) params.append('low_stock_only', 'true')
      const { data } = await api.get(`/products/?${params.toString()}`)
      return data
    },
  })

  const products: Product[] = productsResponse?.items || []
  const lowStockProducts = products.filter(p => p.quantity <= p.min_quantity)
  
  const createMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      // /users/me gives the business, staff get their employer's
      const businessId = user?.business_id
      if (!businessId) throw new Error(t('inventory.businessRequired'))
      try {
        const { data } = await api.post('/products/', {
          ...product,
          business_id: businessId,
        })
        return data
      } catch (error) {
        throw new Error(apiErrorMessage(error, t('inventory.createError')))
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowAddForm(false)
    },
    onError: (error) => setFormError(error.message || t('inventory.createError')),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: number }) => {
      const { data } = await api.put(`/products/${id}`, updates)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowEditForm(null)
    },
    onError: (error) => setFormError(apiErrorMessage(error, t('common.error_saving'))),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const addQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const { data } = await api.post(`/products/${id}/add-quantity?quantity=${quantity}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setAddQuantityProduct(null)
      setAddQuantityValue('')
    },
  })

  if (isError) return <QueryError retry={refetch} />

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('inventory.title')}</h1>
        {(user?.role === 'admin' || user?.role === 'business_owner') && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + {t('inventory.add_product')}
          </button>
        )}
      </div>

      {}
      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-900">
                {t('inventory.low_stock_warning').replace('{count}', lowStockProducts.length.toString())}
              </h3>
              <p className="text-sm text-yellow-700">{t('inventory.low_stock_description')}</p>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <input
          type="text"
          placeholder={t('inventory.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>{t('inventory.low_stock_only')}</span>
          </label>
          {products.length > 0 && (
            <ExportButton
              data={products}
              columns={[
                { key: 'name', label: t('inventory.name') },
                { key: 'description', label: 'Description' },
                { key: 'category', label: t('inventory.category') },
                { key: 'quantity', label: t('inventory.quantity'), format: (val, row) => `${val} ${labels.unit(row?.unit)}` },
                { key: 'min_quantity', label: t('inventory.min_quantity'), format: (val, row) => `${val} ${labels.unit(row?.unit)}` },
                { key: 'price_per_unit', label: t('inventory.price'), format: (val) => val ? formatCurrency(val, currency) : '-' },
                { key: 'barcode', label: 'Barcode' },
                { key: 'supplier', label: 'Supplier' },
                { key: 'is_active', label: 'Status', format: (val) => val ? 'Active' : 'Inactive' },
              ]}
              filename={`inventory-${today()}`}
              title={t('export.inventoryReport')}
              reportTypes={[
                t('export.stockRemaining'),
                t('export.movements'),
                t('export.writeoffs'),
              ]}
              dataType={(searchTerm || lowStockOnly) ? 'filtered' : 'all'}
            />
          )}
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.name')}
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  {t('inventory.category')}
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.quantity')}
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  {t('inventory.min_quantity')}
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  {t('inventory.price')}
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('inventory.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 sm:px-6 py-12 text-center text-gray-500">
                    {t('inventory.no_products')}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
              <tr
                key={product.id}
                className={product.quantity <= product.min_quantity ? 'bg-yellow-50' : ''}
              >
                <td className="px-2 sm:px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  {product.description && (
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">{product.description}</div>
                  )}
                  <div className="text-xs text-gray-500 md:hidden mt-1">
                    {product.category || '-'}
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                  {product.category || '-'}
                </td>
                <td className="px-2 sm:px-6 py-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        product.quantity <= product.min_quantity ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {product.quantity} {labels.unit(product.unit)}
                    </span>
                    {product.quantity <= product.min_quantity && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        {t('inventory.low_stock')}
                      </span>
                    )}
                    <div className="text-xs text-gray-500 lg:hidden">
                      {t('inventory.min_quantity')}: {product.min_quantity} {labels.unit(product.unit)}
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {product.min_quantity} {labels.unit(product.unit)}
                </td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {product.price_per_unit ? formatCurrency(product.price_per_unit, currency) : '-'}
                </td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1 sm:space-x-2">
                  {(user?.role === 'admin' || user?.role === 'business_owner') && (
                    <>
                      <button
                        onClick={() => setShowEditForm(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t('inventory.edit')}
                      </button>
                      <button
                        onClick={() => setAddQuantityProduct(product)}
                        className="text-green-600 hover:text-green-900"
                      >
                        {t('inventory.add_quantity')}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t('inventory.confirm_delete'))) {
                            deleteMutation.mutate(product.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('inventory.delete')}
                      </button>
                    </>
                  )}
                </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      {showAddForm && (
        <ProductForm
          product={undefined}
          isLoading={createMutation.isPending}
          error={formError}
          onSubmit={(product) => {
            setFormError('')
            createMutation.mutate(product)
          }}
          onCancel={() => {
            setFormError('')
            setShowAddForm(false)
          }}
        />
      )}

      {}
      {showEditForm && (
        <ProductForm
          product={showEditForm}
          isLoading={updateMutation.isPending}
          error={formError}
          onSubmit={(updates) => {
            setFormError('')
            updateMutation.mutate({ id: showEditForm.id, ...updates })
          }}
          onCancel={() => {
            setFormError('')
            setShowEditForm(null)
          }}
        />
      )}

      {}
      {addQuantityProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {t('inventory.add_quantity_to')} {addQuantityProduct.name}
            </h3>
            <input
              type="number"
              step="0.01"
              min="0"
              value={addQuantityValue}
              onChange={(e) => setAddQuantityValue(e.target.value)}
              placeholder={t('inventory.quantity')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setAddQuantityProduct(null)
                  setAddQuantityValue('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  const quantity = parseFloat(addQuantityValue)
                  if (quantity > 0) {
                    addQuantityMutation.mutate({ id: addQuantityProduct.id, quantity })
                  }
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductForm({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
  error = '',
}: {
  product?: Product
  onSubmit: (product: Partial<Product>) => void
  onCancel: () => void
  isLoading?: boolean
  error?: string
}) {
  const { t } = useTranslation()
  const labels = useLabels()
  // older products may have a unit typed by hand - keep it selectable
  const unitOptions: string[] = [...UNIT_CODES]
  if (product?.unit && !unitOptions.includes(product.unit)) unitOptions.push(product.unit)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: product?.name || '',
    description: product?.description || '',
    unit: product?.unit || 'pcs',
    quantity: product?.quantity || 0,
    min_quantity: product?.min_quantity || 0,
    price_per_unit: product?.price_per_unit || undefined,
    category: product?.category || '',
    barcode: product?.barcode || '',
    supplier: product?.supplier || '',
    location: product?.location || '',
    is_active: product?.is_active ?? true,
  })
  const [nameError, setNameError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // unit is a select with a default, so the name is the only thing that can be missing
    if (!formData.name || !formData.name.trim()) {
      setNameError(t('validation.code.empty'))
      return
    }
    setNameError('')
    onSubmit(formData)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {product ? t('inventory.edit_product') : t('inventory.add_product')}
        </h3>
        <form onSubmit={handleSubmit}>
          {error && <div role="alert" className="mb-4"><FormError message={error} /></div>}
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inventory.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg ${nameError ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
            <FormError message={nameError} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inventory.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-unit" className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.unit')} *
              </label>
              <select
                id="product-unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
                required
              >
                {unitOptions.map((code) => (
                  <option key={code} value={code}>{labels.unit(code)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.category')}
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.quantity')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.min_quantity')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.price')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_unit || ''}
                onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.barcode')}
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('inventory.supplier')}
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('inventory.location')}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

