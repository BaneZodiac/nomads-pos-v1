import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function ReportsPage() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports-sales'],
    queryFn: async () => {
      const { data } = await api.get('/reports/sales');
      return data.data;
    },
  });

  const { data: profitData } = useQuery({
    queryKey: ['reports-profit'],
    queryFn: async () => {
      const { data } = await api.get('/reports/profit');
      return data.data;
    },
  });

  const { data: bestSellers } = useQuery({
    queryKey: ['reports-best-sellers'],
    queryFn: async () => {
      const { data } = await api.get('/reports/best-sellers?period=30d');
      return data.data;
    },
  });

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-xl font-bold">${reportData?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-slate-500">Total Sales</p>
          <p className="text-xl font-bold">{reportData?.totalSales || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-slate-500">Total Profit</p>
          <p className="text-xl font-bold text-green-600">${profitData?.totalProfit?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-slate-500">Profit Margin</p>
          <p className="text-xl font-bold text-blue-600">{profitData?.profitMargin?.toFixed(1) || '0'}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Best Sellers (30 days)</h2>
          {(bestSellers || []).slice(0, 10).map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 w-5">{idx + 1}</span>
                <p className="text-sm">{item.product?.name || 'Unknown'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{item.totalSold} sold</p>
                <p className="text-xs text-slate-400">${item.totalRevenue?.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Payment Methods</h2>
          {reportData?.paymentMethods && Object.entries(reportData.paymentMethods).map(([method, total]: [string, any]) => (
            <div key={method} className="flex items-center justify-between py-2 border-b border-slate-100">
              <p className="text-sm capitalize">{method}</p>
              <p className="text-sm font-semibold">${total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cost/Revenue/Profit */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Profit Analysis</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-slate-500">Revenue</p>
            <p className="text-xl font-bold text-blue-700">${profitData?.totalRevenue?.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-slate-500">Cost</p>
            <p className="text-xl font-bold text-red-700">${profitData?.totalCost?.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-slate-500">Profit</p>
            <p className="text-xl font-bold text-green-700">${profitData?.totalProfit?.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
