import { NextRequest } from 'next/server';
import { ReservationService } from '@/services/reservation.service';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { UserRepository } from '@/repositories/user.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { PaymentService } from '@/services/payment.service';
import { createReservationSchema } from '@/validators/reservation.validator';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { handleRouteError } from '@/lib/route-error';

const reservationRepo = new ReservationRepository();
const doctorRepo = new DoctorRepository();
const userRepo = new UserRepository();
const paymentRepo = new PaymentRepository();
const paymentService = new PaymentService(paymentRepo, reservationRepo);
const service = new ReservationService(reservationRepo, doctorRepo, userRepo, paymentService);

/**
 * GET /api/reservations — List all reservations (admin/debug only)
 * Query Params: ?pasienId=xxx (optional for filtering)
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const payload = await requireRole(request, ['PASIEN', 'ADMIN']);
    const requestedPasienId = request.nextUrl.searchParams.get('pasienId');
    const pasienId = payload.role === 'ADMIN' && requestedPasienId ? requestedPasienId : payload.userId;
    const reservations = await reservationRepo.findAllByPasienId(pasienId);
    return apiSuccess(reservations, 200);
  } catch (error) {
    return handleRouteError(error, 'Gagal mengambil reservasi', 'GET /api/reservations error:');
  }
}

/**
 * POST /api/reservations — Create new reservation
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const payload = await requireRole(request, ['PASIEN']);
    const body = await request.json();
    const validation = createReservationSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Validasi gagal',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const input = validation.data;
    const tanggal = typeof input.tanggal === 'string' ? new Date(input.tanggal) : input.tanggal;
    const { reservation, snapToken } = await service.buatReservasi({
      pasienId: payload.userId,
      doctorId: input.doctorId,
      tanggal,
      jam: input.jam,
    });

    return apiSuccess({ reservation, snapToken }, 201);
  } catch (error) {
    return handleRouteError(error, 'Gagal membuat reservasi', 'POST /api/reservations error:');
  }
}
