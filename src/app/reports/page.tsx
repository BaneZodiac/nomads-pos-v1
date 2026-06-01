'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, TrendingUp, DollarSign, Receipt, Calendar } from 'lucide-react'

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')

  useEffect(() => {
    fetch(`/api/reports?period=${period}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  const periods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ]

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track your business performance</p>
        </div>
        <div className="flex gap-2">
          {periods.map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)} className={`btn btn-sm ${period === p.id ? 'btn-primary' : 'btn-outline'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="stat-card">
          <div className="kpi-icon bg-green-100 text-green-600 mb-3"><DollarSign className="w-5 h-5" /></div>
          <p className="stat-label">Total Sales</p>
          <p className="stat-value">{formatCurrency(data?.summary?.totalSales || 0)}</p>
        </div>
        <div className="stat-card">
          <div className="kpi-icon bg-blue-100 text-blue-600 mb-3"><TrendingUp className="w-5 h-5" /></div>
          <p className="stat-label">Total Profit</p>
          <p className="stat-value">{formatCurrency(data?.summary?.totalProfit || 0)}</p>
        </div>
        <div className="stat-card">
          <div className="kpi-icon bg-primary-100 text-primary-600 mb-3"><Receipt className="w-5 h-5" /></div>
          <p className="stat-label">Transactions</p>
          <p className="stat-value">{data?.summary?.totalTransactions || 0}</p>
        </div>
        <div className="stat-card">
          <div className="kpi-icon bg-purple-100 text-purple-600 mb-3"><BarChart3 className="w-5 h-5" /></div>
          <p className="stat-label">Avg Order Value</p>
          <p className="stat-value">{formatCurrency(data?.summary?.avgOrderValue || 0)}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Sales Breakdown</h3>
        </div>
        <div className="card-body">
          {data?.sales && data.sales.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Transactions</th>
                    <th className="text-right">Sales</th>
                    <th className="text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.map((s: any, i: number) => (
                    <tr key={i}>
                      <td>{s.date}</td>
                      <td className="text-right">{s.count}</td>
                      <td className="text-right font-medium">{formatCurrency(s.total)}</td>
                      <td className="text-right text-green-600 font-medium">{formatCurrency(s.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No data for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
