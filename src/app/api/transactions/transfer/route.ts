import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateReference } from '@/lib/auth';
import { withAuth, AuthRequest } from '@/lib/middleware';
import { v4 as uuidv4 } from 'uuid';

export const POST = withAuth(async (req: AuthRequest) => {
  const db = getDb();
  try {
    const { fromAccountId, toAccountNumber, amount, description } = await req.json();
    if (!fromAccountId || !toAccountNumber || !amount) return NextResponse.json({ error: 'From account, to account number, and amount are required' }, { status: 400 });
    const transferAmount = Math.round(Number(amount));
    if (isNaN(transferAmount) || transferAmount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    const fromAccount = db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ? AND status = ?').get(fromAccountId, req.user!.userId, 'active') as any;
    if (!fromAccount) return NextResponse.json({ error: 'Source account not found or inactive' }, { status: 404 });
    if (fromAccount.balance < transferAmount) return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    const toAccount = db.prepare('SELECT * FROM accounts WHERE account_number = ? AND status = ?').get(toAccountNumber, 'active') as any;
    if (!toAccount) return NextResponse.json({ error: 'Recipient account not found' }, { status: 404 });
    if (toAccount.id === fromAccount.id) return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });
    const reference = generateReference();
    const txnId = uuidv4();
    const now = new Date().toISOString();
    db.transaction(() => {
      db.prepare('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?').run(transferAmount, now, fromAccount.id);
      db.prepare('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?').run(transferAmount, now, toAccount.id);
      db.prepare(`INSERT INTO transactions (id, from_account_id, to_account_id, type, amount, description, reference, status, created_at) VALUES (?, ?, ?, 'transfer', ?, ?, ?, 'completed', ?)`).run(txnId, fromAccount.id, toAccount.id, transferAmount, description || '', reference, now);
    })();
    const updatedFrom = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(fromAccount.id) as any;
    return NextResponse.json({ message: 'Transfer successful', transaction: { id: txnId, reference, fromAccountId: fromAccount.id, toAccountId: toAccount.id, amount: transferAmount, type: 'transfer', status: 'completed', newBalance: updatedFrom.balance, createdAt: now } }, { status: 201 });
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json({ error: 'Transfer failed' }, { status: 500 });
  }
});
