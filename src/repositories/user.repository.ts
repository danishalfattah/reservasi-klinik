import { prisma } from '@/lib/prisma';
import { type Prisma, type Role, type User, type Doctor } from '@/generated/prisma/client';

export type UserWithReservationCount = Prisma.UserGetPayload<{ include: { _count: { select: { reservations: true } } } }>;

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: Role;
}

export interface CreateDoctorProfileInput {
  userId: string;
  spesialis: string;
  tarif: number;
  durasiMenit: number;
}

export type UserWithDoctor = Prisma.UserGetPayload<{ include: { doctorProfile: true } }>;

interface UpdateDoctorData {
  spesialis?: string;
  tarif?: number;
  durasiMenit?: number;
}

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    return prisma.user.create({ data: input });
  }

  async createWithDoctorProfile(
    userInput: CreateUserInput,
    doctorInput: Omit<CreateDoctorProfileInput, 'userId'>
  ): Promise<UserWithDoctor> {
    return prisma.user.create({
      data: {
        ...userInput,
        doctorProfile: { create: doctorInput },
      },
      include: { doctorProfile: true },
    });
  }

  async findByIdWithDoctor(id: string): Promise<UserWithDoctor | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { doctorProfile: true },
    });
  }

  async updateById(
    id: string,
    data: Partial<Pick<CreateUserInput, 'name' | 'phone'>>
  ): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async updateDoctorProfile(
    userId: string,
    data: UpdateDoctorData
  ): Promise<Doctor> {
    return prisma.doctor.update({ where: { userId }, data });
  }

  async findAllByRole(role: Role): Promise<UserWithReservationCount[]> {
    return prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { reservations: true } } },
    });
  }
}
