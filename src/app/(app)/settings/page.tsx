'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { PageLoading } from '@/components/ui/Loading'
import { Settings, Receipt, DollarSign, Globe, Shield, Bell } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState('general')
  const [form, setForm] = useState({
    storeName: 'My Store',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    currency: 'INR',
    taxRate: '0',
    receiptFooter: 'Thank you for your business!',
  })

  if (status === 'loading') return <PageLoading />
  if (!session) return null

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'receipt', label: 'Receipt', icon: Receipt },
    { id: 'tax', label: 'Tax & Currency', icon: DollarSign },
    { id: 'users', label: 'Users & Roles', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  const handleSave = () => {
    toast.success('Settings saved successfully')
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your store preferences</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn btn-sm shrink-0 ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="card">
          <div className="card-header"><h3 className="section-title">General Settings</h3></div>
          <div className="card-body space-y-4 max-w-xl">
            <div>
              <label className="label">Store Name</label>
              <input type="text" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Store Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input" rows={2} />
            </div>
          </div>
        </div>
      )}

      {tab === 'receipt' && (
        <div className="card">
          <div className="card-header"><h3 className="section-title">Receipt Template</h3></div>
          <div className="card-body space-y-4 max-w-xl">
            <div>
              <label className="label">Receipt Footer Message</label>
              <textarea value={form.receiptFooter} onChange={e => setForm({ ...form, receiptFooter: e.target.value })} className="input" rows={3} />
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Preview:</p>
              <div className="bg-white p-4 rounded border border-gray-200 max-w-xs mx-auto text-center text-xs">
                <p className="font-bold text-sm">{form.storeName}</p>
                <hr className="my-2" />
                <p className="text-gray-500 mt-2">{form.receiptFooter}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tax' && (
        <div className="card">
          <div className="card-header"><h3 className="section-title">Tax & Currency</h3></div>
          <div className="card-body space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Default Currency</label>
                <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="select">
                  <option value="INR">INR (₹)</option>
                  <option value="SAR">SAR (﷼)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="GHS">GHS (GH₵)</option>
                  <option value="ZAR">ZAR (R)</option>
                  <option value="XOF">XOF (CFA)</option>
                </select>
              </div>
              <div>
                <label className="label">Default Tax Rate (%)</label>
                <input type="number" step="0.1" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} className="input" />
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card">
          <div className="card-header"><h3 className="section-title">Users & Roles</h3></div>
          <div className="card-body">
            <p className="text-sm text-gray-500 mb-4">Manage staff access and permissions</p>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">{session?.user?.name}</td>
                    <td>{session?.user?.email}</td>
                    <td><span className="badge badge-primary">{session?.user?.role?.replace('_', ' ')}</span></td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card">
          <div className="card-header"><h3 className="section-title">Notifications</h3></div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">Low Stock Alerts</p>
                <p className="text-sm text-gray-500">Get notified when products are running low</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">Daily Sales Report</p>
                <p className="text-sm text-gray-500">Receive end-of-day sales summary</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
