'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, phone: form.phone });
      router.push('/dashboard');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🏦</div>
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="text-slate-400 mt-1">Start banking in minutes</p>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">First Name</label><input value={form.firstName} onChange={update('firstName')} required /></div>
              <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Last Name</label><input value={form.lastName} onChange={update('lastName')} required /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label><input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Phone (optional)</label><input type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 234 567 8900" /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label><input type="password" value={form.password} onChange={update('password')} placeholder="Min. 8 characters" required /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label><input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} required /></div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">{loading ? 'Creating Account...' : 'Open Account'}</button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account? <Link href="/login" className="text-blue-400 hover:text-blue-300">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
