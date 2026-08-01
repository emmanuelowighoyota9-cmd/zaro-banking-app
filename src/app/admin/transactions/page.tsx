'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminTransactionsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [txns, setTxns] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/admin/login'); return; }
    if (!loading && user && user.role !== 'admin') { router.push('/dashboard'); return; }
  }, [user, loading, router]);

  const fetchTxns = useCallback(async () => {
    if (!token) return; setPageLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/admin/transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setTxns(data.transactions || []); setPagination(data.pagination || {}); }
    } finally { setPageLoading(false); }
  }, [token, page, typeFilter]);
  useEffect(() => { fetchTxns(); }, [fetchTxns]);

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">All Transactions</h1>
      <p className="text-slate-400 mb-8">Complete transaction ledger</p>
      <div className="flex gap-3 mb-6"><select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="max-w-[180px]"><option value="">All Types</option><option value="transfer">Transfer</option><option value="admin_credit">Admin Credit</option><option value="admin_debit">Admin Debit</option></select></div>
      {pageLoading ? (<div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>) : (<>
        <div className="table-container"><table><thead><tr><th>Reference</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Admin</th><th>Date</th><th>Status</th></tr></thead><tbody>
          {txns.map((txn: any) => (<tr key={txn.id}><td className="font-mono text-xs text-slate-400">{txn.reference}</td><td><span className={`badge ${txn.type === 'admin_credit' ? 'badge-success' : txn.type === 'admin_debit' ? 'badge-danger' : 'badge-info'}`}>{txn.type.replace('_', ' ')}</span></td><td className="text-sm text-slate-400">{txn.from_account_number || '—'}{txn.from_user && <div className="text-xs text-slate-500">{txn.from_user}</div>}</td><td className="text-sm text-slate-400">{txn.to_account_number || '—'}{txn.to_user && <div className="text-xs text-slate-500">{txn.to_user}</div>}</td><td className="font-mono font-semibold">${(txn.amount / 100).toFixed(2)}</td><td className="text-sm text-slate-400">{txn.admin_name || '—'}</td><td className="text-slate-500 text-sm">{new Date(txn.created_at).toLocaleString()}</td><td><span className={`badge ${txn.status === 'completed' ? 'badge-success' : txn.status === 'reversed' ? 'badge-danger' : 'badge-warning'}`}>{txn.status}</span></td></tr>))}
          {txns.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">No transactions found</td></tr>}
        </tbody></table></div>
        {pagination.totalPages > 1 && (<div className="flex items-center justify-between mt-4"><p className="text-sm text-slate-500">Page {page} of {pagination.totalPages} ({pagination.total} total)</p><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-ghost text-sm">Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="btn btn-ghost text-sm">Next</button></div></div>)}
      </>)}
    </div>
  );
}
