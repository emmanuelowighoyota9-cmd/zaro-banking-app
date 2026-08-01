'use client';

import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransferPage() {
  const { user, accounts, token, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (accounts.length > 0 && !fromAccountId) {
      const active = accounts.filter((a: any) => a.status === 'active');
      if (active.length > 0) setFromAccountId(active[0].id);
    }
  }, [user, loading, accounts, fromAccountId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) { setError('Enter a valid amount'); return; }
    if (!fromAccountId) { setError('Select a source account'); return; }
    if (!toAccountNumber) { setError('Enter recipient account number'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ fromAccountId, toAccountNumber, amount: Math.round(transferAmount * 100), description }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`$${transferAmount.toFixed(2)} transferred successfully! Reference: ${data.transaction.reference}`);
      setAmount(''); setDescription(''); setToAccountNumber('');
      refreshUser();
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  if (loading || !user) return null;
  const activeAccounts = accounts.filter((a: any) => a.status === 'active');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Transfer Money</h1>
      <p className="text-slate-400 mb-8">Send money to another account instantly</p>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
      {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">{success}</div>}
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">From Account</label>
          <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
            {activeAccounts.map((a: any) => (<option key={a.id} value={a.id}>{a.account_number} — {a.account_type} (${(a.balance / 100).toFixed(2)})</option>))}
            {activeAccounts.length === 0 && <option disabled>No active accounts</option>}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">To Account Number</label><input value={toAccountNumber} onChange={(e) => setToAccountNumber(e.target.value)} placeholder="Enter 10-digit account number" maxLength={10} required /></div>
        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Amount (USD)</label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span><input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="pl-8" required /></div>
          {fromAccountId && <p className="text-xs text-slate-500 mt-1">Available: ${((accounts.find((a: any) => a.id === fromAccountId)?.balance || 0) / 100).toFixed(2)}</p>}
        </div>
        <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Description (optional)</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this for?" /></div>
        <button type="submit" disabled={submitting || activeAccounts.length === 0} className="btn btn-primary w-full py-2.5">{submitting ? 'Processing...' : 'Send Money'}</button>
      </form>
    </div>
  );
}
