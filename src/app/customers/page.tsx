'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, Plus, Phone, Mail, Star, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', taxId: '', notes: '' })

  useEffect(() => {
    fetch('/api/customers?limit=1000')
      .then(r => r.json())
      .then(d => { if (d.success) setCustomers(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Customer name is required'); return }
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.success) {
      toast.success('Customer created')
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', address: '', taxId: '', notes: '' })
      const r = await fetch('/api/customers?limit=1000')
      const d = await r.json()
      if (d.success) setCustomers(d.data || [])
    } else {
      toast.error(data.error || 'Failed')
    }
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{customers.length} customers total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers by name, phone, or email..." />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No customers found"
          description={search ? 'Try a different search' : 'Start building your customer base'}
          action={!search && <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus className="w-4 h-4" /> Add Customer</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map(customer => (
            <div key={customer.id} className="card p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-primary-600">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 truncate">{customer.name}</h3>
                  <div className="mt-2 space-y-1">
                    {customer.email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {customer.email}
                      </p>
                    )}
                    {customer.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {customer.phone}
                      </p>
                    )}
                    {customer.address && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {customer.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">{customer.loyaltyPts} pts</span>
                </div>
                <span className="text-sm font-semibold text-stone-900">{formatCurrency(customer.totalSpent)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Customer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Customer Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tax ID</label>
              <input type="text" value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Credit Limit</label>
              <input type="number" className="input" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Customer</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
