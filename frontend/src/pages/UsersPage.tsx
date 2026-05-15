import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', roleId: '', locationId: '' });

  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await api.get('/users'); return data; },
  });

  const { data: roles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => { const { data } = await api.get('/users/roles'); return data; },
  });

  const { data: locations } = useQuery({
    queryKey: ['settings', 'locations'],
    queryFn: async () => { const { data } = await api.get('/settings/locations'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (user: any) => { const { data } = await api.post('/users', user); return data; },
    onSuccess: () => { toast.success('User created'); setShowForm(false); setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', roleId: '', locationId: '' }); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/users/${id}`); },
    onSuccess: () => { toast.success('User deleted'); queryClient.invalidateQueries({ queryKey: ['users'] }); },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(form); };
  const users = data?.data || [];
  const rolesList = roles?.data || [];
  const locationsList = locations?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Staff / Users</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">{showForm ? 'Cancel' : 'Add User'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">First Name *</label><input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Last Name *</label><input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Password *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Role</label>
              <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select role</option>
                {rolesList.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Location</label>
              <select value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select location</option>
                {locationsList.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg">Create User</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr><th className="text-left px-4 py-3 font-medium">Name</th><th className="text-left px-4 py-3 font-medium">Email</th><th className="text-left px-4 py-3 font-medium">Role</th><th className="text-left px-4 py-3 font-medium">Location</th><th className="text-left px-4 py-3 font-medium">Status</th><th className="text-right px-4 py-3 font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">{u.role?.name || '-'}</td>
                <td className="px-4 py-3 text-slate-500">{u.location?.name || '-'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={() => { if (confirm('Delete user?')) deleteMutation.mutate(u.id); }} className="text-red-600 hover:underline text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
