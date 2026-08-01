import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createToken, setSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password, isAdmin } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare(`SELECT id, email, password_hash, first_name, last_name, role, status FROM users WHERE email = ?`).get(email.toLowerCase().trim()) as any;

    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    if (isAdmin && user.role !== 'admin') return NextResponse.json({ error: 'Admin access denied' }, { status: 403 });
    if (user.status === 'suspended') return NextResponse.json({ error: 'Account suspended. Contact support.' }, { status: 403 });

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });
    await setSessionCookie(token);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
