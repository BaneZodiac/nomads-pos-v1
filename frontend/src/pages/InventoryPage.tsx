import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [adjustForm, setAdjustForm] = useState({ productId: '', type: 'in', quantity: 0, note: '' });

  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => { const { data } = await api.get('/products/all'); return data.data; },
  });

  const { data: movements } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => { const { data } = await api.get('/products/stock-movements'); return data.data; },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => { const { data } = await api.get('/products/low-stock'); return data.data; },
  });

  const adjustMutation = useMutation({
    mutationFn: async (payload: any) => { const { data } = await api.post('/products/stock-adjust', payload); return data; },
    onSuccess: () => { toast.success('Stock adjusted'); setAdjustForm({ productId: '', type: 'in', quantity: 0, note: '' }); queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['stock-movements'] }); queryClient.invalidateQueries({ queryKey: ['low-stock'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!adjustForm.productId || !adjustForm.quantity) return toast.error('Select product and enter quantity'); adjustMutation.mutate(adjustForm); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>

      {/* Low Stock Alert */}
      {lowStock?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 mb-2">⚠ Low Stock Alerts ({lowStock.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {lowStock.slice(0, 8).map((p: any) => (
              <div key={p.id} className="bg-white rounded-lg p-2 text-sm">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-red-600">{p.stocks?.[0]?.quantity || 0} / {p.minStock}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Adjustment */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="font-semibold text-slate-900 mb-4">Stock Adjustment</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Product</label>
            <select value={adjustForm.productId} onChange={e => setAdjustForm({ ...adjustForm, productId: e.target.value })} className="px-3 py-2 border rounded-lg min-w-[200px]" required>
              <option value="">Select product</option>
              {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stocks?.[0]?.quantity || 0})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <select value={adjustForm.type} onChange={e => setAdjustForm({ ...adjustForm, type: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Quantity</label>
            <input type="number" value={adjustForm.quantity || ''} onChange={e => setAdjustForm({ ...adjustForm, quantity: parseInt(e.target.value) || 0 })} className="px-3 py-2 border rounded-lg w-24" required min="1" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Note</label>
            <input value={adjustForm.note} onChange={e => setAdjustForm({ ...adjustForm, note: e.target.value })} className="px-3 py-2 border rounded-lg w-40" />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Apply</button>
        </form>
      </div>

      {/* Stock Movements */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Recent Stock Movements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left px-4 py-3">Product</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Qty</th><th className="text-left px-4 py-3">Note</th><th className="text-left px-4 py-3">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(movements || []).map((m: any) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{m.product?.name || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${m.type === 'in' ? 'bg-green-100 text-green-700' : m.type === 'out' || m.type === 'sale' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{m.type}</span></td>
                  <td className="px-4 py-3">{m.quantity}</td>
                  <td className="px-4 py-3 text-slate-500">{m.note || '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
