import { allPages } from '../api/allPages'
import type { Schema } from '../api/types'
import QueryError from '../components/QueryError'
import { useEffect, useState } from 'react'
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
import { useWorkspaceAccessContext } from '../hooks/useWorkspaceAccess'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { HiOutlineChevronRight, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi'

type Product = Schema<'ProductOut'>

export default function Inventory() {
  const { t } = useTranslation()
  const labels = useLabels()
  const { user } = useAuthStore()
  const access = useWorkspaceAccessContext()
  const canManage = (user?.role === 'admin' || user?.role === 'business_owner') && (!access || access.crm_mode === 'full')
  const queryClient = useQueryClient()
  const currency = useBusinessCurrency()
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState<Product | null>(null)
  const [formError, setFormError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [addQuantityProduct, setAddQuantityProduct] = useState<Product | null>(null)
  const [addQuantityValue, setAddQuantityValue] = useState('')

  useEffect(() => {
    if (!canManage) {
      setShowAddForm(false)
      setShowEditForm(null)
      setAddQuantityProduct(null)
      setAddQuantityValue('')
      setFormError('')
    }
  }, [canManage])

  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', searchTerm, lowStockOnly],
    queryFn: ({ signal }) => allPages<Product>(async page => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (lowStockOnly) params.append('low_stock_only', 'true')
      params.set('page', String(page))
      params.set('per_page', '100')
      const { data } = await api.get<Schema<'PaginatedResponse_ProductOut_'>>(`/products/?${params.toString()}`, { signal })
      return data
    }),
  })

  const rows = products ?? []
  const lowStockProducts = rows.filter(p => p.quantity <= p.min_quantity)
  
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

  return (
    <div>
      <div className="page-toolbar">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="page-title">{t('inventory.title')}</h1>
          <span className="shrink-0 rounded border border-[var(--workspace-line)] px-2 py-0.5 text-xs tabular-nums text-[var(--workspace-muted)]">{isLoading || isError ? '—' : rows.length}</span>
        </div>
        {canManage && <Button onClick={() => setShowAddForm(true)} className="shrink-0"><HiOutlinePlus />{t('inventory.add_product')}</Button>}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--workspace-line)] p-4">
          <div className="min-w-0 flex-1 basis-60 sm:max-w-sm">
            <Input type="search" aria-label={t('inventory.search_placeholder')} placeholder={t('inventory.search_placeholder')}
              value={searchTerm} onChange={event => setSearchTerm(event.target.value)} />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--workspace-muted)]">
            <input type="checkbox" checked={lowStockOnly} onChange={event => setLowStockOnly(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--workspace-line)] accent-[var(--workspace-accent)]" />
            {t('inventory.low_stock_only')}
          </label>
          {rows.length > 0 && !isError && !isLoading && <div className="ml-auto">
            <ExportButton data={rows}
              columns={[
                { key: 'name', label: t('inventory.name') },
                { key: 'description', label: t('inventory.description') },
                { key: 'category', label: t('inventory.category') },
                { key: 'quantity', label: t('inventory.quantity'), format: (val, row) => `${val} ${labels.unit(row?.unit)}` },
                { key: 'min_quantity', label: t('inventory.min_quantity'), format: (val, row) => `${val} ${labels.unit(row?.unit)}` },
                { key: 'price_per_unit', label: t('inventory.price'), format: val => val != null ? formatCurrency(val, currency) : '-' },
                { key: 'barcode', label: t('inventory.barcode') },
                { key: 'supplier', label: t('inventory.supplier') },
                { key: 'is_active', label: t('services.status'), format: val => val ? t('services.active') : t('services.inactive') },
              ]}
              filename={`inventory-${today()}`} title={t('export.inventoryReport')}
              reportTypes={[t('export.stockRemaining'), t('export.movements'), t('export.writeoffs')]}
              dataType={searchTerm || lowStockOnly ? 'filtered' : 'all'} />
          </div>}
        </div>

        {!isLoading && !isError && lowStockProducts.length > 0 && <div className="border-b border-[var(--workspace-line)] bg-amber-50/60 px-4 py-3 text-sm dark:bg-amber-950/20">
          <p className="font-medium text-amber-800 dark:text-amber-200">{t('inventory.low_stock_warning').replace('{count}', String(lowStockProducts.length))}</p>
          <p className="mt-0.5 text-xs text-[var(--workspace-muted)]">{t('inventory.low_stock_description')}</p>
        </div>}

        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-[var(--workspace-bg)] text-left text-xs font-medium uppercase tracking-wide text-[var(--workspace-muted)]">
              <tr>
                <th className="px-3 py-3 sm:px-5">{t('inventory.name')}</th>
                <th className="hidden w-[15%] px-4 py-3 md:table-cell">{t('inventory.category')}</th>
                <th className="w-24 px-2 py-3 sm:w-28 sm:px-4">{t('inventory.quantity')}</th>
                <th className="hidden w-28 px-4 py-3 xl:table-cell">{t('inventory.min_quantity')}</th>
                <th className="hidden w-24 px-4 py-3 xl:table-cell">{t('inventory.price')}</th>
                {canManage && <th className="w-24 px-2 py-3 text-right sm:w-44 sm:px-4">{t('inventory.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--workspace-line)]">
              {!isError && !isLoading && rows.map(product => <tr key={product.id} className="hover:bg-[var(--workspace-bg)]">
                      <td className="px-3 py-3 sm:px-5">
                        {canManage ? <button type="button" aria-label={`${t('inventory.edit')}: ${product.name}`} onClick={() => setShowEditForm(product)}
                          className="inline-flex max-w-full items-center gap-1.5 text-left text-sm font-medium hover:text-[var(--workspace-accent)]">
                          <span className="min-w-0 [overflow-wrap:anywhere]">{product.name}</span><HiOutlineChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-muted)]" />
                        </button> : <span className="text-sm font-medium [overflow-wrap:anywhere]">{product.name}</span>}
                        {product.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--workspace-muted)] [overflow-wrap:anywhere]" title={product.description}>{product.description}</p>}
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--workspace-muted)] xl:hidden">
                          {product.category && <span className="[overflow-wrap:anywhere] md:hidden">{product.category}</span>}
                          {product.price_per_unit != null && <span>{formatCurrency(product.price_per_unit, currency)}</span>}
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-[var(--workspace-muted)] [overflow-wrap:anywhere] md:table-cell">{product.category || '—'}</td>
                      <td className="px-2 py-3 sm:px-4">
                        <div className="text-sm font-medium tabular-nums">{product.quantity} {labels.unit(product.unit)}</div>
                        {product.quantity <= product.min_quantity && <span className="mt-1 inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">{t('inventory.low_stock')}</span>}
                        <p className="mt-1 text-xs text-[var(--workspace-muted)] xl:hidden">{t('inventory.min_quantity')}: {product.min_quantity} {labels.unit(product.unit)}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-sm tabular-nums text-[var(--workspace-muted)] xl:table-cell">{product.min_quantity} {labels.unit(product.unit)}</td>
                      <td className="hidden px-4 py-3 text-sm tabular-nums text-[var(--workspace-muted)] xl:table-cell">{product.price_per_unit != null ? formatCurrency(product.price_per_unit, currency) : '—'}</td>
                      {canManage && <td className="px-2 py-3 sm:px-4">
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end">
                          <Button variant="quiet" className="min-h-8 whitespace-normal px-1.5 py-1 text-xs" onClick={() => setAddQuantityProduct(product)}>{t('inventory.add_quantity')}</Button>
                          <Button variant="quiet" aria-label={t('inventory.delete')} title={t('inventory.delete')} className="min-h-8 px-1.5 py-1 text-red-600 dark:text-red-400"
                            onClick={() => { if (window.confirm(t('inventory.confirm_delete'))) deleteMutation.mutate(product.id) }}><HiOutlineTrash /></Button>
                        </div>
                      </td>}
                    </tr>)}
            </tbody>
          </table>
          {/* states live outside the table: a colSpan over columns hidden on a phone squeezed the name column */}
          {isError ? <QueryError retry={refetch} />
            : isLoading ? <div className="py-8"><LoadingSpinner /></div>
              : rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-[var(--workspace-muted)]">{t('inventory.no_products')}</p>}
        </div>
      </Card>

      {canManage && showAddForm && (
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

      {canManage && showEditForm && (
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

      {canManage && addQuantityProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-5">
            <h3 className="mb-4 text-base font-semibold [overflow-wrap:anywhere]">
              {t('inventory.add_quantity_to')} {addQuantityProduct.name}
            </h3>
            <label htmlFor="inventory-add-quantity" className="mb-1.5 block text-sm font-medium">{t('inventory.quantity')}</label>
            <Input
              id="inventory-add-quantity"
              type="number"
              step="0.01"
              min="0"
              value={addQuantityValue}
              onChange={(e) => setAddQuantityValue(e.target.value)}
              placeholder={t('inventory.quantity')}
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary"
                onClick={() => {
                  setAddQuantityProduct(null)
                  setAddQuantityValue('')
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button disabled={addQuantityMutation.isPending || !(parseFloat(addQuantityValue) > 0)}
                onClick={() => {
                  const quantity = parseFloat(addQuantityValue)
                  if (quantity > 0) {
                    addQuantityMutation.mutate({ id: addQuantityProduct.id, quantity })
                  }
                }}
              >
                {t('common.save')}
              </Button>
            </div>
          </Card>
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
        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {product ? t('inventory.edit_product') : t('inventory.add_product')}
        </h3>
        <form onSubmit={handleSubmit}>
          {error && <div role="alert" className="mb-4"><FormError message={error} /></div>}
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
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
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('inventory.description')}
            </label>
            <textarea
              value={formData.description ?? ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-unit" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('inventory.unit')} *
              </label>
              <select
                id="product-unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:border-gray-600 dark:bg-gray-800"
                required
              >
                {unitOptions.map((code) => (
                  <option key={code} value={code}>{labels.unit(code)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('inventory.category')}
              </label>
              <input
                type="text"
                value={formData.category ?? ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('inventory.quantity')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('inventory.min_quantity')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_quantity}
                onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('inventory.price')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_unit || ''}
                onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('inventory.barcode')}
              </label>
              <input
                type="text"
                value={formData.barcode ?? ''}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                {t('inventory.supplier')}
              </label>
              <input
                type="text"
                value={formData.supplier ?? ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
              {t('inventory.location')}
            </label>
            <input
              type="text"
              value={formData.location ?? ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-600"
            />
          </div>
          </div>
          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-700"
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

