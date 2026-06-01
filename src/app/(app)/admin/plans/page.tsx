'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Shield, Plus, Edit2 } from 'lucide-react'

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '0', billingCycle: 'monthly', trialDays: '14', maxUsers: '5', maxLocations: '1', maxProducts: '1000', hasReports: 'true', hasApi: 'false', hasMultiStore: 'false', hasLoyalty: 'false', hasAiInsights: 'false' })

  useEffect(() => {
    fetch('/api/plans').then(r => r.json()).then(d => { if (d.success) setPlans(d.data || []); setLoading(false) })
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', price: '0', billingCycle: 'monthly', trialDays: '14', maxUsers: '5', maxLocations: '1', maxProducts: '1000', hasReports: 'true', hasApi: 'false', hasMultiStore: 'false', hasLoyalty: 'false', hasAiInsights: 'false' })
    setShowModal(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description || '', price: String(p.price), billingCycle: p.billingCycle, trialDays: String(p.trialDays), maxUsers: String(p.maxUsers), maxLocations: String(p.maxLocations), maxProducts: String(p.maxProducts), hasReports: String(p.hasReports), hasApi: String(p.hasApi), hasMultiStore: String(p.hasMultiStore), hasLoyalty: String(p.hasLoyalty), hasAiInsights: String(p.hasAiInsights) })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, price: parseFloat(form.price), trialDays: parseInt(form.trialDays), maxUsers: parseInt(form.maxUsers), maxLocations: parseInt(form.maxLocations), maxProducts: parseInt(form.maxProducts), hasReports: form.hasReports === 'true', hasApi: form.hasApi === 'true', hasMultiStore: form.hasMultiStore === 'true', hasLoyalty: form.hasLoyalty === 'true', hasAiInsights: form.hasAiInsights === 'true' }
    const url = editing ? `/api/plans?id=${editing.id}` : '/api/plans'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await res.json()
    if (d.success) { toast.success(editing ? 'Updated' : 'Created'); setShowModal(false); window.location.reload() }
    else toast.error(d.error || 'Failed')
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Subscription Plans</h1><p className="text-gray-500 text-sm mt-1">{plans.length} plans configured</p></div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Plan</button>
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={<Shield className="w-12 h-12" />} title="No plans" description="Create subscription plans for tenants" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>
                <button onClick={() => openEdit(plan)} className="text-gray-300 hover:text-primary-500"><Edit2 className="w-4 h-4" /></button>
              </div>
              <p className="text-3xl font-bold text-primary-600 mb-1">{formatCurrency(plan.price)}<span className="text-sm font-normal text-gray-400">/{plan.billingCycle}</span></p>
              <p className="text-xs text-gray-400 mb-4">{plan.trialDays} days trial</p>
              <div className="space-y-2 text-sm">
                <FeatureRow label="Users" value={plan.maxUsers} />
                <FeatureRow label="Locations" value={plan.maxLocations} />
                <FeatureRow label="Products" value={plan.maxProducts} />
                <FeatureRow label="Reports" checked={plan.hasReports} />
                <FeatureRow label="API Access" checked={plan.hasApi} />
                <FeatureRow label="Multi-Store" checked={plan.hasMultiStore} />
                <FeatureRow label="Loyalty" checked={plan.hasLoyalty} />
                <FeatureRow label="AI Insights" checked={plan.hasAiInsights} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Plan' : 'New Plan'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Plan Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required /></div>
            <div className="col-span-2"><label className="label">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" /></div>
            <div><label className="label">Price</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" /></div>
            <div><label className="label">Billing Cycle</label><select value={form.billingCycle} onChange={e => setForm({ ...form, billingCycle: e.target.value })} className="select"><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="quarterly">Quarterly</option></select></div>
            <div><label className="label">Trial Days</label><input type="number" value={form.trialDays} onChange={e => setForm({ ...form, trialDays: e.target.value })} className="input" /></div>
            <div><label className="label">Max Users</label><input type="number" value={form.maxUsers} onChange={e => setForm({ ...form, maxUsers: e.target.value })} className="input" /></div>
            <div><label className="label">Max Locations</label><input type="number" value={form.maxLocations} onChange={e => setForm({ ...form, maxLocations: e.target.value })} className="input" /></div>
            <div><label className="label">Max Products</label><input type="number" value={form.maxProducts} onChange={e => setForm({ ...form, maxProducts: e.target.value })} className="input" /></div>
            <div className="col-span-2 space-y-2">
              {['hasReports','hasApi','hasMultiStore','hasLoyalty','hasAiInsights'].map(key => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form[key as keyof typeof form] === 'true'} onChange={e => setForm({ ...form, [key]: String(e.target.checked) })} className="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                  {key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  )
}

function FeatureRow({ label, value, checked }: { label: string; value?: number; checked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      {checked !== undefined ? (
        <span className={checked ? 'text-green-600 font-medium' : 'text-gray-300'}>{checked ? '✓' : '✗'}</span>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  )
}
