import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/middleware';

export const GET = withAuth(async (req: AuthRequest) => {
  try {
    const db = getDb();
    const accounts = db.prepare(`SELECT id, account_number, account_type, balance, currency, status, created_at FROM accounts WHERE user_id = ? ORDER BY created_at DESC`).all(req.user!.userId);
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
});
