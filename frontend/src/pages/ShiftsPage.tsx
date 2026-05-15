import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const [openingCash, setOpeningCash] = useState('0');

  const { data } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => { const { data } = await api.get('/settings/shifts'); return data; },
  });

  const openShift = useMutation({
    mutationFn: async () => { const { data } = await api.post('/settings/shifts/open', { openingCash: parseFloat(openingCash) || 0 }); return data; },
    onSuccess: () => { toast.success('Shift opened'); setOpeningCash('0'); queryClient.invalidateQueries({ queryKey: ['shifts'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const closeShift = useMutation({
    mutationFn: async (id: string) => { const { data } = await api.post(`/settings/shifts/${id}/close`, { closingCash: 0 }); return data; },
    onSuccess: () => { toast.success('Shift closed'); queryClient.invalidateQueries({ queryKey: ['shifts'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const shifts = data?.data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Shifts</h1>

      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <h2 className="font-semibold mb-4">Open New Shift</h2>
        <div className="flex gap-2 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Opening Cash</label>
            <input type="number" value={openingCash} onChange={e => setOpeningCash(e.target.value)} className="px-3 py-2 border rounded-lg w-32" />
          </div>
          <button onClick={() => openShift.mutate()} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Open Shift</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr><th className="text-left px-4 py-3 font-medium">User</th><th className="text-left px-4 py-3 font-medium">Opening</th><th className="text-left px-4 py-3 font-medium">Sales</th><th className="text-left px-4 py-3 font-medium">Status</th><th className="text-left px-4 py-3 font-medium">Open Time</th><th className="text-right px-4 py-3 font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shifts.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{s.user?.firstName} {s.user?.lastName}</td>
                <td className="px-4 py-3">${s.openingCash?.toFixed(2)}</td>
                <td className="px-4 py-3">${s.totalSales?.toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(s.openingTime).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {s.status === 'open' && <button onClick={() => { if (confirm('Close shift?')) closeShift.mutate(s.id); }} className="text-amber-600 hover:underline text-xs">Close</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
