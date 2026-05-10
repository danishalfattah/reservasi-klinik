import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { ScheduleRepository } from '@/repositories/schedule.repository';

const scheduleRepo = new ScheduleRepository();

/**
 * GET /api/doctors/[id]/schedules — Ambil jadwal dokter (untuk pasien booking)
 * Endpoint ini tidak butuh auth karena hanya data jadwal (bukan data sensitif)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const schedules = await scheduleRepo.findByDoctor(id);
    return apiSuccess(schedules);
  } catch {
    return apiError('INTERNAL_ERROR', 'Gagal memuat jadwal dokter', 500);
  }
}
