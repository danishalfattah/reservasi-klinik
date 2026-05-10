import { ConflictError, NotFoundError } from '@/lib/errors';
import { hashPassword } from '@/lib/bcrypt';
import { DoctorRepository, type DoctorWithUser } from '@/repositories/doctor.repository';
import type { CreateDoctorInput, UpdateDoctorInput } from '@/validators/doctor.validator';

async function requireDoctor(repo: DoctorRepository, id: string): Promise<DoctorWithUser> {
  const doctor = await repo.findById(id);
  if (!doctor) throw new NotFoundError('Dokter tidak ditemukan');
  return doctor;
}

export class DoctorService {
  constructor(private doctorRepo: DoctorRepository) {}

  async listDoctors(): Promise<DoctorWithUser[]> {
    return this.doctorRepo.findAll();
  }

  async getDoctorById(id: string): Promise<DoctorWithUser> {
    return requireDoctor(this.doctorRepo, id);
  }

  async createDoctor(input: CreateDoctorInput): Promise<DoctorWithUser> {
    const exists = await this.doctorRepo.emailExists(input.email);
    if (exists) throw new ConflictError('EMAIL_ALREADY_EXISTS', 'Email sudah terdaftar');
    const hashedPassword = await hashPassword(input.password);
    return this.doctorRepo.create({
      name: input.name,
      email: input.email,
      hashedPassword,
      spesialis: input.spesialis,
      tarif: input.tarif,
      durasiMenit: input.durasiMenit,
    });
  }

  async updateDoctor(id: string, input: UpdateDoctorInput): Promise<DoctorWithUser> {
    await requireDoctor(this.doctorRepo, id);
    return this.doctorRepo.update(id, input);
  }

  async deleteDoctor(id: string): Promise<void> {
    await requireDoctor(this.doctorRepo, id);
    await this.doctorRepo.delete(id);
  }
}
