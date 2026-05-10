import { ZodError } from 'zod';

import { apiError } from '@/lib/api-response';
import { AppError } from '@/lib/errors';

export function handleRouteError(
  err: unknown,
  fallbackMessage: string,
  logLabel?: string
): Response {
  if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
  if (err instanceof ZodError) return apiError('VALIDATION_ERROR', 'Input tidak valid', 400, err.issues);
  if (logLabel) console.error(logLabel, err);
  return apiError('INTERNAL_ERROR', fallbackMessage, 500);
}
