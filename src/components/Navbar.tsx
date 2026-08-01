'use client';

import { useAuth } from './AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => { logout(); router.push('/login'); };

  const adminLinks = user.role === 'admin' ? [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/transactions', label: 'Transactions' },
    { href: '/admin/audit-logs', label: 'Audit Logs' },
  ] : [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/transfer', label: 'Transfer' },
    { href: '/dashboard/profile', label: 'Profile' },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="text-xl font-bold text-white">
              {user.role === 'admin' ? '🏦 Bank Admin' : '🏦 Zaro Bank'}
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {adminLinks.map((link) => (
                <Link key={link.href} href={link.href} className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {user.firstName} {user.lastName}
              {user.role === 'admin' && <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">ADMIN</span>}
            </span>
            <button onClick={handleLogout} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
