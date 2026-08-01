import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createToken, setSessionCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const userId = uuidv4();
    const accountId = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, 12);

    const createUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'user', 'active', ?, ?)
    `);
    const createAccount = db.prepare(`
      INSERT INTO accounts (id, user_id, account_number, account_type, balance, created_at, updated_at)
      VALUES (?, ?, ?, 'checking', 0, ?, ?)
    `);

    db.transaction(() => {
      createUser.run(userId, email.toLowerCase().trim(), passwordHash, firstName.trim(), lastName.trim(), phone || '', now, now);
      const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      createAccount.run(accountId, userId, accountNumber, now, now);
    })();

    const token = await createToken({ userId, email: email.toLowerCase().trim(), role: 'user' });
    await setSessionCookie(token);

    return NextResponse.json({
      message: 'Registration successful',
      token,
      user: { id: userId, email: email.toLowerCase().trim(), firstName: firstName.trim(), lastName: lastName.trim(), role: 'user' },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
