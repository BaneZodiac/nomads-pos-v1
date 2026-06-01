'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PageLoading } from '@/components/ui/Loading'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DashboardStats } from '@/types'
import {
  DollarSign, ShoppingCart, Package, Users, TrendingUp, Clock,
  AlertTriangle, BarChart3, ArrowUpRight
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (status === 'loading' || loading) return <PageLoading />
  if (!session) return null

  const isSuperAdmin = session.user?.role === 'SUPER_ADMIN'

  if (isSuperAdmin) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Platform Dashboard</h1>
          <p className="text-gray-500 mt-1">Super Admin overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Active Tenants" value="--" color="bg-primary-100 text-primary-600" />
          <StatCard icon={<DollarSign className="w-5 h-5" />} label="MRR" value="--" color="bg-green-100 text-green-600" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value="--" color="bg-blue-100 text-blue-600" />
          <StatCard icon={<Package className="w-5 h-5" />} label="Active Plans" value="--" color="bg-purple-100 text-purple-600" />
        </div>
        <div className="mt-8 card p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Platform Management</h3>
          <p className="text-sm text-gray-500 mt-1">Use the sidebar to manage tenants, plans, settings and users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Welcome back, {session.user?.name?.split(' ')[0]}</h1>
        <p className="text-gray-500 mt-1">Here's your business overview today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Today's Sales"
          value={formatCurrency(stats?.todaySales || 0)}
          change={stats?.todaySales ? '+12%' : undefined}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Transactions"
          value={String(stats?.todayTransactions || 0)}
          color="bg-primary-100 text-primary-600"
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Products"
          value={String(stats?.totalProducts || 0)}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Low Stock Items"
          value={String(stats?.lowStockItems || 0)}
          color="bg-red-100 text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Today's Activity</h3>
          </div>
          <div className="card-body">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.topProducts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{p.name}</span>
                    <span className="text-sm font-medium text-stone-900">{formatCurrency(p.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No sales data yet. Start by making a sale in POS!</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Sales by Payment Method</h3>
          </div>
          <div className="card-body">
            {stats?.salesByPayment && stats.salesByPayment.length > 0 ? (
              <div className="space-y-3">
                {stats.salesByPayment.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">{p.method}</span>
                    <span className="text-sm font-medium text-stone-900">{formatCurrency(p.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No payment data yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-6">
        <h3 className="section-title mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickActionButton href="/pos" label="New Sale" icon={<ShoppingCart />} />
          <QuickActionButton href="/products" label="Add Product" icon={<Package />} />
          <QuickActionButton href="/customers" label="Customers" icon={<Users />} />
          <QuickActionButton href="/reports" label="Reports" icon={<BarChart3 />} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, change, color }: { icon: React.ReactNode; label: string; value: string; change?: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3">
        <div className={`kpi-icon ${color}`}>{icon}</div>
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value text-lg sm:text-xl">{value}</p>
          {change && <p className="stat-change stat-change-up">{change}</p>}
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a href={href} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:bg-primary-50 hover:border-primary-200 transition-all group">
      <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </a>
  )
}
