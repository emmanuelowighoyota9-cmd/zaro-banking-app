import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdmin, AuthRequest } from '@/lib/middleware';
import { v4 as uuidv4 } from 'uuid';

export const GET = withAdmin(async (req: AuthRequest, { params }: { params: { id: string } }) => {
  try {
    const db = getDb();
    const user = db.prepare(`SELECT id, email, first_name, last_name, phone, role, status, two_factor_enabled, created_at, updated_at FROM users WHERE id = ? AND role = 'user'`).get(params.id) as any;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const accounts = db.prepare(`SELECT * FROM accounts WHERE user_id = ?`).all(params.id);
    const recentTxns = db.prepare(`SELECT t.* FROM transactions t JOIN accounts a ON (t.from_account_id = a.id OR t.to_account_id = a.id) WHERE a.user_id = ? ORDER BY t.created_at DESC LIMIT 20`).all(params.id);
    return NextResponse.json({ user, accounts, recentTransactions: recentTxns });
  } catch (error) { console.error('Get user error:', error); return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 }); }
});

export const PUT = withAdmin(async (req: AuthRequest, { params }: { params: { id: string } }) => {
  try {
    const { status } = await req.json();
    if (!['active', 'suspended'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    const db = getDb(); const now = new Date().toISOString();
    const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'user'").get(params.id) as any;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, now, params.id);
    const auditId = uuidv4();
    db.prepare(`INSERT INTO audit_logs (id, admin_id, action, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(auditId, req.user!.userId, status === 'suspended' ? 'suspend_user' : 'reactivate_user', params.id, JSON.stringify({ status }), now);
    return NextResponse.json({ message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully` });
  } catch (error) { console.error('Update user error:', error); return NextResponse.json({ error: 'Failed to update user' }, { status: 500 }); }
});

export const DELETE = withAdmin(async (req: AuthRequest, { params }: { params: { id: string } }) => {
  try {
    const db = getDb(); const now = new Date().toISOString();
    const user = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'user'").get(params.id) as any;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const auditId = uuidv4();
    db.transaction(() => {
      db.prepare(`INSERT INTO audit_logs (id, admin_id, action, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(auditId, req.user!.userId, 'delete_user', params.id, '{}', now);
      db.prepare('DELETE FROM users WHERE id = ?').run(params.id);
    })();
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) { console.error('Delete user error:', error); return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 }); }
});
