import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  spesialis: z.string().min(2, 'Spesialisasi tidak boleh kosong'),
  tarif: z.number().positive('Tarif harus lebih dari 0'),
  durasiMenit: z.number().positive('Durasi harus lebih dari 0'),
});

export const updateDoctorSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  spesialis: z.string().min(2, 'Spesialisasi tidak boleh kosong').optional(),
  tarif: z.number().positive('Tarif harus lebih dari 0').optional(),
  durasiMenit: z.number().positive('Durasi harus lebih dari 0').optional(),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorSchema>;
