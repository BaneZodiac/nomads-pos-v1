import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Product } from '../types';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', sellingPrice: 0, costPrice: 0, categoryId: '', barcode: '', unit: 'pc', minStock: 0 });

  const { data, isLoading } = useQuery({
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
    onSuccess: () => { toast.success('Product created successfully!'); setShowForm(false); queryClient.invalidateQueries({ queryKey: ['products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error creating product'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...product }: any) => {
      const { data } = await api.put(`/products/${id}`, product);
      return data;
    },
    onSuccess: () => { toast.success('Product updated!'); setShowForm(false); setEditId(null); queryClient.invalidateQueries({ queryKey: ['products'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error updating'),
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

  const resetForm = () => {
    setForm({ name: '', sellingPrice: 0, costPrice: 0, categoryId: '', barcode: '', unit: 'pc', minStock: 0 });
    setEditId(null);
    setShowForm(false);
  };

  const products = data?.data || [];
  const categoriesList = categories?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">{products.length} products in inventory</p>
        </div>
        <button
          onClick={() => { resetForm(); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-600/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-slate-900">{editId ? 'Edit Product' : 'Add New Product'}</h3>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Product Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Selling Price</label>
              <input type="number" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: parseFloat(e.target.value) })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cost Price</label>
              <input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: parseFloat(e.target.value) })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                <option value="">Select category</option>
                {categoriesList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Barcode</label>
              <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Min Stock Alert</label>
              <input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700">
              {editId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Product</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">SKU</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Price</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Cost</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Stock</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-600">Category</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product: Product) => {
                const stock = product.stocks?.[0]?.quantity || 0;
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{product.name}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{product.sku}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">${product.sellingPrice.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500">${product.costPrice.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${stock <= product.minStock ? 'bg-red-100 text-red-700' : stock <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{product.category?.name || '-'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(product.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="font-medium">No products yet</p>
            <p className="text-sm mt-1">Add your first product to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}