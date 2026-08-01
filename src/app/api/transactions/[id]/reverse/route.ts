import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAdmin, AuthRequest } from '@/lib/middleware';
import { v4 as uuidv4 } from 'uuid';

export const POST = withAdmin(async (req: AuthRequest, { params }: { params: { id: string } }) => {
  const db = getDb();
  try {
    const txn = db.prepare('SELECT * FROM transactions WHERE id = ?').get(params.id) as any;
    if (!txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (txn.status === 'reversed') return NextResponse.json({ error: 'Transaction already reversed' }, { status: 400 });
    const now = new Date().toISOString();
    const auditId = uuidv4();
    db.transaction(() => {
      if (txn.type === 'admin_credit' && txn.to_account_id) db.prepare('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?').run(txn.amount, now, txn.to_account_id);
      else if (txn.type === 'admin_debit' && txn.from_account_id) db.prepare('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?').run(txn.amount, now, txn.from_account_id);
      else if (txn.type === 'transfer' && txn.from_account_id && txn.to_account_id) {
        db.prepare('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?').run(txn.amount, now, txn.from_account_id);
        db.prepare('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?').run(txn.amount, now, txn.to_account_id);
      }
      db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('reversed', params.id);
      db.prepare(`INSERT INTO audit_logs (id, admin_id, action, target_account_id, details, created_at) VALUES (?, ?, 'reverse_transaction', ?, ?, ?)`).run(auditId, req.user!.userId, txn.from_account_id || txn.to_account_id, JSON.stringify({ transactionId: params.id, type: txn.type, amount: txn.amount, reference: txn.reference }), now);
    })();
    return NextResponse.json({ message: 'Transaction reversed successfully' });
  } catch (error) {
    console.error('Reverse error:', error);
    return NextResponse.json({ error: 'Reversal failed' }, { status: 500 });
  }
});
