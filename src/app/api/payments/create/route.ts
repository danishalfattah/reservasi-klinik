import { NextRequest } from 'next/server';

import { apiSuccess } from '@/lib/api-response';
import { canAccessUser, requireRole } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-error';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { PaymentService } from '@/services/payment.service';
import { createPaymentSchema } from '@/validators/payment.validator';

const reservationRepo = new ReservationRepository();
const paymentService = new PaymentService(new PaymentRepository(), reservationRepo);

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const payload = await requireRole(request, ['PASIEN', 'ADMIN']);
    const input = createPaymentSchema.parse(await request.json());
    const reservation = await reservationRepo.findById(input.reservationId);

    if (reservation && !canAccessUser(payload, reservation.pasienId)) {
      throw new UnauthorizedError('Anda tidak memiliki akses ke reservasi ini');
    }

    const payment = await paymentService.buatPaymentByReservationId(input.reservationId);
    return apiSuccess(payment, 201);
  } catch (err) {
    return handleRouteError(err, 'Gagal membuat pembayaran', 'POST /api/payments/create error:');
  }
}
