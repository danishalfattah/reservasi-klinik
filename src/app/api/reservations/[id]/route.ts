import { NextRequest } from 'next/server';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canAccessUser, requireRole, type AuthPayload } from '@/lib/auth';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-error';
import { z } from 'zod';

const reservationRepo = new ReservationRepository();
const updateReservationSchema = z.object({
  status: z.enum(['CANCELLED']),
});

async function requireReservationAccess(id: string, payload: AuthPayload): Promise<NonNullable<Awaited<ReturnType<typeof reservationRepo.findByIdWithDetails>>>> {
  const reservation = await reservationRepo.findByIdWithDetails(id);
  if (!reservation) throw new NotFoundError('Reservasi tidak ditemukan');
  if (!canAccessUser(payload, reservation.pasienId)) {
    throw new UnauthorizedError('Anda tidak memiliki akses ke reservasi ini');
  }
  return reservation;
}

function assertCanCancel(status: string): void {
  if (status === 'DONE' || status === 'CANCELLED') {
    throw new ValidationError(
      'INVALID_STATE',
      'Reservasi tidak dapat dibatalkan karena sudah selesai atau dibatalkan'
    );
  }
}

/**
 * GET /api/reservations/[id] — Get single reservation detail
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const payload = await requireRole(_request, ['PASIEN', 'ADMIN']);
    const { id } = await params;
    const reservation = await requireReservationAccess(id, payload);
    return apiSuccess(reservation, 200);
  } catch (error) {
    return handleRouteError(error, 'Gagal mengambil reservasi', 'GET /api/reservations/[id] error:');
  }
}

/**
 * PATCH /api/reservations/[id] — Update reservation (e.g., cancel)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const payload = await requireRole(request, ['PASIEN', 'ADMIN']);
    const { id } = await params;
    const body = await request.json();

    const validation = updateReservationSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Validasi gagal',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const { status } = validation.data;
    const existing = await requireReservationAccess(id, payload);
    assertCanCancel(existing.status);
    const updated = await reservationRepo.update(id, { status });

    return apiSuccess(updated, 200);
  } catch (error) {
    return handleRouteError(error, 'Gagal update reservasi', 'PATCH /api/reservations/[id] error:');
  }
}
