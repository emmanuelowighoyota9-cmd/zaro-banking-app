'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password, true); router.push('/admin/dashboard'); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 border-amber-500/20">
          <div className="text-center mb-8"><div className="text-4xl mb-3">🛡️</div><h2 className="text-2xl font-bold">Admin Portal</h2><p className="text-slate-400 mt-1">Restricted access</p></div>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@bank.com" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></div>
            <button type="submit" disabled={loading} className="btn w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white">{loading ? 'Authenticating...' : 'Access Admin Panel'}</button>
          </form>
          <p className="text-center text-xs text-slate-600 mt-4">Default: admin@bank.com / Admin@123!</p>
        </div>
      </div>
    </div>
  );
}
