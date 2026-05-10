import { ZodError } from 'zod';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { DoctorService } from '@/services/doctor.service';
import { createDoctorSchema } from '@/validators/doctor.validator';

const doctorService = new DoctorService(new DoctorRepository());

export async function GET(req: NextRequest): Promise<Response> {
  try {
    await requireRole(req, ['ADMIN']);
    const doctors = await doctorService.listDoctors();
    return apiSuccess(doctors);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    console.error('GET /api/admin/doctors error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    await requireRole(req, ['ADMIN']);
    const body = await req.json();
    const doctor = await doctorService.createDoctor(createDoctorSchema.parse(body));
    return apiSuccess(doctor, 201);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    if (err instanceof ZodError) return apiError('VALIDATION_ERROR', 'Input tidak valid', 400, err.issues);
    console.error('POST /api/admin/doctors error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
