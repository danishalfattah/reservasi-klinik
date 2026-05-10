import { prisma } from '@/lib/prisma';
import { type Prisma } from '@/generated/prisma/client';

export type DoctorWithUser = Prisma.DoctorGetPayload<{ include: { user: true } }>;
export type DoctorWithSchedules = Prisma.DoctorGetPayload<{ include: { user: true; schedules: true } }>;

interface CreateDoctorData {
  name: string;
  email: string;
  hashedPassword: string;
  spesialis: string;
  tarif: number;
  durasiMenit: number;
}

interface UpdateDoctorData {
  name?: string;
  spesialis?: string;
  tarif?: number;
  durasiMenit?: number;
}

export class DoctorRepository {
  async findAll(): Promise<DoctorWithUser[]> {
    return prisma.doctor.findMany({ include: { user: true }, orderBy: { user: { name: 'asc' } } });
  }

  async findById(id: string): Promise<DoctorWithUser | null> {
    return prisma.doctor.findUnique({ where: { id }, include: { user: true } });
  }

  async findByIdWithSchedules(id: string): Promise<DoctorWithSchedules | null> {
    return prisma.doctor.findUnique({ where: { id }, include: { user: true, schedules: true } });
  }

  async create(data: CreateDoctorData): Promise<DoctorWithUser> {
    return prisma.doctor.create({
      data: {
        spesialis: data.spesialis,
        tarif: data.tarif,
        durasiMenit: data.durasiMenit,
        user: {
          create: {
            name: data.name,
            email: data.email,
            password: data.hashedPassword,
            role: 'DOKTER',
          },
        },
      },
      include: { user: true },
    });
  }

  async update(id: string, data: UpdateDoctorData): Promise<DoctorWithUser> {
    const { name, ...doctorData } = data;
    await prisma.doctor.update({ where: { id }, data: doctorData });
    if (name !== undefined) {
      await prisma.doctor.update({
        where: { id },
        data: { user: { update: { name } } },
      });
    }
    return prisma.doctor.findUniqueOrThrow({ where: { id }, include: { user: true } });
  }

  async delete(id: string): Promise<void> {
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) return;
    await prisma.doctor.delete({ where: { id } });
    await prisma.user.delete({ where: { id: doctor.userId } });
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user !== null;
  }
}
