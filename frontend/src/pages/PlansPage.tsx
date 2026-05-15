import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: 0, maxUsers: 5, maxLocations: 1, maxProducts: 500, maxCustomers: 200, maxInvoices: 500 });

  const { data } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => { const { data } = await api.get('/subscriptions'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (plan: any) => { const { data } = await api.post('/subscriptions', plan); return data; },
    onSuccess: () => { toast.success('Plan created'); setShowForm(false); queryClient.invalidateQueries({ queryKey: ['subscription-plans'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/subscriptions/${id}`); },
    onSuccess: () => { toast.success('Plan deleted'); queryClient.invalidateQueries({ queryKey: ['subscription-plans'] }); },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(form); };

  const plans = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">{showForm ? 'Cancel' : 'Add Plan'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Price *</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" step="0.01" required /></div>
            <div><label className="block text-sm font-medium mb-1">Max Users</label><input type="number" value={form.maxUsers} onChange={e => setForm({ ...form, maxUsers: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Max Products</label><input type="number" value={form.maxProducts} onChange={e => setForm({ ...form, maxProducts: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Max Locations</label><input type="number" value={form.maxLocations} onChange={e => setForm({ ...form, maxLocations: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Max Customers</label><input type="number" value={form.maxCustomers} onChange={e => setForm({ ...form, maxCustomers: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-lg">Create Plan</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan: any) => (
          <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              <button onClick={() => { if (confirm('Delete plan?')) deleteMutation.mutate(plan.id); }} className="text-red-500 text-xs hover:underline">Delete</button>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-4">${plan.price}<span className="text-sm font-normal text-slate-400">/mo</span></p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Users</span><span>{plan.maxUsers}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Products</span><span>{plan.maxProducts}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Locations</span><span>{plan.maxLocations}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Customers</span><span>{plan.maxCustomers}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
