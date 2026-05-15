import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplierId: '', items: [{ productId: '', quantity: 1, unitCost: 0 }], notes: '' });

  const { data } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => { const { data } = await api.get('/suppliers/purchase-orders'); return data; },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: async () => { const { data } = await api.get('/suppliers/all'); return data; },
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => { const { data } = await api.get('/products/all'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (po: any) => { const { data } = await api.post('/suppliers/purchase-orders', po); return data; },
    onSuccess: () => { toast.success('Purchase order created'); setShowForm(false); queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(form); };

  const pos = data?.data || [];
  const suppliersList = suppliers?.data || [];
  const productsList = products?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">{showForm ? 'Cancel' : 'New Order'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 mb-6 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Supplier</label>
            <select value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Select supplier</option>
              {suppliersList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Product</label>
                <select value={item.productId} onChange={e => { const items = [...form.items]; items[idx].productId = e.target.value; setForm({ ...form, items }); }} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select product</option>
                  {productsList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium mb-1">Qty</label>
                <input type="number" value={item.quantity} onChange={e => { const items = [...form.items]; items[idx].quantity = parseInt(e.target.value) || 1; setForm({ ...form, items }); }} className="w-full px-3 py-2 border rounded-lg" min="1" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium mb-1">Unit Cost</label>
                <input type="number" value={item.unitCost} onChange={e => { const items = [...form.items]; items[idx].unitCost = parseFloat(e.target.value) || 0; setForm({ ...form, items }); }} className="w-full px-3 py-2 border rounded-lg" step="0.01" />
              </div>
              {form.items.length > 1 && (
                <button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })} className="text-red-500 text-sm mb-1">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { productId: '', quantity: 1, unitCost: 0 }] })} className="text-blue-600 text-sm">+ Add Item</button>
          <div><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Create Order</button></div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr><th className="text-left px-4 py-3 font-medium">Order #</th><th className="text-left px-4 py-3 font-medium">Supplier</th><th className="text-left px-4 py-3 font-medium">Items</th><th className="text-left px-4 py-3 font-medium">Total</th><th className="text-left px-4 py-3 font-medium">Status</th><th className="text-left px-4 py-3 font-medium">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pos.map((po: any) => (
              <tr key={po.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{po.orderNo}</td>
                <td className="px-4 py-3">{po.supplier?.name || '-'}</td>
                <td className="px-4 py-3">{po.items?.length || 0}</td>
                <td className="px-4 py-3">${po.totalAmount?.toFixed(2)}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">{po.status}</span></td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(po.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
