import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { JAM_OPERASIONAL } from '@/lib/constants';
import { ScheduleRepository } from '@/repositories/schedule.repository';
import { DoctorRepository } from '@/repositories/doctor.repository';
import type { Schedule } from '@/generated/prisma/client';
import type { CreateScheduleInput, UpdateScheduleInput } from '@/validators/schedule.validator';

function validasiJamOperasional(hari: number, jamMulai: string, jamSelesai: string): void {
  if (jamMulai >= jamSelesai) {
    throw new ValidationError('JAM_INVALID', 'Jam mulai harus lebih awal dari jam selesai');
  }

  const ops = JAM_OPERASIONAL[hari];
  if (!ops) throw new ValidationError('KLINIK_TUTUP', 'Klinik tutup pada hari Minggu');
  if (jamMulai < ops.buka || jamSelesai > ops.tutup) {
    throw new ValidationError('JAM_DILUAR_OPERASIONAL', `Jam di luar jam operasional (${ops.buka}–${ops.tutup})`);
  }
}

interface OverlapArgs { doctorId: string; hari: number; jamMulai: string; jamSelesai: string; excludeId?: string }

async function cekOverlap(repo: ScheduleRepository, args: OverlapArgs): Promise<void> {
  const { doctorId, hari, jamMulai, jamSelesai, excludeId } = args;
  const overlapping = await repo.findOverlapping(doctorId, { hari, jamMulai, jamSelesai }, excludeId);
  if (overlapping.length > 0) {
    throw new ConflictError('JADWAL_OVERLAP', 'Jadwal bertabrakan dengan jadwal lain di hari yang sama');
  }
}

export class ScheduleService {
  constructor(
    private scheduleRepo: ScheduleRepository,
    private doctorRepo: DoctorRepository
  ) {}

  async getSchedules(doctorId: string): Promise<Schedule[]> {
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) throw new NotFoundError('Dokter tidak ditemukan');
    return this.scheduleRepo.findByDoctor(doctorId);
  }

  async addSchedule(doctorId: string, input: CreateScheduleInput): Promise<Schedule> {
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) throw new NotFoundError('Dokter tidak ditemukan');
    validasiJamOperasional(input.hari, input.jamMulai, input.jamSelesai);
    await cekOverlap(this.scheduleRepo, { doctorId, hari: input.hari, jamMulai: input.jamMulai, jamSelesai: input.jamSelesai });
    return this.scheduleRepo.create(doctorId, input);
  }

  async updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule> {
    const schedule = await this.scheduleRepo.findById(id);
    if (!schedule) throw new NotFoundError('Jadwal tidak ditemukan');
    const hari = input.hari ?? schedule.hari;
    const jamMulai = input.jamMulai ?? schedule.jamMulai;
    const jamSelesai = input.jamSelesai ?? schedule.jamSelesai;
    validasiJamOperasional(hari, jamMulai, jamSelesai);
    await cekOverlap(this.scheduleRepo, { doctorId: schedule.doctorId, hari, jamMulai, jamSelesai, excludeId: id });
    return this.scheduleRepo.update(id, { hari, jamMulai, jamSelesai });
  }

  async deleteSchedule(id: string): Promise<void> {
    const schedule = await this.scheduleRepo.findById(id);
    if (!schedule) throw new NotFoundError('Jadwal tidak ditemukan');
    await this.scheduleRepo.delete(id);
  }
}
