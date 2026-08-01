'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAuditLogsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/admin/login'); return; }
    if (!loading && user && user.role !== 'admin') { router.push('/dashboard'); return; }
  }, [user, loading, router]);

  const fetchLogs = useCallback(async () => {
    if (!token) return; setPageLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=30`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setLogs(data.logs || []); setPagination(data.pagination || {}); }
    } finally { setPageLoading(false); }
  }, [token, page]);
  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Audit Logs</h1>
      <p className="text-slate-400 mb-8">Complete record of all admin actions</p>
      {pageLoading ? (<div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>) : (<>
        <div className="table-container"><table><thead><tr><th>Admin</th><th>Action</th><th>Target User</th><th>Details</th><th>Date</th></tr></thead><tbody>
          {logs.map((log: any) => {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            return (<tr key={log.id}><td><p className="text-sm font-medium">{log.admin_name}</p><p className="text-xs text-slate-500">{log.admin_email}</p></td><td><span className={`badge ${log.action.includes('credit') ? 'badge-success' : log.action.includes('debit') ? 'badge-danger' : log.action.includes('suspend') || log.action.includes('delete') ? 'badge-danger' : 'badge-info'}`}>{log.action.replace('_', ' ')}</span></td><td className="text-sm text-slate-400">{log.target_user_name || log.target_user_email || '—'}</td><td className="text-sm text-slate-500">{details.amount ? `$${(details.amount / 100).toFixed(2)}` : ''}{details.reference ? ` · Ref: ${details.reference}` : ''}{details.status ? ` · ${details.status}` : ''}{!details.amount && !details.reference && !details.status ? '—' : ''}</td><td className="text-slate-500 text-sm">{new Date(log.created_at).toLocaleString()}</td></tr>);
          })}
          {logs.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No audit logs yet</td></tr>}
        </tbody></table></div>
        {pagination.totalPages > 1 && (<div className="flex items-center justify-between mt-4"><p className="text-sm text-slate-500">Page {page} of {pagination.totalPages}</p><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-ghost text-sm">Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="btn btn-ghost text-sm">Next</button></div></div>)}
      </>)}
    </div>
  );
}
