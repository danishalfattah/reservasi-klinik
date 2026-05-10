import { ZodError } from 'zod';
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { requireRole } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { ScheduleRepository } from '@/repositories/schedule.repository';
import { DoctorRepository } from '@/repositories/doctor.repository';
import { ScheduleService } from '@/services/schedule.service';
import { createScheduleSchema } from '@/validators/schedule.validator';

const scheduleService = new ScheduleService(new ScheduleRepository(), new DoctorRepository());

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    await requireRole(_req, ['ADMIN', 'DOKTER']);
    const { id } = await params;
    const schedules = await scheduleService.getSchedules(id);
    return apiSuccess(schedules);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  try {
    await requireRole(req, ['ADMIN', 'DOKTER']);
    const { id } = await params;
    const body = await req.json();
    const schedule = await scheduleService.addSchedule(id, createScheduleSchema.parse(body));
    return apiSuccess(schedule, 201);
  } catch (err) {
    if (err instanceof AppError) return apiError(err.code, err.message, err.statusCode);
    if (err instanceof ZodError) return apiError('VALIDATION_ERROR', 'Input tidak valid', 400, err.issues);
    return apiError('INTERNAL_ERROR', 'Terjadi kesalahan sistem', 500);
  }
}
