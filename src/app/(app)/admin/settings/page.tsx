'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Settings, Mail, Database, RefreshCw, Shield } from 'lucide-react'

export default function AdminSettingsPage() {
  const [tab, setTab] = useState('general')
  const [form, setForm] = useState({ appName: 'Nomads POS', smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '' })

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'smtp', label: 'SMTP / Email', icon: Mail },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const handleSave = () => { toast.success('Settings saved') }

  const handleBackup = () => { toast.success('Backup initiated') }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Platform Settings</h1><p className="text-gray-500 text-sm mt-1">Configure your SaaS platform</p></div>
        <button onClick={handleSave} className="btn btn-primary">Save Settings</button>
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
            <div><label className="label">Application Name</label><input type="text" value={form.appName} onChange={e => setForm({ ...form, appName: e.target.value })} className="input" /></div>
          </div>
        </div>
      )}

      {tab === 'smtp' && (
        <div className="card">
          <div className="card-header"><h3 className="section-title">SMTP Configuration</h3></div>
          <div className="card-body space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">SMTP Host</label><input type="text" value={form.smtpHost} onChange={e => setForm({ ...form, smtpHost: e.target.value })} className="input" /></div>
              <div><label className="label">SMTP Port</label><input type="text" value={form.smtpPort} onChange={e => setForm({ ...form, smtpPort: e.target.value })} className="input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">SMTP Username</label><input type="text" value={form.smtpUser} onChange={e => setForm({ ...form, smtpUser: e.target.value })} className="input" /></div>
              <div><label className="label">SMTP Password</label><input type="password" value={form.smtpPass} onChange={e => setForm({ ...form, smtpPass: e.target.value })} className="input" /></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'backup' && (
        <div className="card">
          <div className="card-header"><h3 className="section-title">Backup</h3></div>
          <div className="card-body space-y-4">
            <p className="text-sm text-gray-500">Create a backup of your entire platform data. This includes all tenants, users, products, and sales data.</p>
            <button onClick={handleBackup} className="btn btn-primary">
              <Database className="w-4 h-4" /> Create Backup Now
            </button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card">
          <div className="card-header"><h3 className="section-title">Security</h3></div>
          <div className="card-body space-y-4 max-w-xl">
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-stone-900">Two-Factor Authentication</p><p className="text-sm text-gray-500">Enforce 2FA for all admin accounts</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-stone-900">Session Timeout</p><p className="text-sm text-gray-500">Auto-logout inactive users after 24 hours</p></div>
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
