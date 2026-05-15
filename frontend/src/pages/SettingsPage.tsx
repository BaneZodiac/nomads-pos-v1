import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  const mutation = useMutation({
    mutationFn: async (settings: any) => { const { data } = await api.put('/settings', settings); return data; },
    onSuccess: () => { toast.success('Settings saved'); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const settings = data || {};

  const handleSave = () => {
    mutation.mutate(settings);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Save</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Receipt Header</label><input defaultValue={settings.receiptHeader || ''} onChange={e => settings.receiptHeader = e.target.value} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Receipt Footer</label><input defaultValue={settings.receiptFooter || ''} onChange={e => settings.receiptFooter = e.target.value} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Tax Rate (%)</label><input type="number" defaultValue={settings.taxRate || 0} onChange={e => settings.taxRate = parseFloat(e.target.value)} className="w-full px-3 py-2 border rounded-lg" step="0.01" /></div>
          <div><label className="block text-sm font-medium mb-1">Tax Name</label><input defaultValue={settings.taxName || 'Tax'} onChange={e => settings.taxName = e.target.value} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Invoice Prefix</label><input defaultValue={settings.invoicePrefix || 'INV-'} onChange={e => settings.invoicePrefix = e.target.value} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Receipt Prefix</label><input defaultValue={settings.receiptPrefix || 'RCPT-'} onChange={e => settings.receiptPrefix = e.target.value} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Low Stock Alert</label><input type="number" defaultValue={settings.lowStockAlert || 10} onChange={e => settings.lowStockAlert = parseInt(e.target.value)} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Barcode Format</label>
            <select defaultValue={settings.barcodeFormat || 'CODE128'} onChange={e => settings.barcodeFormat = e.target.value} className="w-full px-3 py-2 border rounded-lg">
              <option value="CODE128">CODE128</option>
              <option value="EAN13">EAN-13</option>
              <option value="UPC">UPC</option>
              <option value="QR">QR Code</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Primary Color</label>
            <input type="color" defaultValue={settings.primaryColor || '#3B82F6'} onChange={e => settings.primaryColor = e.target.value} className="w-12 h-10 p-1 border rounded cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}
