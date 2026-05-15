import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const { data } = await api.get('/products/categories'); return data; },
  });

  const createMutation = useMutation({
    mutationFn: async (cat: any) => { const { data } = await api.post('/products/categories', cat); return data; },
    onSuccess: () => { toast.success('Category created'); setName(''); queryClient.invalidateQueries({ queryKey: ['categories'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/products/categories/${id}`); },
    onSuccess: () => { toast.success('Category deleted'); queryClient.invalidateQueries({ queryKey: ['categories'] }); },
  });

  const categories = data?.data || [];

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) return; createMutation.mutate({ name }); };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Product Categories</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name" className="px-3 py-2 border rounded-lg flex-1 max-w-xs" required />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add Category</button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr><th className="text-left px-4 py-3 font-medium">Name</th><th className="text-left px-4 py-3 font-medium">Products</th><th className="text-right px-4 py-3 font-medium">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c: any) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c._count?.products || 0} products</td>
                <td className="px-4 py-3 text-right"><button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(c.id); }} className="text-red-600 hover:underline text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
