'use client';

import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/user/password', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('banking_token')}` }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Password updated successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Profile & Settings</h1>
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-slate-500 uppercase">First Name</label><p className="text-slate-200 mt-1">{user.firstName}</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Last Name</label><p className="text-slate-200 mt-1">{user.lastName}</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Email</label><p className="text-slate-200 mt-1">{user.email}</p></div>
          <div><label className="text-xs text-slate-500 uppercase">Role</label><p className="text-slate-200 mt-1 capitalize">{user.role}</p></div>
        </div>
      </div>
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-4 text-sm">{success}</div>}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
          <button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}
