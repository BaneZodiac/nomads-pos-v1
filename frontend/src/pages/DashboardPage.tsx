import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { DashboardData } from '../types';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data.data as DashboardData;
    },
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const cards = [
    { label: "Today's Sales", value: `$${data?.todaySales?.toFixed(2) || '0.00'}`, color: 'bg-blue-500' },
    { label: 'Transactions', value: data?.todayTransactions?.toString() || '0', color: 'bg-green-500' },
    { label: 'Products', value: data?.totalProducts?.toString() || '0', color: 'bg-purple-500' },
    { label: 'Customers', value: data?.totalCustomers?.toString() || '0', color: 'bg-amber-500' },
    { label: 'Total Revenue', value: `$${data?.totalRevenue?.toFixed(2) || '0.00'}`, color: 'bg-teal-500' },
    { label: 'Low Stock Items', value: data?.lowStockCount?.toString() || '0', color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link to="/pos" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
          New Sale
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
            <div className={`w-2 h-8 ${card.color} rounded-full mb-2`} />
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Sales & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Sales</h2>
          {data?.recentSales?.length ? (
            <div className="space-y-3">
              {data.recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{sale.invoiceNo}</p>
                    <p className="text-xs text-slate-500">{sale.customer?.name || 'Walk-in Customer'}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-600">${sale.grandTotal.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No sales yet</p>
          )}
          <Link to="/sales" className="block text-center text-sm text-blue-600 mt-4 hover:underline">View All Sales</Link>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Low Stock Alerts</h2>
          {data?.lowStockItems?.length ? (
            <div className="space-y-3">
              {data.lowStockItems.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                  </div>
                  <p className="text-sm font-semibold text-red-600">
                    {product.stocks?.[0]?.quantity || 0} / {product.minStock}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No low stock items</p>
          )}
          <Link to="/inventory" className="block text-center text-sm text-blue-600 mt-4 hover:underline">Manage Inventory</Link>
        </div>
      </div>
    </div>
  );
}
