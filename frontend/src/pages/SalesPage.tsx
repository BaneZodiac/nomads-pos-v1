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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
        <Link to="/pos" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">New Sale</Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left px-4 py-3 font-medium text-slate-600">Invoice</th><th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th><th className="text-left px-4 py-3 font-medium text-slate-600">Items</th><th className="text-left px-4 py-3 font-medium text-slate-600">Total</th><th className="text-left px-4 py-3 font-medium text-slate-600">Method</th><th className="text-left px-4 py-3 font-medium text-slate-600">Status</th><th className="text-left px-4 py-3 font-medium text-slate-600">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{sale.invoiceNo}</td>
                  <td className="px-4 py-3 text-slate-500">{sale.customer?.name || 'Walk-in'}</td>
                  <td className="px-4 py-3">{sale.items?.length || 0}</td>
                  <td className="px-4 py-3 font-semibold">${sale.grandTotal?.toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize">{sale.paymentMethod}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${sale.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{sale.status}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(sale.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
