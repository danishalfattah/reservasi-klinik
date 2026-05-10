import { NextRequest } from 'next/server';

import { UnauthorizedError } from '@/lib/errors';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import type { Role } from '@/types/reservation.types';

export type AuthPayload = JwtPayload & { role: Role };

export async function getAuthPayload(request: NextRequest): Promise<AuthPayload> {
  const token = request.cookies.get('token')?.value;
  if (!token) throw new UnauthorizedError();
  const payload = await verifyToken(token);
  return payload as AuthPayload;
}

export async function requireRole(request: NextRequest, roles: Role[]): Promise<AuthPayload> {
  const payload = await getAuthPayload(request);
  if (!roles.includes(payload.role)) {
    throw new UnauthorizedError('Anda tidak memiliki akses ke fitur ini');
  }
  return payload;
}

export function canAccessUser(payload: AuthPayload, userId: string): boolean {
  return payload.role === 'ADMIN' || payload.userId === userId;
}
