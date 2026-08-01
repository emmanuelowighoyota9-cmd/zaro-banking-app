import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="text-5xl mb-6">🏦</div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Zaro <span className="text-blue-500">Bank</span>
        </h1>
        <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto">
          Secure online banking with real-time transactions, account management, and powerful admin controls.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn btn-primary text-base px-8 py-3">
            Open an Account
          </Link>
          <Link href="/login" className="btn btn-ghost text-base px-8 py-3">
            Sign In
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="glass-card p-5">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">Secure</h3>
            <p className="text-sm text-slate-400">JWT auth, bcrypt hashing, and transaction locking.</p>
          </div>
          <div className="glass-card p-5">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Fast</h3>
            <p className="text-sm text-slate-400">Real-time transfers with atomic transaction guarantees.</p>
          </div>
          <div className="glass-card p-5">
            <div className="text-2xl mb-2">🛡️</div>
            <h3 className="font-semibold mb-1">Admin Control</h3>
            <p className="text-sm text-slate-400">Full user management with credit/debit and audit trails.</p>
          </div>
        </div>
        <div className="mt-10">
          <Link href="/admin/login" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Admin Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
