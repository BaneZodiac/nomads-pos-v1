import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data } = useQuery({
    queryKey: ['settings', 'locations'],
    queryFn: async () => { const { data } = await api.get('/settings/locations'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (loc: any) => { const { data } = await api.post('/settings/locations', loc); return data; },
    onSuccess: () => { toast.success('Location created'); setName(''); queryClient.invalidateQueries({ queryKey: ['settings', 'locations'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/settings/locations/${id}`); },
    onSuccess: () => { toast.success('Location deleted'); queryClient.invalidateQueries({ queryKey: ['settings', 'locations'] }); },
  });

  const locations = data?.data || [];

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) return; createMutation.mutate({ name }); };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Locations / Branches</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Location name" className="px-3 py-2 border rounded-lg flex-1 max-w-xs" required />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add Location</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {locations.map((loc: any) => (
          <div key={loc.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{loc.name}</p>
                <p className="text-xs text-slate-500">{loc.address || 'No address'}</p>
              </div>
              <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(loc.id); }} className="text-red-600 text-xs hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
