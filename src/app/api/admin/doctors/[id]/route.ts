import { ZodError } from 'zod';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { DoctorService } from '@/services/doctor.service';
import { updateDoctorSchema } from '@/validators/doctor.validator';

const doctorService = new DoctorService(new DoctorRepository());

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    await requireRole(req, ['ADMIN']);
    const { id } = await params;
    const body = await req.json();
    const doctor = await doctorService.updateDoctor(id, updateDoctorSchema.parse(body));
    return apiSuccess(doctor);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    if (err instanceof ZodError) return apiError('VALIDATION_ERROR', 'Input tidak valid', 400, err.issues);
    console.error('PATCH /api/admin/doctors/[id] error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    await requireRole(_req, ['ADMIN']);
    const { id } = await params;
    await doctorService.deleteDoctor(id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    console.error('DELETE /api/admin/doctors/[id] error:', err);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
