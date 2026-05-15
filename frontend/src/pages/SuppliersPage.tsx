import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function SuppliersPage() {
  const { data } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => { const { data } = await api.get('/suppliers'); return data; },
  });

  const suppliers = data?.data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Suppliers</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left px-4 py-3 font-medium">Name</th><th className="text-left px-4 py-3 font-medium">Email</th><th className="text-left px-4 py-3 font-medium">Phone</th><th className="text-left px-4 py-3 font-medium">Balance</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-slate-500">{s.email || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.phone || '-'}</td>
                  <td className="px-4 py-3">${s.balance?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
