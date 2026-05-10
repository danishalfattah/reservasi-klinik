import { apiSuccess, apiError } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { DoctorService } from '@/services/doctor.service';

const doctorService = new DoctorService(new DoctorRepository());

export async function GET(): Promise<Response> {
  try {
    const doctors = await doctorService.listDoctors();
    return apiSuccess(doctors);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    console.error('GET /api/doctors error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
