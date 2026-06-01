'use client'

import { useState, useEffect } from 'react'
import { LoadingSpinner } from '@/components/ui/Loading'
import { SearchInput } from '@/components/ui/SearchInput'
import { Pagination } from '@/components/ui/Pagination'
import { formatDateTime, getRoleBadgeClass } from '@/lib/utils'
import { ClipboardList } from 'lucide-react'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })

  useEffect(() => {
    fetch(`/api/settings?type=audit&page=${page}&limit=50`)
      .then(r => r.json())
      .then(d => { if (d.success) { setLogs(d.data || []); if (d.pagination) setPagination(d.pagination) }; setLoading(false) })
      .catch(() => setLoading(false))
  }, [page])

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Audit Logs</h1><p className="text-gray-500 text-sm mt-1">{pagination.total} events recorded</p></div>
      </div>
      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search logs..." /></div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.filter(l => l.action?.toLowerCase().includes(search.toLowerCase())).map(log => (
              <tr key={log.id}>
                <td className="text-xs">{formatDateTime(log.createdAt)}</td>
                <td className="text-xs">{log.user?.name || 'System'}</td>
                <td><span className="badge badge-info">{log.action}</span></td>
                <td className="text-xs text-gray-400">{log.entity} {log.entityId ? `#${log.entityId.slice(0,8)}` : ''}</td>
                <td className="text-xs text-gray-500 max-w-xs truncate">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  )
}
