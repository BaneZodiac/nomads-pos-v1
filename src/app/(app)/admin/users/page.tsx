'use client'

import { useEffect, useState } from 'react'
import { PageLoading } from '@/components/ui/Loading'
import { LoadingSpinner } from '@/components/ui/Loading'
import { SearchInput } from '@/components/ui/SearchInput'
import { Modal } from '@/components/ui/Modal'
import { formatDate, getRoleBadgeClass } from '@/lib/utils'
import toast from 'react-hot-toast'
import { UserCircle, Plus, Shield, Loader2 } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: 'password123', role: 'CASHIER' })

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => { if (d.success) setUsers(d.data || []); setLoading(false) })
  }, [])

  const filtered = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { toast.success('User created'); setShowModal(false); window.location.reload() }
    else toast.error(d.error || 'Failed')
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Users</h1><p className="text-gray-500 text-sm mt-1">{users.length} users</p></div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary"><Plus className="w-4 h-4" /> Add User</button>
      </div>
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search users..." /></div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th></tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td className="font-medium text-stone-900">{u.name}</td>
                <td className="text-gray-500">{u.email}</td>
                <td><span className={`badge ${getRoleBadgeClass(u.role)}`}>{u.role.replace('_', ' ')}</span></td>
                <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="text-xs text-gray-400">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create User">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required /></div>
          <div><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" required /></div>
          <div><label className="label">Password</label><input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" /></div>
          <div><label className="label">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="select">
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="CASHIER">Cashier</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="SUPPORT">Support</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Create User</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
