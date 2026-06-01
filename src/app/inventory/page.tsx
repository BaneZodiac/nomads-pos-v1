'use client'

import { useState, useEffect } from 'react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { Product, Stock } from '@/types'

export default function InventoryPage() {
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low'>('all')

  useEffect(() => {
    fetch('/api/inventory?include=product')
      .then(r => r.json())
      .then(d => { if (d.success) setStocks(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = stocks.filter((s: any) => {
    const matchesSearch = s.product?.name?.toLowerCase().includes(search.toLowerCase()) || s.product?.sku?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'low') return matchesSearch && s.quantity <= s.minStock
    return matchesSearch
  })

  const lowStock = stocks.filter((s: any) => s.quantity <= s.minStock)

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">{stocks.length} stock entries</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}>All</button>
          <button onClick={() => setFilter('low')} className={`btn btn-sm ${filter === 'low' ? 'btn-danger' : 'btn-outline'}`}>
            <AlertTriangle className="w-4 h-4" /> Low Stock ({lowStock.length})
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search inventory..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Package className="w-12 h-12" />} title="No inventory items" description="Stock will appear when products are created and stock is added." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Min Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id}>
                  <td className="font-medium text-stone-900">{s.product?.name || 'Unknown'}</td>
                  <td className="text-gray-400">{s.product?.sku || '-'}</td>
                  <td className={s.quantity <= s.minStock ? 'text-red-600 font-semibold' : ''}>{s.quantity}</td>
                  <td>{s.minStock}</td>
                  <td>
                    {s.quantity <= s.minStock ? (
                      <span className="badge badge-danger">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
