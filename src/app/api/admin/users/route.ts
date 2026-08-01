import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdmin, AuthRequest } from '@/lib/middleware';

export const GET = withAdmin(async (req: AuthRequest) => {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.status, u.two_factor_enabled, u.created_at, a.id as account_id, a.account_number, a.balance, a.account_type, a.status as account_status FROM users u LEFT JOIN accounts a ON u.id = a.user_id WHERE u.role = 'user'`;
    const params: any[] = [];
    if (search) { query += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR a.account_number LIKE ?)`; const t = `%${search}%`; params.push(t, t, t, t); }
    if (status) { query += ` AND u.status = ?`; params.push(status); }
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(DISTINCT u.id) as count FROM');
    const { count: total } = db.prepare(countQuery).get(...params) as { count: number };
    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    const users = db.prepare(query).all(...params);
    return NextResponse.json({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
});
