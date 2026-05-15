import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const { data } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (customer: any) => { const { data } = await api.post('/customers', customer); return data; },
    onSuccess: () => { toast.success('Customer added!'); setShowForm(false); setForm({ name: '', email: '', phone: '', address: '' }); queryClient.invalidateQueries({ queryKey: ['customers'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/customers/${id}`); },
    onSuccess: () => { toast.success('Customer deleted'); queryClient.invalidateQueries({ queryKey: ['customers'] }); },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(form); };
  const customers = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">{customers.length} customers registered</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-600/20">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Customer
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">New Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg">Create Customer</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Customer</th>
              <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Contact</th>
              <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Total Spent</th>
              <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Points</th>
              <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50 transition">
                <td className="px-5 py-3.5 font-medium text-slate-900">{c.name}</td>
                <td className="px-5 py-3.5 text-slate-500">
                  <div>{c.email || '-'}</div>
                  <div className="text-xs">{c.phone || '-'}</div>
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">${c.totalSpent.toFixed(2)}</td>
                <td className="px-5 py-3.5 text-right"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{c.loyaltyPoints}</span></td>
                <td className="px-5 py-3.5 text-right">
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(c.id); }} className="text-red-600 hover:text-red-700 text-sm font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}