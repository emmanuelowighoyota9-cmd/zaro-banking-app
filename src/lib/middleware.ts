import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export interface AuthRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: 'user' | 'admin';
  };
}

type RouteHandler = (req: AuthRequest, context: any) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req: AuthRequest, context: any) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    req.user = payload;
    return handler(req, context);
  };
}

export function withAdmin(handler: RouteHandler): RouteHandler {
  return withAuth(async (req: AuthRequest, context: any) => {
    if (req.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return handler(req, context);
  });
}
