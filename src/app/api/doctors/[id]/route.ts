import { NextRequest } from 'next/server';

import { apiSuccess, apiError } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { DoctorService } from '@/services/doctor.service';

const doctorService = new DoctorService(new DoctorRepository());

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const doctor = await doctorService.getDoctorById(id);
    return apiSuccess(doctor);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    console.error('GET /api/doctors/[id] error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
