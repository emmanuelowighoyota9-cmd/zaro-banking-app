import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdmin, AuthRequest } from '@/lib/middleware';

export const GET = withAdmin(async (req: AuthRequest) => {
  try {
    const db = getDb();
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as { count: number };
    const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND status = 'active'").get() as { count: number };
    const suspendedUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND status = 'suspended'").get() as { count: number };
    const totalAccounts = db.prepare("SELECT COUNT(*) as count FROM accounts a JOIN users u ON a.user_id = u.id WHERE u.role = 'user'").get() as { count: number };
    const totalBalance = db.prepare("SELECT COALESCE(SUM(balance), 0) as total FROM accounts a JOIN users u ON a.user_id = u.id WHERE u.role = 'user'").get() as { total: number };
    const totalTransactions = db.prepare("SELECT COUNT(*) as count FROM transactions").get() as { count: number };
    const recentTransactions = db.prepare(`SELECT t.*, fa.account_number as from_account_number, ta.account_number as to_account_number FROM transactions t LEFT JOIN accounts fa ON t.from_account_id = fa.id LEFT JOIN accounts ta ON t.to_account_id = ta.id ORDER BY t.created_at DESC LIMIT 10`).all();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayTxns = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE created_at >= ?").get(todayStart.toISOString()) as { count: number; total: number };
    return NextResponse.json({ stats: { totalUsers: totalUsers.count, activeUsers: activeUsers.count, suspendedUsers: suspendedUsers.count, totalAccounts: totalAccounts.count, totalBalance: totalBalance.total, totalTransactions: totalTransactions.count, todayTransactions: todayTxns.count, todayVolume: todayTxns.total }, recentTransactions });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
});
