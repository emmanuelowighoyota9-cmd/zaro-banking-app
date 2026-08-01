'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, accounts, loading, token } = useAuth();
  const router = useRouter();
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    fetch('/api/accounts', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.accounts?.length > 0) {
          const fetchTxns = data.accounts.map((a: any) =>
            fetch(`/api/accounts/${a.id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json())
          );
          Promise.all(fetchTxns).then((results) => {
            const allTxns = results.flatMap((r: any) => r.transactions || []);
            allTxns.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setTxns(allTxns.slice(0, 10));
          });
        }
      });
  }, [token]);

  if (loading || !user) return null;
  const totalBalance = accounts.reduce((sum: number, a: any) => sum + a.balance, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8"><h1 className="text-2xl font-bold">Welcome back, {user.firstName} 👋</h1><p className="text-slate-400 mt-1">Here&apos;s your financial overview</p></div>
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Balance</h2>
          <Link href="/dashboard/transfer" className="btn btn-primary text-sm">Transfer Money</Link>
        </div>
        <p className="text-4xl font-bold">${(totalBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        <p className="text-sm text-slate-500 mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
      </div>
      <h2 className="text-lg font-semibold mb-4">Your Accounts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {accounts.map((account: any) => (
          <Link key={account.id} href={`/dashboard/accounts/${account.id}`} className="glass-card p-5 hover:border-slate-600 transition-colors block">
            <div className="flex items-center justify-between mb-3"><span className="text-xs text-slate-500 uppercase">{account.account_type}</span><span className={`badge ${account.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{account.status}</span></div>
            <p className="text-xs text-slate-500 mb-1">{account.account_number}</p>
            <p className="text-2xl font-bold">${(account.balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-500 mt-1">{account.currency}</p>
          </Link>
        ))}
      </div>
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      {txns.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-500">No transactions yet. Make your first transfer!</div>
      ) : (
        <div className="table-container"><table><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th></tr></thead><tbody>{txns.map((txn: any) => (<tr key={txn.id}><td className="font-mono text-xs text-slate-400">{txn.reference}</td><td><span className={`badge ${txn.type === 'admin_credit' || txn.type === 'deposit' ? 'badge-success' : txn.type === 'admin_debit' || txn.type === 'withdrawal' ? 'badge-danger' : 'badge-info'}`}>{txn.type.replace('_', ' ')}</span></td><td className="font-mono font-semibold"><span className={txn.type === 'admin_debit' || txn.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'}>{txn.type === 'admin_debit' || txn.type === 'withdrawal' ? '-' : '+'}${(txn.amount / 100).toFixed(2)}</span></td><td className="text-slate-400 text-sm max-w-[200px] truncate">{txn.description || '—'}</td><td className="text-slate-500 text-sm">{new Date(txn.created_at).toLocaleDateString()}</td><td><span className={`badge ${txn.status === 'completed' ? 'badge-success' : txn.status === 'reversed' ? 'badge-danger' : 'badge-warning'}`}>{txn.status}</span></td></tr>))}</tbody></table></div>
      )}
    </div>
  );
}
