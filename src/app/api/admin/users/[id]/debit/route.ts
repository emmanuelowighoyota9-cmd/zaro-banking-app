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
    const debitAmount = Math.round(Number(amount));
    if (isNaN(debitAmount) || debitAmount <= 0) return NextResponse.json({ error: 'Invalid amount. Must be a positive number.' }, { status: 400 });
    const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ? AND status = ?').get(accountId, params.id, 'active') as any;
    if (!account) return NextResponse.json({ error: 'Account not found, does not belong to this user, or is inactive' }, { status: 404 });
    if (account.balance < debitAmount) return NextResponse.json({ error: `Insufficient funds. Available balance: $${(account.balance / 100).toFixed(2)}` }, { status: 400 });
    const reference = generateReference(); const txnId = uuidv4(); const auditId = uuidv4(); const now = new Date().toISOString();
    db.transaction(() => {
      db.prepare('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?').run(debitAmount, now, accountId);
      db.prepare(`INSERT INTO transactions (id, from_account_id, type, amount, description, reference, status, performed_by, created_at) VALUES (?, ?, 'admin_debit', ?, ?, ?, 'completed', ?, ?)`).run(txnId, accountId, debitAmount, description || 'Admin debit', reference, req.user!.userId, now);
      db.prepare(`INSERT INTO audit_logs (id, admin_id, action, target_user_id, target_account_id, details, created_at) VALUES (?, ?, 'debit_account', ?, ?, ?, ?)`).run(auditId, req.user!.userId, params.id, accountId, JSON.stringify({ amount: debitAmount, reference, previousBalance: account.balance, newBalance: account.balance - debitAmount }), now);
    })();
    const updatedAccount = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(accountId) as any;
    return NextResponse.json({ message: 'Account debited successfully', transaction: { id: txnId, reference, type: 'admin_debit', amount: debitAmount, previousBalance: account.balance, newBalance: updatedAccount.balance, createdAt: now } }, { status: 201 });
  } catch (error) { console.error('Debit error:', error); return NextResponse.json({ error: 'Debit operation failed' }, { status: 500 }); }
});
