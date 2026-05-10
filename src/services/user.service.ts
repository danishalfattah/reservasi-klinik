import { NotFoundError } from '@/lib/errors';
import {
  UserRepository,
  type UserWithDoctor,
} from '@/repositories/user.repository';
import type {
  UpdateProfileInput,
  UpdateDoctorProfileInput,
} from '@/validators/user.validator';

async function requireUser(
  userRepo: UserRepository,
  userId: string
): Promise<UserWithDoctor> {
  const user = await userRepo.findByIdWithDoctor(userId);
  if (!user) throw new NotFoundError('Pengguna tidak ditemukan');
  return user;
}

async function applyUserFieldUpdates(
  userRepo: UserRepository,
  userId: string,
  input: { name?: string; phone?: string }
): Promise<void> {
  if (input.name === undefined && input.phone === undefined) return;
  await userRepo.updateById(userId, { name: input.name, phone: input.phone });
}

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getProfile(userId: string): Promise<UserWithDoctor> {
    return requireUser(this.userRepo, userId);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<UserWithDoctor> {
    await requireUser(this.userRepo, userId);
    await applyUserFieldUpdates(this.userRepo, userId, input);
    return this.userRepo.findByIdWithDoctor(userId) as Promise<UserWithDoctor>;
  }

  async updateDoctorProfile(
    userId: string,
    input: UpdateDoctorProfileInput
  ): Promise<UserWithDoctor> {
    await requireUser(this.userRepo, userId);
    await applyUserFieldUpdates(this.userRepo, userId, input);

    const { spesialis, tarif, durasiMenit } = input;
    const hasDoctorData = spesialis !== undefined || tarif !== undefined || durasiMenit !== undefined;
    if (hasDoctorData) {
      await this.userRepo.updateDoctorProfile(userId, { spesialis, tarif, durasiMenit });
    }

    return this.userRepo.findByIdWithDoctor(userId) as Promise<UserWithDoctor>;
  }
}
