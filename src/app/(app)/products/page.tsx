'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Package, Plus, Edit2, Search, MoreHorizontal, Loader2, Upload, Download, FileSpreadsheet } from 'lucide-react'
import type { Product } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: { row: number; message: string }[]; totalRows: number } | null>(null)

  const [form, setForm] = useState({
    name: '', sku: '', price: '', costPrice: '', taxRate: '0',
    barcode: '', description: '', unit: 'pcs', lowStockQty: '5',
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const res = await fetch('/api/products?limit=1000')
    const data = await res.json()
    if (data.success) setProducts(data.data || [])
    setLoading(false)
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', sku: `SKU-${Date.now()}`, price: '', costPrice: '', taxRate: '0', barcode: '', description: '', unit: 'pcs', lowStockQty: '5' })
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, sku: p.sku, price: String(p.price), costPrice: String(p.costPrice),
      taxRate: String(p.taxRate), barcode: p.barcode || '', description: p.description || '',
      unit: p.unit, lowStockQty: String(p.lowStockQty),
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    setSaving(true)

    const payload = {
      ...form,
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice) || 0,
      taxRate: parseFloat(form.taxRate) || 0,
      lowStockQty: parseInt(form.lowStockQty) || 5,
    }

    const url = editing ? `/api/products?id=${editing.id}` : '/api/products'
    const method = editing ? 'PUT' : 'POST'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()

    if (data.success) {
      toast.success(editing ? 'Product updated' : 'Product created')
      setShowModal(false)
      fetchProducts()
    } else {
      toast.error(data.error || 'Failed to save')
    }
    setSaving(false)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/products/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setImportResult(data.data)
        if (data.data.created > 0) fetchProducts()
      } else {
        toast.error(data.error || 'Import failed')
      }
    } catch {
      toast.error('Failed to import file')
    }
    setImporting(false)
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const a = document.createElement('a')
    a.href = '/api/products/template'
    a.download = 'products-template.xlsx'
    a.click()
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn btn-outline">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={openCreate} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products by name or SKU..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="No products found"
          description={search ? 'Try a different search term' : 'Add your first product to start selling'}
          action={!search && <button onClick={openCreate} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Product</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(product => (
            <div key={product.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary-500" />
                </div>
                <button onClick={() => openEdit(product)} className="text-gray-300 hover:text-primary-500">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold text-stone-900">{product.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-bold text-primary-600">{formatCurrency(product.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="text-sm text-gray-600">{formatCurrency(product.costPrice)}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="badge badge-primary">{product.unit}</span>
                {product.taxRate > 0 && <span className="badge badge-info">{product.taxRate}% tax</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Product Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">SKU</label>
              <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input type="text" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Selling Price</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Cost Price</label>
              <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Tax Rate (%)</label>
              <input type="number" step="0.1" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Unit</label>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="select">
                <option value="pcs">Pieces</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="l">Liter</option>
                <option value="ml">Milliliter</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
              </select>
            </div>
            <div>
              <label className="label">Low Stock Alert</label>
              <input type="number" value={form.lowStockQty} onChange={e => setForm({ ...form, lowStockQty: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={showImport} onClose={() => { setShowImport(false); setImportResult(null) }} title="Import Products from Excel" size="lg">
        {importResult ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
              <FileSpreadsheet className="w-8 h-8 text-primary-500" />
              <div>
                <p className="font-medium text-stone-900">Import complete</p>
                <p className="text-sm text-gray-500">{importResult.totalRows} rows processed</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                <p className="text-2xl font-bold text-green-600">{importResult.created}</p>
                <p className="text-sm text-green-700">Created</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                <p className="text-sm text-amber-700">Skipped</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div>
                <p className="font-medium text-stone-900 mb-2">Errors ({importResult.errors.length})</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-sm text-red-600">
                      {err.row > 0 ? `Row ${err.row}: ` : ''}{err.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => { setShowImport(false); setImportResult(null) }} className="btn btn-primary">Done</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <Upload className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-4">Upload an Excel file (.xlsx or .xls)</p>
              <label className="btn btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {importing ? 'Processing...' : 'Choose File'}
                <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" disabled={importing} />
              </label>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button onClick={downloadTemplate} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <Download className="w-4 h-4" /> Download template
              </button>
              <button onClick={() => setShowImport(false)} className="btn btn-outline btn-sm">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
