'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentTxns, setRecentTxns] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) { router.push('/admin/login'); return; }
    if (!loading && user && user.role !== 'admin') { router.push('/dashboard'); return; }
    if (!token) return;
    fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((data) => { setStats(data.stats); setRecentTxns(data.recentTransactions || []); });
  }, [user, loading, token, router]);

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8"><h1 className="text-2xl font-bold">Admin Dashboard</h1><p className="text-slate-400 mt-1">System overview and metrics</p></div>
      {!stats ? (<div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>) : (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stat-card"><p className="stat-label">Total Users</p><p className="stat-value text-blue-400">{stats.totalUsers}</p><p className="text-xs text-slate-500 mt-1">{stats.activeUsers} active</p></div>
          <div className="stat-card"><p className="stat-label">Total Accounts</p><p className="stat-value text-purple-400">{stats.totalAccounts}</p></div>
          <div className="stat-card"><p className="stat-label">System Balance</p><p className="stat-value text-green-400">${(stats.totalBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
          <div className="stat-card"><p className="stat-label">Transactions</p><p className="stat-value text-amber-400">{stats.totalTransactions}</p><p className="text-xs text-slate-500 mt-1">{stats.todayTransactions} today (${(stats.todayVolume / 100).toFixed(2)})</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card"><p className="stat-label">Active Users</p><p className="text-2xl font-bold text-green-400 mt-1">{stats.activeUsers}</p></div>
          <div className="stat-card"><p className="stat-label">Suspended Users</p><p className="text-2xl font-bold text-red-400 mt-1">{stats.suspendedUsers}</p></div>
          <div className="stat-card"><p className="stat-label">Today&apos;s Volume</p><p className="text-2xl font-bold text-blue-400 mt-1">${(stats.todayVolume / 100).toFixed(2)}</p></div>
        </div>
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
        <div className="table-container"><table><thead><tr><th>Reference</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Date</th></tr></thead><tbody>{recentTxns.map((txn: any) => (<tr key={txn.id}><td className="font-mono text-xs text-slate-400">{txn.reference}</td><td><span className={`badge ${txn.type === 'admin_credit' || txn.type === 'deposit' ? 'badge-success' : txn.type === 'admin_debit' || txn.type === 'withdrawal' ? 'badge-danger' : 'badge-info'}`}>{txn.type.replace('_', ' ')}</span></td><td className="font-mono text-xs text-slate-400">{txn.from_account_number || '—'}</td><td className="font-mono text-xs text-slate-400">{txn.to_account_number || '—'}</td><td className="font-mono font-semibold">${(txn.amount / 100).toFixed(2)}</td><td className="text-slate-500 text-sm">{new Date(txn.created_at).toLocaleDateString()}</td></tr>))}</tbody></table></div>
      </>)}
    </div>
  );
}
