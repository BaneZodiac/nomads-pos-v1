import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => { const { data } = await api.get('/settings/audit-logs'); return data; },
  });

  const logs = data?.data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Audit Logs</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="text-left px-4 py-3 font-medium">Action</th><th className="text-left px-4 py-3 font-medium">User</th><th className="text-left px-4 py-3 font-medium">Entity</th><th className="text-left px-4 py-3 font-medium">Details</th><th className="text-left px-4 py-3 font-medium">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs bg-slate-100 font-medium">{log.action}</span></td>
                  <td className="px-4 py-3 text-slate-500">{log.user?.firstName} {log.user?.lastName || 'System'}</td>
                  <td className="px-4 py-3 text-slate-500">{log.entity || '-'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{log.details || '-'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
