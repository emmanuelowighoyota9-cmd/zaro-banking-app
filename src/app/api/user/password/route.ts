import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { withAuth, AuthRequest } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

export const PUT = withAuth(async (req: AuthRequest) => {
  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.userId) as any;
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    const newHash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, new Date().toISOString(), req.user!.userId);
    return NextResponse.json({ message: 'Password updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
});
