import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdmin, AuthRequest } from '@/lib/middleware';

export const GET = withAdmin(async (req: AuthRequest) => {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const type = url.searchParams.get('type') || '';
    const offset = (page - 1) * limit;
    let query = `SELECT t.*, fa.account_number as from_account_number, ta.account_number as to_account_number, fu.first_name || ' ' || fu.last_name as from_user, tu.first_name || ' ' || tu.last_name as to_user, au.first_name || ' ' || au.last_name as admin_name FROM transactions t LEFT JOIN accounts fa ON t.from_account_id = fa.id LEFT JOIN accounts ta ON t.to_account_id = ta.id LEFT JOIN users fu ON fa.user_id = fu.id LEFT JOIN users tu ON ta.user_id = tu.id LEFT JOIN users au ON t.performed_by = au.id WHERE 1=1`;
    const params: any[] = [];
    if (type && ['deposit', 'withdrawal', 'transfer', 'admin_credit', 'admin_debit'].includes(type)) { query += ' AND t.type = ?'; params.push(type); }
    const countQuery = query.replace(/SELECT.*?FROM/s, 'SELECT COUNT(*) as count FROM');
    const { count: total } = db.prepare(countQuery).get(...params) as { count: number };
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?'; params.push(limit, offset);
    const transactions = db.prepare(query).all(...params);
    return NextResponse.json({ transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { console.error('List transactions error:', error); return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 }); }
});
