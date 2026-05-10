import { NextRequest } from 'next/server';
import { PaymentRepository } from '@/repositories/payment.repository';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { PaymentService } from '@/services/payment.service';
import { apiSuccess } from '@/lib/api-response';
import { handleRouteError } from '@/lib/route-error';
import { midtransWebhookSchema } from '@/validators/payment.validator';

const paymentRepo = new PaymentRepository();
const reservationRepo = new ReservationRepository();
const paymentService = new PaymentService(paymentRepo, reservationRepo);

/**
 * POST /api/payments/webhook
 * Menerima notifikasi dari Midtrans secara asynchronous.
 * Harus me-return 200 OK ke Midtrans agar Midtrans tahu notifikasi diterima.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const notification = midtransWebhookSchema.parse(await request.json());
    await paymentService.handleWebhook(notification);
    return apiSuccess({ received: true }, 200);
  } catch (error) {
    return handleRouteError(error, 'Gagal memproses webhook', 'POST /api/payments/webhook error:');
  }
}
