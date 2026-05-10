import { ZodError } from 'zod';

import { apiSuccess, apiError } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { UserRepository } from '@/repositories/user.repository';
import { AuthService } from '@/services/auth.service';
import { registerSchema } from '@/validators/auth.validator';

const authService = new AuthService(new UserRepository());

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);
    const result = await authService.registerUser(validated);

    const response = apiSuccess(result, 201);
    response.headers.set(
      'Set-Cookie',
      `token=${result.token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
    );
    return response;
  } catch (err) {
    if (err instanceof AppError) {
      return apiError(err.code, err.message, err.statusCode);
    }
    if (err instanceof ZodError) {
      return apiError('VALIDATION_ERROR', 'Input tidak valid', 400, err.issues);
    }
    console.error('Register error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
