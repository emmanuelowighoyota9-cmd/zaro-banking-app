'use client';
import { useAuth } from '@/components/AuthProvider';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminUsersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push('/admin/login'); return; }
    if (!loading && user && user.role !== 'admin') { router.push('/dashboard'); return; }
  }, [user, loading, router]);

  const fetchUsers = useCallback(async () => {
    if (!token) return; setPageLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setUsers(data.users || []); setPagination(data.pagination || {}); }
    } finally { setPageLoading(false); }
  }, [token, page, search, statusFilter]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSuspend = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this user?`)) return;
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) });
      fetchUsers();
    } catch (err) { alert('Failed to update user'); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to DELETE this user and all their data? This cannot be undone.')) return;
    try { await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchUsers(); } catch (err) { alert('Failed to delete user'); }
  };

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold">User Management</h1><p className="text-slate-400 mt-1">View, manage, and control all user accounts</p></div></div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, email, or account number..." className="max-w-sm" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="max-w-[160px]"><option value="">All Status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      {pageLoading ? (<div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>) : (<>
        <div className="table-container"><table><thead><tr><th>User</th><th>Account</th><th>Balance</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
          {users.map((u: any) => (<tr key={u.id}>
            <td><div><p className="font-medium">{u.first_name} {u.last_name}</p><p className="text-xs text-slate-500">{u.email}</p></div></td>
            <td className="font-mono text-sm text-slate-300">{u.account_number || '—'}{u.account_type && <span className="text-xs text-slate-500 ml-1">({u.account_type})</span>}</td>
            <td className="font-mono font-semibold">{u.balance != null ? `$${(u.balance / 100).toFixed(2)}` : '—'}</td>
            <td><span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
            <td className="text-slate-500 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
            <td><div className="flex items-center gap-2">
              <Link href={`/admin/users/${u.id}`} className="btn btn-ghost text-xs py-1 px-2">Manage</Link>
              <button onClick={() => handleSuspend(u.id, u.status)} className={`btn text-xs py-1 px-2 ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}>{u.status === 'active' ? 'Suspend' : 'Activate'}</button>
              <button onClick={() => handleDelete(u.id)} className="btn btn-ghost text-xs py-1 px-2 text-red-400">Delete</button>
            </div></td>
          </tr>))}
          {users.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No users found</td></tr>}
        </tbody></table></div>
        {pagination.totalPages > 1 && (<div className="flex items-center justify-between mt-4"><p className="text-sm text-slate-500">Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-ghost text-sm">Previous</button><button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="btn btn-ghost text-sm">Next</button></div></div>)}
      </>)}
    </div>
  );
}
