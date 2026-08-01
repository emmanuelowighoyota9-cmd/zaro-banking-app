import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdmin, AuthRequest } from '@/lib/middleware';

export const GET = withAdmin(async (req: AuthRequest) => {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const offset = (page - 1) * limit;
    const { count: total } = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number };
    const logs = db.prepare(`SELECT al.*, u.first_name || ' ' || u.last_name as admin_name, u.email as admin_email, tu.first_name || ' ' || tu.last_name as target_user_name, tu.email as target_user_email FROM audit_logs al JOIN users u ON al.admin_id = u.id LEFT JOIN users tu ON al.target_user_id = tu.id ORDER BY al.created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
    return NextResponse.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { console.error('Audit logs error:', error); return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 }); }
});
