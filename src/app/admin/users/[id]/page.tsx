'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function AdminUserDetailPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter(); const params = useParams();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showCredit, setShowCredit] = useState(false);
  const [showDebit, setShowDebit] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) { router.push('/admin/login'); return; }
    if (!loading && user && user.role !== 'admin') { router.push('/dashboard'); return; }
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/admin/users/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then((data) => {
        setTargetUser(data.user); setAccounts(data.accounts || []); setRecentTxns(data.recentTransactions || []);
        if (data.accounts?.length > 0) setSelectedAccountId(data.accounts[0].id);
      })
      .catch(() => router.push('/admin/users'))
      .finally(() => setPageLoading(false));
  }, [token, params.id, router]);

  const handleCreditDebit = async (type: 'credit' | 'debit') => {
    setActionError(''); setActionSuccess('');
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) { setActionError('Enter a valid positive amount'); return; }
    if (!selectedAccountId) { setActionError('Select an account'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}/${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ accountId: selectedAccountId, amount: Math.round(value * 100), description }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActionSuccess(`Successfully ${type === 'credit' ? 'credited' : 'debited'} $${value.toFixed(2)}. Ref: ${data.transaction.reference}`);
      setAmount(''); setDescription('');
      if (type === 'credit') setShowCredit(false); else setShowDebit(false);
      const refresh = await fetch(`/api/admin/users/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const refreshData = await refresh.json();
      setTargetUser(refreshData.user); setAccounts(refreshData.accounts || []); setRecentTxns(refreshData.recentTransactions || []);
    } catch (err: any) { setActionError(err.message); } finally { setSubmitting(false); }
  };

  const handleReverse = async (txnId: string) => {
    if (!confirm('Reverse this transaction? This will move funds back.')) return;
    try {
      const res = await fetch(`/api/transactions/${txnId}/reverse`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Transaction reversed successfully');
      const refresh = await fetch(`/api/admin/users/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const refreshData = await refresh.json();
      setTargetUser(refreshData.user); setAccounts(refreshData.accounts || []); setRecentTxns(refreshData.recentTransactions || []);
    } catch (err: any) { alert(err.message); }
  };

  if (pageLoading || !targetUser) return (<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/admin/users" className="text-sm text-slate-400 hover:text-white mb-6 inline-block">← Back to Users</Link>
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between"><div><h1 className="text-2xl font-bold">{targetUser.first_name} {targetUser.last_name}</h1><p className="text-slate-400">{targetUser.email}</p><div className="flex items-center gap-3 mt-2"><span className={`badge ${targetUser.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{targetUser.status}</span><span className="text-xs text-slate-500">Joined {new Date(targetUser.created_at).toLocaleDateString()}</span></div></div><div className="flex gap-2"><button onClick={() => { setShowCredit(true); setShowDebit(false); setActionError(''); setActionSuccess(''); }} className="btn btn-success">💰 Credit</button><button onClick={() => { setShowDebit(true); setShowCredit(false); setActionError(''); setActionSuccess(''); }} className="btn btn-danger">💸 Debit</button></div></div>
      </div>

      {(showCredit || showDebit) && (
        <div className="glass-card p-6 mb-6 border-blue-500/30">
          <h3 className="font-semibold mb-4 text-lg">{showCredit ? '💰 Credit Account' : '💸 Debit Account'}</h3>
          {actionError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{actionError}</div>}
          {actionSuccess && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">{actionSuccess}</div>}
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Account</label><select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>{accounts.map((a: any) => (<option key={a.id} value={a.id}>{a.account_number} — {a.account_type} (Balance: ${(a.balance / 100).toFixed(2)})</option>))}</select></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Amount (USD)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="pl-8" required /></div></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={showCredit ? 'e.g. Salary deposit' : 'e.g. Service fee'} /></div>
            <div className="flex gap-3">
              <button onClick={() => handleCreditDebit(showCredit ? 'credit' : 'debit')} disabled={submitting} className={`btn flex-1 py-2.5 ${showCredit ? 'btn-success' : 'btn-danger'}`}>{submitting ? 'Processing...' : showCredit ? 'Credit Account' : 'Debit Account'}</button>
              <button onClick={() => { setShowCredit(false); setShowDebit(false); }} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Accounts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {accounts.map((a: any) => (<div key={a.id} className="glass-card p-5"><div className="flex items-center justify-between mb-3"><span className="text-xs text-slate-500 uppercase">{a.account_type}</span><span className={`badge ${a.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{a.status}</span></div><p className="font-mono text-sm text-slate-400">{a.account_number}</p><p className="text-2xl font-bold mt-1">${(a.balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      {recentTxns.length === 0 ? (<div className="glass-card p-8 text-center text-slate-500">No transactions</div>) : (
        <div className="table-container"><table><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {recentTxns.map((txn: any) => (<tr key={txn.id}><td className="font-mono text-xs text-slate-400">{txn.reference}</td><td><span className={`badge ${txn.type === 'admin_credit' || txn.type === 'deposit' ? 'badge-success' : txn.type === 'admin_debit' || txn.type === 'withdrawal' ? 'badge-danger' : 'badge-info'}`}>{txn.type.replace('_', ' ')}</span></td><td className={`font-mono font-semibold ${txn.type === 'admin_credit' || txn.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>${(txn.amount / 100).toFixed(2)}</td><td className="text-slate-500 text-sm">{new Date(txn.created_at).toLocaleString()}</td><td><span className={`badge ${txn.status === 'completed' ? 'badge-success' : txn.status === 'reversed' ? 'badge-danger' : 'badge-warning'}`}>{txn.status}</span></td><td>{txn.status === 'completed' && <button onClick={() => handleReverse(txn.id)} className="btn btn-ghost text-xs py-1 px-2 text-amber-400">Reverse</button>}</td></tr>))}
        </tbody></table></div>
      )}
    </div>
  );
}
