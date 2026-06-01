'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PageLoading } from '@/components/ui/Loading'
import { formatCurrency } from '@/lib/utils'
import { BarChart3, DollarSign, Users, Package, Store, Shield, TrendingUp, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        if (data.success) setStats(data.data)
      } catch {}
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (status === 'loading' || loading) return <PageLoading />
  if (!session) return null

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Platform Dashboard</h1>
        <p className="text-gray-500 mt-1">Super Admin overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Store className="w-5 h-5" />} label="Active Tenants" value={String(stats?.activeTenants ?? '--')} color="bg-primary-100 text-primary-600" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={stats?.totalRevenue != null ? formatCurrency(stats.totalRevenue) : '--'} color="bg-green-100 text-green-600" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={String(stats?.totalUsers ?? '--')} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<Package className="w-5 h-5" />} label="Total Products" value={String(stats?.totalProducts ?? '--')} color="bg-purple-100 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatCard icon={<Activity className="w-5 h-5" />} label="Active Plans" value={String(stats?.activePlans ?? '--')} color="bg-amber-100 text-amber-600" />
        <StatCard icon={<Shield className="w-5 h-5" />} label="Super Admins" value={String(stats?.superAdmins ?? '--')} color="bg-red-100 text-red-600" />
      </div>

      <div className="mt-8 card p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">Platform Management</h3>
        <p className="text-sm text-gray-500 mt-1">Use the sidebar to manage tenants, plans, settings and users.</p>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3">
        <div className={`kpi-icon ${color}`}>{icon}</div>
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value text-lg sm:text-xl">{value}</p>
        </div>
      </div>
    </div>
  )
}
