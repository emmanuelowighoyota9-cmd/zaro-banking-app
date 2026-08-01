import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/middleware';

export const GET = withAuth(async (req: AuthRequest) => {
  try {
    const db = getDb();
    const user = db.prepare(`SELECT id, email, first_name, last_name, phone, role, status, two_factor_enabled, created_at FROM users WHERE id = ?`).get(req.user!.userId) as any;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const accounts = db.prepare(`SELECT id, account_number, account_type, balance, currency, status, created_at FROM accounts WHERE user_id = ?`).all(req.user!.userId);

    return NextResponse.json({
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, phone: user.phone, role: user.role, status: user.status, twoFactorEnabled: !!user.two_factor_enabled, createdAt: user.created_at },
      accounts,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
});
