'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function AccountDetailPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (!token) return;
    fetch(`/api/accounts/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then((data) => { setAccount(data.account); setTransactions(data.transactions || []); })
      .catch(() => router.push('/dashboard'))
      .finally(() => setPageLoading(false));
  }, [user, loading, token, params.id, router]);

  if (pageLoading || !account) {
    return (<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white mb-6 inline-block">← Back to Dashboard</Link>
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center justify-between mb-4"><div><span className="text-xs text-slate-500 uppercase">{account.account_type}</span><h1 className="text-2xl font-bold mt-1">{account.account_number}</h1></div><span className={`badge ${account.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{account.status}</span></div>
        <p className="text-4xl font-bold">${(account.balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        <p className="text-sm text-slate-500 mt-1">Current Balance · {account.currency}</p>
      </div>
      <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
      {transactions.length === 0 ? (<div className="glass-card p-8 text-center text-slate-500">No transactions yet</div>) : (
        <div className="table-container"><table><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th></tr></thead><tbody>
          {transactions.map((txn: any) => {
            const isIncoming = txn.to_account_id === account.id;
            const isCredit = txn.type === 'admin_credit' || txn.type === 'deposit';
            const isDebit = txn.type === 'admin_debit' || txn.type === 'withdrawal';
            const positive = (isIncoming && txn.type === 'transfer') || isCredit;
            return (<tr key={txn.id}><td className="font-mono text-xs text-slate-400">{txn.reference}</td><td><span className={`badge ${isCredit ? 'badge-success' : isDebit ? 'badge-danger' : 'badge-info'}`}>{txn.type.replace('_', ' ')}</span></td><td className={`font-mono font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>{positive ? '+' : '-'}${(txn.amount / 100).toFixed(2)}</td><td className="text-slate-400 text-sm max-w-[200px] truncate">{txn.description || '—'}</td><td className="text-slate-500 text-sm">{new Date(txn.created_at).toLocaleDateString()}</td><td><span className={`badge ${txn.status === 'completed' ? 'badge-success' : txn.status === 'reversed' ? 'badge-danger' : 'badge-warning'}`}>{txn.status}</span></td></tr>);
          })}
        </tbody></table></div>
      )}
    </div>
  );
}
