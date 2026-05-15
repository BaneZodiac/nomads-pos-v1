import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Product } from '../types';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', sellingPrice: 0, costPrice: 0, categoryId: '', barcode: '', unit: 'pc', minStock: 0 });

  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products');
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/products/categories');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (product: any) => {
      const { data } = await api.post('/products', product);
      return data;
    },
    onSuccess: () => { toast.success('Product created'); setShowForm(false); queryClient.invalidateQueries({ queryKey: ['products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...product }: any) => {
      const { data } = await api.put(`/products/${id}`, product);
      return data;
    },
    onSuccess: () => { toast.success('Product updated'); setShowForm(false); setEditId(null); queryClient.invalidateQueries({ queryKey: ['products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/products/${id}`); },
    onSuccess: () => { toast.success('Product deleted'); queryClient.invalidateQueries({ queryKey: ['products'] }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) updateMutation.mutate({ id: editId, ...form });
    else createMutation.mutate(form);
  };

  const handleEdit = (product: Product) => {
    setForm({ name: product.name, sellingPrice: product.sellingPrice, costPrice: product.costPrice, categoryId: product.categoryId || '', barcode: product.barcode || '', unit: product.unit, minStock: product.minStock });
    setEditId(product.id);
    setShowForm(true);
  };

  const products = data?.data || [];
  const categoriesList = categories?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', sellingPrice: 0, costPrice: 0, categoryId: '', barcode: '', unit: 'pc', minStock: 0 }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
          {showForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 border border-slate-200 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Selling Price</label><input type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" step="0.01" /></div>
            <div><label className="block text-sm font-medium mb-1">Cost Price</label><input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" step="0.01" /></div>
            <div><label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">None</option>
                {categoriesList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Barcode</label><input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Min Stock</label><input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {editId ? 'Update' : 'Create'} Product
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Price</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cost</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Category</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product: Product) => {
                const stock = product.stocks?.[0]?.quantity || 0;
                return (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-slate-500">{product.sku}</td>
                    <td className="px-4 py-3">${product.sellingPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500">${product.costPrice.toFixed(2)}</td>
                    <td className={`px-4 py-3 ${stock <= product.minStock ? 'text-red-600 font-medium' : ''}`}>{stock}</td>
                    <td className="px-4 py-3 text-slate-500">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(product)} className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(product.id); }} className="text-red-600 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
