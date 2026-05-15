import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => { const { data } = await api.get('/tenants'); return data; },
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => { const { data } = await api.get('/subscriptions'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (tenant: any) => { const { data } = await api.post('/tenants', tenant); return data; },
    onSuccess: () => { toast.success('Tenant created'); setShowForm(false); setForm({ name: '', email: '', phone: '', address: '' }); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...tenant }: any) => { const { data } = await api.put(`/tenants/${id}`, tenant); return data; },
    onSuccess: () => { toast.success('Tenant updated'); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/tenants/${id}`); },
    onSuccess: () => { toast.success('Tenant deleted'); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
  });

  const assignPlanMutation = useMutation({
    mutationFn: async (payload: any) => { const { data } = await api.post('/subscriptions/assign', payload); return data; },
    onSuccess: () => { toast.success('Plan assigned'); setSelectedTenant(null); queryClient.invalidateQueries({ queryKey: ['tenants'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(form); };

  const tenants = data?.data || [];
  const plansList = plans?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tenant Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
          {showForm ? 'Cancel' : 'Create Tenant'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Business Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-lg">Create Tenant</button>
        </form>
      )}

      <div className="space-y-4">
        {tenants.map((tenant: any) => (
          <div key={tenant.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{tenant.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${tenant.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{tenant.email} {tenant.phone && `| ${tenant.phone}`}</p>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>Users: {tenant._count?.users || 0}</span>
                  <span>Products: {tenant._count?.products || 0}</span>
                  <span>Sales: {tenant._count?.sales || 0}</span>
                </div>
                {tenant.subscription && (
                  <div className="mt-2 text-xs">
                    <span className="text-slate-500">Plan: </span>
                    <span className="font-medium">{tenant.subscription.plan?.name}</span>
                    <span className="text-slate-500 ml-2">Status: </span>
                    <span className={`font-medium ${tenant.subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {tenant.subscription.status}
                    </span>
                    <span className="text-slate-500 ml-2">Ends: </span>
                    <span className="font-medium">{new Date(tenant.subscription.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedTenant(tenant)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">Assign Plan</button>
                <button onClick={() => updateMutation.mutate({ id: tenant.id, isActive: !tenant.isActive })} className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50">
                  {tenant.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => { if (confirm('Delete tenant?')) deleteMutation.mutate(tenant.id); }} className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Plan Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTenant(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Assign Plan to {selectedTenant.name}</h3>
            <div className="space-y-3">
              {plansList.map((plan: any) => (
                <button
                  key={plan.id}
                  onClick={() => assignPlanMutation.mutate({ tenantId: selectedTenant.id, planId: plan.id })}
                  className="w-full text-left p-4 border rounded-xl hover:border-blue-400 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-xs text-slate-500">
                        Users: {plan.maxUsers} | Products: {plan.maxProducts} | Locations: {plan.maxLocations}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">${plan.price}/mo</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedTenant(null)} className="w-full mt-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
