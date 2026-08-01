import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateReference } from '@/lib/auth';
import { withAdmin, AuthRequest } from '@/lib/middleware';
import { v4 as uuidv4 } from 'uuid';

export const POST = withAdmin(async (req: AuthRequest, { params }: { params: { id: string } }) => {
  const db = getDb();
  try {
    const { accountId, amount, description } = await req.json();
    if (!accountId || !amount) return NextResponse.json({ error: 'Account ID and amount are required' }, { status: 400 });
    const creditAmount = Math.round(Number(amount));
    if (isNaN(creditAmount) || creditAmount <= 0) return NextResponse.json({ error: 'Invalid amount. Must be a positive number.' }, { status: 400 });
    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ? AND status = ?').get(accountId, params.id, 'active') as any;
    if (!account) return NextResponse.json({ error: 'Account not found, does not belong to this user, or is inactive' }, { status: 404 });
    const reference = generateReference(); const txnId = uuidv4(); const auditId = uuidv4(); const now = new Date().toISOString();
    db.transaction(() => {
      db.prepare('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?').run(creditAmount, now, accountId);
      db.prepare(`INSERT INTO transactions (id, to_account_id, type, amount, description, reference, status, performed_by, created_at) VALUES (?, ?, 'admin_credit', ?, ?, ?, 'completed', ?, ?)`).run(txnId, accountId, creditAmount, description || 'Admin credit', reference, req.user!.userId, now);
      db.prepare(`INSERT INTO audit_logs (id, admin_id, action, target_user_id, target_account_id, details, created_at) VALUES (?, ?, 'credit_account', ?, ?, ?, ?)`).run(auditId, req.user!.userId, params.id, accountId, JSON.stringify({ amount: creditAmount, reference, previousBalance: account.balance, newBalance: account.balance + creditAmount }), now);
    })();
    const updatedAccount = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(accountId) as any;
    return NextResponse.json({ message: 'Account credited successfully', transaction: { id: txnId, reference, type: 'admin_credit', amount: creditAmount, previousBalance: account.balance, newBalance: updatedAccount.balance, createdAt: now } }, { status: 201 });
  } catch (error) { console.error('Credit error:', error); return NextResponse.json({ error: 'Credit operation failed' }, { status: 500 }); }
});
