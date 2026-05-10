import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  phone: z.string().optional(),
});

export const updateDoctorProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  phone: z.string().optional(),
  spesialis: z.string().min(2, 'Spesialisasi tidak boleh kosong').optional(),
  tarif: z.number().positive('Tarif harus lebih dari 0').optional(),
  durasiMenit: z.number().positive('Durasi harus lebih dari 0').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileSchema>;
