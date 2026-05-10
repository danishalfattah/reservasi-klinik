import { NextRequest } from 'next/server';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { PaymentService } from '@/services/payment.service';
import { apiSuccess } from '@/lib/api-response';
import { canAccessUser, requireRole } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';
import { handleRouteError } from '@/lib/route-error';

const paymentService = new PaymentService(new PaymentRepository(), new ReservationRepository());

/**
 * GET /api/payments/[id]
 * Mengambil detail pembayaran berdasarkan Order ID Midtrans.
 * Berguna untuk polling status dari sisi frontend.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const payload = await requireRole(_request, ['PASIEN', 'ADMIN']);
    const { id } = await params;
    const payment = await paymentService.getPaymentStatus(id);
    if (!canAccessUser(payload, payment.reservation.pasienId)) {
      throw new UnauthorizedError('Anda tidak memiliki akses ke pembayaran ini');
    }
    return apiSuccess(payment, 200);
  } catch (error) {
    return handleRouteError(error, 'Gagal mengambil detail pembayaran', 'GET /api/payments/[id] error:');
  }
}
