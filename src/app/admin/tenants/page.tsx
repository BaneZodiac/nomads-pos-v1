'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Store, Plus, Edit2, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', email: '', phone: '', planId: '', maxUsers: '5', maxProducts: '1000' })

  useEffect(() => {
    Promise.all([
      fetch('/api/tenants').then(r => r.json()),
      fetch('/api/plans').then(r => r.json()),
    ]).then(([tData, pData]) => {
      if (tData.success) setTenants(tData.data || [])
      if (pData.success) setPlans(pData.data || [])
      setLoading(false)
    })
  }, [])

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '', email: '', phone: '', planId: '', maxUsers: '5', maxProducts: '1000' })
    setShowModal(true)
  }

  const openEdit = (t: any) => {
    setEditing(t)
    setForm({ name: t.name, slug: t.slug, email: t.email || '', phone: t.phone || '', planId: t.planId || '', maxUsers: String(t.maxUsers), maxProducts: String(t.maxProducts) })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, maxUsers: parseInt(form.maxUsers), maxProducts: parseInt(form.maxProducts) }
    const url = editing ? `/api/tenants?id=${editing.id}` : '/api/tenants'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await res.json()
    if (d.success) { toast.success(editing ? 'Updated' : 'Created'); setShowModal(false); window.location.reload() }
    else toast.error(d.error || 'Failed')
    setLoading(false)
  }

  const toggleActive = async (tenant: any) => {
    const res = await fetch(`/api/tenants?id=${tenant.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !tenant.isActive }),
    })
    const d = await res.json()
    if (d.success) { toast.success(`Tenant ${tenant.isActive ? 'deactivated' : 'activated'}`); window.location.reload() }
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="text-gray-500 text-sm mt-1">{tenants.length} businesses</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Tenant</button>
      </div>
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search tenants..." /></div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Store className="w-12 h-12" />} title="No tenants" description="Create your first tenant business" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tenant => (
            <div key={tenant.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">{tenant.name}</h3>
                    <p className="text-xs text-gray-400">{tenant.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(tenant)} className="btn btn-ghost btn-sm p-1"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => toggleActive(tenant)} className="btn btn-ghost btn-sm p-1">
                    {tenant.isActive ? <XCircle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span>{tenant.plan?.name || 'No plan'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Users</span><span>{tenant.maxUsers}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={tenant.isActive ? 'text-green-600' : 'text-red-600'}>{tenant.isActive ? 'Active' : 'Inactive'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{formatDate(tenant.createdAt)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Tenant' : 'New Tenant'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Business Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Slug</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="label">Plan</label>
              <select value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} className="select">
                <option value="">No plan</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Max Users</label>
              <input type="number" value={form.maxUsers} onChange={e => setForm({ ...form, maxUsers: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Max Products</label>
              <input type="number" value={form.maxProducts} onChange={e => setForm({ ...form, maxProducts: e.target.value })} className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
