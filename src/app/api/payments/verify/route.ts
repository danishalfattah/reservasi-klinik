import { NextRequest } from 'next/server';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { PaymentService } from '@/services/payment.service';
import { apiSuccess } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { handleRouteError } from '@/lib/route-error';
import { verifyPaymentSchema } from '@/validators/payment.validator';

const paymentService = new PaymentService(new PaymentRepository(), new ReservationRepository());

export async function POST(request: NextRequest): Promise<Response> {
  try {
    await requireRole(request, ['PASIEN', 'ADMIN']);
    const { orderId } = verifyPaymentSchema.parse(await request.json());
    await paymentService.verifyAndUpdateByOrderId(orderId);
    return apiSuccess({ updated: true });
  } catch (err) {
    return handleRouteError(err, 'Gagal memverifikasi pembayaran', 'POST /api/payments/verify error:');
  }
}
