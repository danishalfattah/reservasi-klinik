import { ZodError } from 'zod';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { ScheduleRepository } from '@/repositories/schedule.repository';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { ScheduleService } from '@/services/schedule.service';
import { updateScheduleSchema } from '@/validators/schedule.validator';

const scheduleService = new ScheduleService(new ScheduleRepository(), new DoctorRepository());

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    await requireRole(req, ['ADMIN', 'DOKTER']);
    const { id } = await params;
    const body = await req.json();
    const schedule = await scheduleService.updateSchedule(id, updateScheduleSchema.parse(body));
    return apiSuccess(schedule);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    if (err instanceof ZodError) return apiError('VALIDATION_ERROR', 'Input tidak valid', 400, err.issues);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    await requireRole(_req, ['ADMIN', 'DOKTER']);
    const { id } = await params;
    await scheduleService.deleteSchedule(id);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
