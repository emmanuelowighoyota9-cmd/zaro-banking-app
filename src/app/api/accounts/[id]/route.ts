import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/middleware';

export const GET = withAuth(async (req: AuthRequest, { params }: { params: { id: string } }) => {
  try {
    const db = getDb();
    const account = db.prepare(`SELECT a.*, u.first_name, u.last_name, u.email FROM accounts a JOIN users u ON a.user_id = u.id WHERE a.id = ? AND a.user_id = ?`).get(params.id, req.user!.userId) as any;
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    const transactions = db.prepare(`SELECT * FROM transactions WHERE from_account_id = ? OR to_account_id = ? ORDER BY created_at DESC LIMIT 50`).all(params.id, params.id);
    return NextResponse.json({ account, transactions });
  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
});
