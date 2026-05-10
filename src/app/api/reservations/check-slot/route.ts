import { NextRequest } from 'next/server';
import { ReservationService } from '@/services/reservation.service';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { UserRepository } from '@/repositories/user.repository';
import { PaymentRepository } from '@/repositories/payment.repository';
import { PaymentService } from '@/services/payment.service';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { handleRouteError } from '@/lib/route-error';
import { z } from 'zod';

const reservationRepo = new ReservationRepository();
const doctorRepo = new DoctorRepository();
const userRepo = new UserRepository();
const paymentRepo = new PaymentRepository();
const paymentService = new PaymentService(paymentRepo, reservationRepo);
const service = new ReservationService(reservationRepo, doctorRepo, userRepo, paymentService);

const checkSlotSchema = z.object({
  doctorId: z.string().min(1, 'Dokter ID tidak boleh kosong'),
  tanggal: z.date().or(z.string().pipe(z.coerce.date())),
  jam: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam tidak valid (HH:MM)'),
});

/**
 * POST /api/reservations/check-slot
 * Cek ketersediaan slot dan hitung estimasi antrian (tanpa membuat reservasi).
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    await requireRole(request, ['PASIEN']);
    const body = await request.json();

    const validation = checkSlotSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        'VALIDATION_ERROR',
        'Validasi gagal',
        400,
        validation.error.flatten().fieldErrors
      );
    }

    const { doctorId, jam } = validation.data;
    let { tanggal } = validation.data;

    if (typeof tanggal === 'string') {
      tanggal = new Date(tanggal);
    }

    const tersedia = await service.cekKetersediaanSlot(doctorId, tanggal, jam);

    const estimasi = tersedia
      ? await service.hitungEstimasiAntrian({ doctorId, tanggal, jam })
      : null;
    return apiSuccess({ tersedia, estimasi }, 200);
  } catch (error) {
    return handleRouteError(error, 'Gagal mengecek ketersediaan slot', 'POST /api/reservations/check-slot error:');
  }
}
