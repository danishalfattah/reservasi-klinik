import { NextRequest } from 'next/server';
import { type Role } from '@/generated/prisma/client';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { UserRepository } from '@/repositories/user.repository';

const userRepo = new UserRepository();

const VALID_ROLES: Role[] = ['PASIEN', 'DOKTER', 'ADMIN'];

function parseRole(raw: string | null): Role {
  if (raw && VALID_ROLES.includes(raw as Role)) return raw as Role;
  return 'PASIEN';
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    await requireRole(request, ['ADMIN']);
    const role = parseRole(request.nextUrl.searchParams.get('role'));
    const users = await userRepo.findAllByRole(role);
    return apiSuccess(users);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
