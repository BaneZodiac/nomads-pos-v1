import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });

  const { data } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (customer: any) => { const { data } = await api.post('/customers', customer); return data; },
    onSuccess: () => { toast.success('Customer created'); setShowForm(false); setForm({ name: '', email: '', phone: '', address: '', notes: '' }); queryClient.invalidateQueries({ queryKey: ['customers'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/customers/${id}`); },
    onSuccess: () => { toast.success('Customer deleted'); queryClient.invalidateQueries({ queryKey: ['customers'] }); },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(form); };
  const customers = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          {showForm ? 'Cancel' : 'Add Customer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Create Customer</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left px-4 py-3 font-medium text-slate-600">Name</th><th className="text-left px-4 py-3 font-medium text-slate-600">Email</th><th className="text-left px-4 py-3 font-medium text-slate-600">Phone</th><th className="text-left px-4 py-3 font-medium text-slate-600">Total Spent</th><th className="text-left px-4 py-3 font-medium text-slate-600">Points</th><th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.email || '-'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.phone || '-'}</td>
                  <td className="px-4 py-3">${c.totalSpent.toFixed(2)}</td>
                  <td className="px-4 py-3">{c.loyaltyPoints}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(c.id); }} className="text-red-600 hover:underline text-xs">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
