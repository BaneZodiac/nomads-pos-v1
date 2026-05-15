import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function SalesPage() {
  const { data } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data } = await api.get('/sales');
      return data;
    },
  });

  const sales = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-slate-500 mt-1">{sales.length} transactions</p>
        </div>
        <Link to="/pos" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-600/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Sale
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Invoice</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Customer</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Items</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Total</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Method</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900">{sale.invoiceNo}</td>
                  <td className="px-5 py-3.5 text-slate-600">{sale.customer?.name || 'Walk-in'}</td>
                  <td className="px-5 py-3.5 text-right text-slate-600">{sale.items?.length || 0}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600">${sale.grandTotal?.toFixed(2)}</td>
                  <td className="px-5 py-3.5 capitalize text-slate-600">{sale.paymentMethod}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sale.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{new Date(sale.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sales.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="font-medium">No sales yet</p>
            <Link to="/pos" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Make your first sale</Link>
          </div>
        )}
      </div>
    </div>
  );
}