import { NextRequest } from 'next/server';
import { ReservationRepository } from '@/repositories/reservation.repository';
import { UserRepository } from '@/repositories/user.repository';
import { apiSuccess } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { handleRouteError } from '@/lib/route-error';
import { NotFoundError } from '@/lib/errors';

const reservationRepo = new ReservationRepository();
const userRepo = new UserRepository();

async function getDoctorId(userId: string): Promise<string> {
  const user = await userRepo.findByIdWithDoctor(userId);
  const doctorId = user?.doctorProfile?.id;
  if (!doctorId) throw new NotFoundError('Profil dokter tidak ditemukan');
  return doctorId;
}

function parseTanggal(raw: string | null): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const payload = await requireRole(request, ['DOKTER']);
    const doctorId = await getDoctorId(payload.userId);
    const tanggal = parseTanggal(request.nextUrl.searchParams.get('tanggal'));
    const reservations = await reservationRepo.findAllByDoctorId(doctorId, tanggal);
    return apiSuccess(reservations);
  } catch (err) {
    return handleRouteError(err, 'Gagal memuat reservasi dokter', 'GET /api/dokter/reservasi error:');
  }
}
