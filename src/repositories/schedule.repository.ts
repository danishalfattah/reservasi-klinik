import { prisma } from '@/lib/prisma';
import { type Schedule } from '@/generated/prisma/client';

interface ScheduleData {
  hari?: number;
  jamMulai?: string;
  jamSelesai?: string;
}

export class ScheduleRepository {
  async findByDoctor(doctorId: string): Promise<Schedule[]> {
    return prisma.schedule.findMany({ where: { doctorId }, orderBy: [{ hari: 'asc' }, { jamMulai: 'asc' }] });
  }

  async findById(id: string): Promise<Schedule | null> {
    return prisma.schedule.findUnique({ where: { id } });
  }

  async findOverlapping(doctorId: string, slot: { hari: number; jamMulai: string; jamSelesai: string }, excludeId?: string): Promise<Schedule[]> {
    const existing = await prisma.schedule.findMany({ where: { doctorId, hari: slot.hari } });
    return existing.filter((s: Schedule) => {
      if (excludeId && s.id === excludeId) return false;
      return slot.jamMulai < s.jamSelesai && slot.jamSelesai > s.jamMulai;
    });
  }

  async create(doctorId: string, data: Required<ScheduleData>): Promise<Schedule> {
    return prisma.schedule.create({ data: { doctorId, ...data } });
  }

  async update(id: string, data: ScheduleData): Promise<Schedule> {
    return prisma.schedule.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.schedule.delete({ where: { id } });
  }
}
