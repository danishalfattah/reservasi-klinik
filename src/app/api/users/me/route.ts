import { ZodError } from 'zod';
import { cookies } from 'next/headers';

import { apiSuccess, apiError } from '@/lib/api-response';
import { AppError, UnauthorizedError } from '@/lib/errors';
import { verifyToken } from '@/lib/jwt';
import { UserRepository } from '@/repositories/user.repository';
import { UserService } from '@/services/user.service';
import {
  updateProfileSchema,
  updateDoctorProfileSchema,
} from '@/validators/user.validator';

const userService = new UserService(new UserRepository());

async function getUserIdFromCookie(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) throw new UnauthorizedError();
  const payload = await verifyToken(token);
  return payload.userId;
}

export async function GET(): Promise<Response> {
  try {
    const userId = await getUserIdFromCookie();
    const profile = await userService.getProfile(userId);
    return apiSuccess(profile);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    console.error('GET /api/users/me error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try {
    const userId = await getUserIdFromCookie();
    const profile = await userService.getProfile(userId);
    const body = await req.json();

    const updated =
      profile.role === 'DOKTER'
        ? await userService.updateDoctorProfile(userId, updateDoctorProfileSchema.parse(body))
        : await userService.updateProfile(userId, updateProfileSchema.parse(body));

    return apiSuccess(updated);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    if (err instanceof ZodError) return apiError('VALIDATION_ERROR', 'Input tidak valid', 400, err.issues);
    console.error('PATCH /api/users/me error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
