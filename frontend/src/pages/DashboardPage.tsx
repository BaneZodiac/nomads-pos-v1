import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { DashboardData } from '../types';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data.data as DashboardData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Today's Sales", value: `$${data?.todaySales?.toFixed(2) || '0.00'}`, icon: '💰', color: 'bg-emerald-500' },
    { label: 'Transactions', value: data?.todayTransactions?.toString() || '0', icon: '🧾', color: 'bg-blue-500' },
    { label: 'Products', value: data?.totalProducts?.toString() || '0', icon: '📦', color: 'bg-purple-500' },
    { label: 'Customers', value: data?.totalCustomers?.toString() || '0', icon: '👥', color: 'bg-amber-500' },
  ];

  const revenueStats = [
    { label: 'Total Revenue', value: `$${data?.totalRevenue?.toFixed(2) || '0.00'}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Transactions', value: data?.totalTransactions?.toString() || '0', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Low Stock Items', value: data?.lowStockCount?.toString() || '0', color: data?.lowStockCount ? 'text-red-600' : 'text-slate-600', bg: data?.lowStockCount ? 'bg-red-50' : 'bg-slate-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <Link
          to="/pos"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-600/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Sale
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Summary */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Revenue Overview</h2>
          </div>
          <div className="p-5 grid grid-cols-3 gap-4">
            {revenueStats.map((stat, idx) => (
              <div key={idx} className={`${stat.bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/pos" className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">💳</span>
              <span className="font-medium">New Sale</span>
            </Link>
            <Link to="/products" className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">📦</span>
              <span className="font-medium">Add Product</span>
            </Link>
            <Link to="/customers" className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">👤</span>
              <span className="font-medium">Add Customer</span>
            </Link>
            <Link to="/reports" className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">📊</span>
              <span className="font-medium">View Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Sales & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Sales</h2>
            <Link to="/sales" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentSales?.length ? (
              data.recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-sm">
                      {sale.invoiceNo.slice(-4)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{sale.invoiceNo}</p>
                      <p className="text-xs text-slate-500">{sale.customer?.name || 'Walk-in'}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-600">${sale.grandTotal.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-slate-400">
                <p>No sales yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Low Stock Alerts</h2>
            <Link to="/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Manage</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.lowStockItems?.length ? (
              data.lowStockItems.slice(0, 5).map((product) => (
                <div key={product.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold text-sm">
                      {product.stocks?.[0]?.quantity || 0}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">Min: {product.minStock}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-lg">
                    Low Stock
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-slate-400">
                <p>No low stock items</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}