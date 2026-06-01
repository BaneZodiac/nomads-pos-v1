'use client'

import { useState, useEffect } from 'react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatCurrency, formatDateTime, getRoleBadgeClass } from '@/lib/utils'
import { Receipt, Search } from 'lucide-react'
import type { Sale } from '@/types'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  useEffect(() => {
    fetchSales()
  }, [page])

  const fetchSales = async () => {
    const res = await fetch(`/api/sales?page=${page}&limit=20`)
    const data = await res.json()
    if (data.success) {
      setSales(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    }
    setLoading(false)
  }

  const filtered = sales.filter(s =>
    s.invoiceNo.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} transactions</p>
        </div>
      </div>

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by invoice number..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Receipt className="w-12 h-12" />} title="No sales yet" description="Sales will appear here after you process transactions in POS" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th className="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale: any) => (
                <tr key={sale.id}>
                  <td className="font-mono text-xs font-medium">{sale.invoiceNo}</td>
                  <td className="text-xs">{formatDateTime(sale.createdAt)}</td>
                  <td>{sale.customer?.name || 'Walk-in'}</td>
                  <td>{sale.items?.length || 0}</td>
                  <td className="capitalize">{sale.paymentMethod}</td>
                  <td className="text-right font-semibold">{formatCurrency(sale.total)}</td>
                  <td>
                    <span className={`badge ${sale.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
